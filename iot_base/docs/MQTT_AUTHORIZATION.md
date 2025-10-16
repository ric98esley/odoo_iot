# MQTT Authorization System

This document describes the MQTT topic-based authorization system for the IoT Base
module.

## Overview

The authorization system controls which MQTT topics users and devices can **publish** to
or **subscribe** from. It integrates with EMQX via a webhook endpoint.

## Architecture

```
EMQX Broker
    ↓
POST /iot/acl/<token>
    ↓
Check iot.permission table
    ↓
Response: allow/deny/ignore
```

## Models

### iot.permission

Defines topic access permissions for credentials.

**Fields:**

- `iot_credential_id` (Many2one): Link to `iot.credentials`
- `username` (Char): Username (computed from credential)
- `topic` (Char): MQTT topic pattern (supports wildcards)
- `action` (Selection): `publish`, `subscribe`, or `all`
- `active` (Boolean): Enable/disable permission

**Constraints:**

- Unique combination of credential + topic + action
- Cannot have duplicate permissions

## API Endpoint

### POST /iot/acl/<token>

EMQX authorization webhook endpoint.

#### Request

**URL:** `POST http://your-odoo-server/iot/acl/<token>`

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "username": "user_admin",
  "topic": "sensors/temperature",
  "action": "publish"
}
```

**Parameters:**

- `username` (required): Username from `iot.credentials`
- `topic` (required): MQTT topic being accessed
- `action` (required): `"publish"` or `"subscribe"`

#### Response

**Success (Permission Granted) - Status 200:**

```json
{
  "result": "allow"
}
```

**Denied (No Permission) - Status 403:**

```json
{
  "result": "deny",
  "reason": "No matching topic permission"
}
```

**Ignored (Invalid Request) - Status 403:**

```json
{
  "result": "ignore",
  "error": "Username is required"
}
```

**Response Codes:**

- `200`: Permission allowed
- `403`: Permission denied or ignored

## Authorization Logic

### 1. Superuser Check

If the credential has `is_superuser=True`, **allow all topics** immediately.

```python
if credential.is_superuser:
    return {"result": "allow"}
```

### 2. Permission Lookup

Search for active permissions matching:

- Credential ID
- Action (exact match or "all")

### 3. Topic Matching

Check if any permission's topic pattern matches the requested topic using MQTT
wildcards.

### 4. Decision

- **Match found:** Allow (200)
- **No match:** Deny (403)
- **Error/Invalid:** Ignore (403)

## MQTT Topic Wildcards

### Single-Level Wildcard: `+`

Matches **one level** in the topic hierarchy.

**Examples:**

| Pattern          | Matches                  | Doesn't Match                |
| ---------------- | ------------------------ | ---------------------------- |
| `sensors/+/temp` | `sensors/room1/temp`     | `sensors/room1/temp/current` |
| `+/status`       | `device1/status`         | `device1/online/status`      |
| `home/+/+/temp`  | `home/floor1/room1/temp` | `home/floor1/temp`           |

### Multi-Level Wildcard: `#`

Matches **multiple levels** (zero or more) in the topic hierarchy. Must be the last
character.

**Examples:**

| Pattern         | Matches                                                                | Doesn't Match       |
| --------------- | ---------------------------------------------------------------------- | ------------------- |
| `sensors/#`     | `sensors/temp`<br>`sensors/room1/temp`<br>`sensors/room1/temp/current` | `controls/temp`     |
| `home/floor1/#` | `home/floor1/room1`<br>`home/floor1/room1/temp`                        | `home/floor2/room1` |
| `#`             | Everything                                                             | Nothing             |

### Pattern Validation

The system converts MQTT patterns to regex:

- `+` → `[^/]+` (anything except `/`)
- `#` → `.*` (anything including `/`)

**Examples:**

```python
_mqtt_topic_matches("sensors/+/temp", "sensors/room1/temp")      # True
_mqtt_topic_matches("sensors/#", "sensors/room1/temp/current")   # True
_mqtt_topic_matches("sensors/+/temp", "sensors/room1/hum")       # False
```

## Configuration via UI

### Creating Permissions

1. Navigate to **IoT → Topic Permissions**
2. Click **Create**
3. Fill in:
   - **IoT Credential:** Select user/device
   - **Topic:** Enter topic pattern (e.g., `sensors/+/temp`)
   - **Action:** Select `publish`, `subscribe`, or `all`
   - **Active:** Check to enable
4. Click **Save**

### Examples

#### Allow user to subscribe to all sensor topics

```
Credential: user_john
Topic: sensors/#
Action: subscribe
Active: ✓
```

#### Allow device to publish temperature data

```
Credential: device_temp_sensor_01
Topic: sensors/+/temperature
Action: publish
Active: ✓
```

#### Allow admin full access

```
Credential: user_admin
Topic: #
Action: all
Active: ✓
```

Or simply set `is_superuser=True` on the credential.

## Configuration via Python

### Create Permission

```python
# Create permission for user to subscribe to sensors
permission = env['iot.permission'].create({
    'iot_credential_id': credential.id,
    'topic': 'sensors/#',
    'action': 'subscribe',
    'active': True,
})
```

### Bulk Create Permissions

```python
# Allow device to publish to multiple topics
credential = env['iot.credentials'].search([('name', '=', 'device_sensor_01')], limit=1)

topics = [
    'sensors/temperature',
    'sensors/humidity',
    'sensors/pressure',
]

for topic in topics:
    env['iot.permission'].create({
        'iot_credential_id': credential.id,
        'topic': topic,
        'action': 'publish',
        'active': True,
    })
```

### Check Permissions

```python
# Get all permissions for a credential
credential = env['iot.credentials'].search([('name', '=', 'user_john')], limit=1)
permissions = env['iot.permission'].search([
    ('iot_credential_id', '=', credential.id),
    ('active', '=', True),
])

for perm in permissions:
    print(f"{perm.action}: {perm.topic}")
```

## EMQX Configuration

### Configure Authorization Webhook

In EMQX configuration (`emqx.conf` or via Dashboard):

```erlang
## HTTP Authorization
authorization {
  type = http
  method = post
  url = "http://your-odoo-server/iot/acl/your-secret-token"
  headers {
    "Content-Type" = "application/json"
  }
  body {
    username = "${username}"
    topic = "${topic}"
    action = "${action}"
  }

  ## Response handling
  ## HTTP 200 with {"result": "allow"} → Allow
  ## HTTP 403 or {"result": "deny"} → Deny
  ## Any error → Ignore (use next authorizer or deny by default)
}
```

### Testing Authorization

#### Using curl

```bash
# Test publish permission
curl -X POST http://localhost:8069/iot/acl/test_token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user_admin",
    "topic": "sensors/temperature",
    "action": "publish"
  }'

# Expected response (200):
# {"result": "allow"}
```

#### Using MQTT Client

```bash
# Subscribe (should check subscribe permission)
mosquitto_sub -h localhost -p 1883 \
  -u "user_john" -P "password123" \
  -t "sensors/#"

# Publish (should check publish permission)
mosquitto_pub -h localhost -p 1883 \
  -u "device_sensor_01" -P "device_pass" \
  -t "sensors/room1/temperature" \
  -m '{"value": 23.5}'
```

## Security Best Practices

### 1. Principle of Least Privilege

Grant only the minimum permissions needed:

```python
# ✓ Good: Specific topics
topic = 'sensors/temperature'

# ✗ Bad: Too broad
topic = '#'
```

### 2. Use Wildcards Wisely

```python
# ✓ Good: Controlled wildcard
topic = 'sensors/+/temperature'  # Only temperature sensors

# ⚠️ Caution: Broad wildcard
topic = 'sensors/#'  # All sensor data
```

### 3. Separate Publish and Subscribe

Don't use `action='all'` unless necessary:

```python
# ✓ Good: Separate permissions
env['iot.permission'].create({
    'iot_credential_id': sensor.id,
    'topic': 'sensors/temp',
    'action': 'publish',  # Can only publish
})

env['iot.permission'].create({
    'iot_credential_id': dashboard.id,
    'topic': 'sensors/#',
    'action': 'subscribe',  # Can only subscribe
})
```

### 4. Use Superuser Sparingly

Only admin credentials should be superusers:

```python
# ✓ Good: Regular user with specific permissions
user.is_superuser = False
# Create specific permissions

# ✗ Bad: Too many superusers
device.is_superuser = True  # Device shouldn't be superuser
```

### 5. Audit Permissions Regularly

```python
# Find all superusers
superusers = env['iot.credentials'].search([('is_superuser', '=', True)])

# Find broad permissions
broad = env['iot.permission'].search([('topic', 'in', ['#', '+/#'])])
```

## Common Patterns

### Pattern 1: Device Publishing Sensor Data

```python
# Device can only publish its own sensor data
env['iot.permission'].create({
    'iot_credential_id': device_credential.id,
    'topic': f'sensors/{device_id}/#',
    'action': 'publish',
})
```

### Pattern 2: User Monitoring Dashboard

```python
# User can subscribe to all sensors but not publish
env['iot.permission'].create({
    'iot_credential_id': user_credential.id,
    'topic': 'sensors/#',
    'action': 'subscribe',
})
```

### Pattern 3: Control System

```python
# Control system can publish commands
env['iot.permission'].create({
    'iot_credential_id': control_system.id,
    'topic': 'commands/#',
    'action': 'publish',
})

# Devices can subscribe to their commands
env['iot.permission'].create({
    'iot_credential_id': device_credential.id,
    'topic': f'commands/{device_id}/#',
    'action': 'subscribe',
})
```

### Pattern 4: Bidirectional Communication

```python
# Device publishes status
env['iot.permission'].create({
    'iot_credential_id': device_credential.id,
    'topic': f'devices/{device_id}/status',
    'action': 'publish',
})

# Device subscribes to commands
env['iot.permission'].create({
    'iot_credential_id': device_credential.id,
    'topic': f'devices/{device_id}/commands',
    'action': 'subscribe',
})
```

## Troubleshooting

### Permission Denied When Expected to Allow

**Check:**

1. **Permission exists:**

   ```python
   env['iot.permission'].search([
       ('username', '=', 'user_john'),
       ('action', '=', 'publish'),
   ])
   ```

2. **Permission is active:**

   ```python
   permission.active  # Should be True
   ```

3. **Topic pattern matches:**

   ```python
   # Test in Python console
   controller = env['iot_base.controllers.api'].IotDevicesController()
   controller._mqtt_topic_matches('sensors/+/temp', 'sensors/room1/temp')
   # Should return True
   ```

4. **Credential exists:**
   ```python
   env['iot.credentials'].search([('name', '=', 'user_john')])
   ```

### Superuser Not Working

**Check:**

```python
credential = env['iot.credentials'].search([('name', '=', 'user_admin')])
print(credential.is_superuser)  # Should be True
```

### Authorization Endpoint Not Responding

**Check:**

1. Odoo server is running
2. Route is accessible: `curl http://localhost:8069/iot/acl/test`
3. Check Odoo logs for errors

## Performance Considerations

### Indexing

The model has indexes on:

- `iot_credential_id`
- `username` (stored computed field)

### Query Optimization

The authorization endpoint uses:

1. Single credential lookup
2. Filtered permission search (credential + action + active)
3. In-memory topic matching (regex)

### Caching (Future Enhancement)

Consider caching permission checks:

```python
@lru_cache(maxsize=1000)
def check_permission(username, topic, action):
    # Cache results for frequently checked permissions
    pass
```

## Related Documentation

- `mqtt_authentication.md` - Authentication system
- `MQTT_QUICKSTART.md` - Quick start guide
- EMQX Authorization: https://www.emqx.io/docs/en/v5.0/access-control/authn/authn.html
