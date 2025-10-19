# Company-Scoped MQTT Topics

## Overview

The IoT Base module implements automatic company-scoped topic permissions. When users or
devices are created, they automatically receive permissions to publish and subscribe to
topics within their company's namespace.

## How It Works

### Topic Namespace Pattern

Topics are namespaced by company ID:

```
{company_id}/{subtopic}
```

**Examples:**

- Company ID 1: `1/sensors/temperature`
- Company ID 2: `2/devices/actuators`
- Company ID 5: `5/alerts/critical`

### Automatic Permissions

When a user or device is created, the system automatically creates two permissions:

1. **Subscribe Permission:** `{company_id}/#`
2. **Publish Permission:** `{company_id}/#`

This allows full access to all topics within the company namespace.

## Implementation Details

### For Users

**Trigger:** When `get_or_create_iot_credentials()` is called (e.g., accessing
`/iot/app`)

**Process:**

1. User accesses IoT app
2. System checks for existing credentials
3. If none exist:
   - Creates `iot.credentials` record
   - Calls `_create_default_company_permissions()`
   - Creates two `iot.permission` records:
     - Topic: `{company_id}/#`, Action: `subscribe`
     - Topic: `{company_id}/#`, Action: `publish`

**Example:**

```python
# User in Company ID 1
user = env.user  # Company ID: 1
credentials = user.get_or_create_iot_credentials()

# Automatically created permissions:
# - Topic: "1/#", Action: "subscribe"
# - Topic: "1/#", Action: "publish"
```

### For Devices

**Trigger:** When a device is created via `create()` method

**Process:**

1. Device record is created
2. System automatically calls `_create_device_credentials()`
3. Generates unique username: `device_{name}`
4. Creates `iot.credentials` record
5. Calls `_create_default_company_permissions()`
6. Creates two `iot.permission` records

**Example:**

```python
# Create device in Company ID 2
device = env['iot.devices'].create({
    'name': 'Temperature Sensor 01',
    'device_type': device_type.id,
    'company_id': 2,
})

# Automatically created:
# - Credentials: username="device_temperature_sensor_01", password=<random>
# - Permissions:
#   * Topic: "2/#", Action: "subscribe"
#   * Topic: "2/#", Action: "publish"
```

## Multi-Company Isolation

Each company has its own isolated topic namespace, ensuring data separation.

### Example Scenario

**Company A (ID=1):**

- User: `user_alice` → Can access topics: `1/#`
- Device: `device_sensor_a` → Can access topics: `1/#`

**Company B (ID=2):**

- User: `user_bob` → Can access topics: `2/#`
- Device: `device_sensor_b` → Can access topics: `2/#`

**Result:**

- Alice cannot access Bob's topics (`2/#`)
- Bob cannot access Alice's topics (`1/#`)
- Devices from Company A cannot communicate with devices from Company B

## Topic Structure Best Practices

### Recommended Structure

```
{company_id}/
├── sensors/
│   ├── {device_id}/
│   │   ├── temperature
│   │   ├── humidity
│   │   └── pressure
│   └── {location}/
│       └── {measurement}
├── devices/
│   ├── {device_id}/
│   │   ├── status
│   │   ├── commands
│   │   └── telemetry
├── alerts/
│   ├── critical
│   ├── warning
│   └── info
└── system/
    ├── heartbeat
    └── logs
```

### Examples

**Company 1 - Temperature Sensor:**

```
1/sensors/device_temp_01/temperature
1/sensors/device_temp_01/status
1/alerts/critical
```

**Company 2 - Smart Home:**

```
2/devices/thermostat_main/status
2/devices/thermostat_main/commands
2/sensors/living_room/temperature
2/alerts/warning
```

## Usage Examples

### Python: Check User Permissions

```python
# Get user's credentials
user = env.user
credentials = user.get_or_create_iot_credentials()

# Get user's permissions
permissions = env['iot.permission'].search([
    ('iot_credential_id.user_id', '=', user.id),
    ('active', '=', True),
])

for perm in permissions:
    print(f"Topic: {perm.topic}, Action: {perm.action}")
# Output:
# Topic: 1/#, Action: subscribe
# Topic: 1/#, Action: publish
```

### Python: Check Device Permissions

```python
# Get device
device = env['iot.devices'].search([('name', '=', 'Temperature Sensor 01')], limit=1)

# Get device's permissions
permissions = env['iot.permission'].search([
    ('iot_credential_id.device_id', '=', device.id),
    ('active', '=', True),
])

for perm in permissions:
    print(f"Topic: {perm.topic}, Action: {perm.action}")
# Output:
# Topic: 2/#, Action: subscribe
# Topic: 2/#, Action: publish
```

### MQTT: Publishing with Company Namespace

```bash
# User from Company 1 publishes to company topic
mosquitto_pub -h localhost -p 1883 \
  -u "user_alice" -P "password123" \
  -t "1/sensors/room1/temperature" \
  -m '{"value": 23.5, "unit": "celsius"}'

# Device from Company 2 publishes status
mosquitto_pub -h localhost -p 1883 \
  -u "device_sensor_b" -P "device_pass" \
  -t "2/devices/sensor_b/status" \
  -m '{"online": true, "battery": 85}'
```

### MQTT: Subscribing with Company Namespace

```bash
# User subscribes to all Company 1 topics
mosquitto_sub -h localhost -p 1883 \
  -u "user_alice" -P "password123" \
  -t "1/#"

# User subscribes to specific Company 1 sensor
mosquitto_sub -h localhost -p 1883 \
  -u "user_alice" -P "password123" \
  -t "1/sensors/+/temperature"
```

## Testing Authorization

### Test 1: User Accessing Own Company Topics

```bash
# User from Company 1 accessing Company 1 topic (ALLOW)
curl -X POST http://localhost:8069/iot/acl/test_token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user_alice",
    "topic": "1/sensors/temperature",
    "action": "subscribe"
  }'
# Expected: {"result": "allow"}
```

### Test 2: User Accessing Other Company Topics

```bash
# User from Company 1 accessing Company 2 topic (DENY)
curl -X POST http://localhost:8069/iot/acl/test_token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user_alice",
    "topic": "2/sensors/temperature",
    "action": "subscribe"
  }'
# Expected: {"result": "deny", "reason": "No matching topic permission"}
```

### Test 3: Device Publishing to Company Topic

```bash
# Device from Company 2 publishing to Company 2 topic (ALLOW)
curl -X POST http://localhost:8069/iot/acl/test_token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "device_sensor_b",
    "topic": "2/devices/sensor_b/telemetry",
    "action": "publish"
  }'
# Expected: {"result": "allow"}
```

## Additional Permissions

While automatic company-scoped permissions provide baseline access, you can add more
specific permissions:

### Grant Access to Shared Topics

```python
# Allow user to access shared company topics
env['iot.permission'].create({
    'iot_credential_id': credential.id,
    'topic': 'shared/public/#',
    'action': 'subscribe',
    'active': True,
})
```

### Grant Cross-Company Access (Admin)

```python
# Allow admin to monitor all companies
env['iot.permission'].create({
    'iot_credential_id': admin_credential.id,
    'topic': '+/#',  # All companies
    'action': 'subscribe',
    'active': True,
})
```

### Restrict Device to Specific Subtopics

```python
# Device can only publish to its own telemetry
env['iot.permission'].create({
    'iot_credential_id': device_credential.id,
    'topic': f'{company_id}/devices/{device_id}/telemetry',
    'action': 'publish',
    'active': True,
})

# Archive the broader permission
broader_perm = env['iot.permission'].search([
    ('iot_credential_id', '=', device_credential.id),
    ('topic', '=', f'{company_id}/#'),
])
broader_perm.active = False
```

## Regenerating Device Credentials

Devices have a built-in action to regenerate credentials:

### Via UI

1. Navigate to **IoT → Devices**
2. Open device record
3. Click **Regenerate Credentials** button
4. Confirm action
5. New credentials are created, old ones are archived

### Via Python

```python
# Regenerate credentials for a device
device = env['iot.devices'].browse(device_id)
device.action_regenerate_credentials()

# New credentials are automatically created with company permissions
```

## Security Considerations

### Topic Namespace Benefits

1. **Isolation:** Companies cannot access each other's data
2. **Scalability:** Easy to add new companies without configuration
3. **Clarity:** Topic structure clearly shows data ownership
4. **Audit:** Easy to track which company generated which data

### Best Practices

1. **Use Company ID as Prefix:** Always start topics with company ID
2. **Document Structure:** Maintain documentation of topic hierarchy
3. **Monitor Access:** Log authorization attempts for security audit
4. **Rotate Credentials:** Regularly regenerate device credentials
5. **Principle of Least Privilege:** Grant only necessary permissions

### Audit Log Example

```python
# Log authorization attempts
env['ir.logging'].sudo().create({
    'name': 'iot.authorization',
    'type': 'server',
    'level': 'info',
    'message': f'User {username} accessed topic {topic} - {result}',
    'path': 'iot_base.controllers.api',
})
```

## Migration from Non-Scoped Topics

If you have existing deployments without company-scoped topics:

### Step 1: Update Topic Names

```python
# Old: sensors/temperature
# New: 1/sensors/temperature

old_topic = "sensors/temperature"
company_id = env.user.company_id.id
new_topic = f"{company_id}/{old_topic}"
```

### Step 2: Update Device Firmware

Update device code to publish to company-scoped topics:

```python
# Example device code
company_id = get_company_id()  # Retrieved during provisioning
topic = f"{company_id}/sensors/{device_id}/temperature"
mqtt_client.publish(topic, payload)
```

### Step 3: Update Subscriptions

Update all subscriptions to use company-scoped topics:

```python
# Old subscription
mqtt_client.subscribe("sensors/#")

# New subscription
company_id = get_company_id()
mqtt_client.subscribe(f"{company_id}/sensors/#")
```

## Troubleshooting

### Issue: User Cannot Access Company Topics

**Check company ID:**

```python
user = env.user
print(f"User Company ID: {user.company_id.id}")
```

**Check permissions:**

```python
permissions = env['iot.permission'].search([
    ('iot_credential_id.user_id', '=', user.id),
    ('active', '=', True),
])
for p in permissions:
    print(f"Topic: {p.topic}, Action: {p.action}")
```

### Issue: Device Cannot Publish

**Check device company:**

```python
device = env['iot.devices'].browse(device_id)
print(f"Device Company ID: {device.company_id.id}")
```

**Check credentials:**

```python
if not device.credential_ids:
    # Regenerate credentials
    device._create_device_credentials()
```

### Issue: Cross-Company Access Needed

**Create specific permission:**

```python
# Allow admin to access multiple companies
for company_id in [1, 2, 3]:
    env['iot.permission'].create({
        'iot_credential_id': admin_credential.id,
        'topic': f'{company_id}/#',
        'action': 'subscribe',
        'active': True,
    })
```

## Related Documentation

- `MQTT_AUTHORIZATION.md` - Full authorization system
- `AUTHORIZATION_EXAMPLES.md` - More examples
- `mqtt_authentication.md` - Authentication details
- `MQTT_QUICKSTART.md` - Quick start guide
