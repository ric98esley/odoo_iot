# MQTT Authorization Examples

Practical examples of using the MQTT authorization system.

## Quick Test

### 1. Create Test Credentials

```python
# Create test user credential
test_user = env['iot.credentials'].create({
    'name': 'test_user',
    'password': 'test123',
    'resource_type': 'user',
    'is_superuser': False,
})

# Create test device credential
test_device = env['iot.credentials'].create({
    'name': 'test_device',
    'password': 'device123',
    'resource_type': 'device',
    'is_superuser': False,
})
```

### 2. Create Permissions

```python
# User can subscribe to all sensors
env['iot.permission'].create({
    'iot_credential_id': test_user.id,
    'topic': 'sensors/#',
    'action': 'subscribe',
    'active': True,
})

# Device can publish to its sensor topics
env['iot.permission'].create({
    'iot_credential_id': test_device.id,
    'topic': 'sensors/device01/+',
    'action': 'publish',
    'active': True,
})
```

### 3. Test with curl

```bash
# Test user subscribing to sensors (should allow)
curl -X POST http://localhost:8069/iot/acl/test_token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "topic": "sensors/temperature",
    "action": "subscribe"
  }'
# Expected: {"result": "allow"}

# Test user publishing (should deny - no permission)
curl -X POST http://localhost:8069/iot/acl/test_token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "topic": "sensors/temperature",
    "action": "publish"
  }'
# Expected: {"result": "deny", "reason": "No permissions found"}

# Test device publishing (should allow)
curl -X POST http://localhost:8069/iot/acl/test_token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_device",
    "topic": "sensors/device01/temperature",
    "action": "publish"
  }'
# Expected: {"result": "allow"}
```

## Scenario 1: Smart Home

### Setup

```python
# Dashboard user - monitors all sensors
dashboard = env['iot.credentials'].create({
    'name': 'dashboard_user',
    'password': 'dash123',
    'resource_type': 'user',
})

env['iot.permission'].create({
    'iot_credential_id': dashboard.id,
    'topic': 'home/#',
    'action': 'subscribe',
})

# Temperature sensors - publish temperature data
temp_sensor = env['iot.credentials'].create({
    'name': 'temp_sensor_living',
    'password': 'sensor123',
    'resource_type': 'device',
})

env['iot.permission'].create({
    'iot_credential_id': temp_sensor.id,
    'topic': 'home/living_room/temperature',
    'action': 'publish',
})

# Smart thermostat - reads temp, publishes commands
thermostat = env['iot.credentials'].create({
    'name': 'thermostat_main',
    'password': 'thermo123',
    'resource_type': 'device',
})

# Can read all temperature sensors
env['iot.permission'].create({
    'iot_credential_id': thermostat.id,
    'topic': 'home/+/temperature',
    'action': 'subscribe',
})

# Can publish HVAC commands
env['iot.permission'].create({
    'iot_credential_id': thermostat.id,
    'topic': 'home/hvac/command',
    'action': 'publish',
})
```

### Test Commands

```bash
# Dashboard subscribes to all home topics
curl -X POST http://localhost:8069/iot/acl/test \
  -H "Content-Type: application/json" \
  -d '{"username": "dashboard_user", "topic": "home/living_room/temperature", "action": "subscribe"}'
# Result: allow

# Temp sensor publishes data
curl -X POST http://localhost:8069/iot/acl/test \
  -H "Content-Type: application/json" \
  -d '{"username": "temp_sensor_living", "topic": "home/living_room/temperature", "action": "publish"}'
# Result: allow

# Thermostat reads temperature
curl -X POST http://localhost:8069/iot/acl/test \
  -H "Content-Type: application/json" \
  -d '{"username": "thermostat_main", "topic": "home/living_room/temperature", "action": "subscribe"}'
# Result: allow

# Thermostat sends HVAC command
curl -X POST http://localhost:8069/iot/acl/test \
  -H "Content-Type: application/json" \
  -d '{"username": "thermostat_main", "topic": "home/hvac/command", "action": "publish"}'
# Result: allow
```

## Scenario 2: Industrial Monitoring

### Setup

```python
# Operator - can view all machine data
operator = env['iot.credentials'].create({
    'name': 'operator_john',
    'password': 'op123',
    'resource_type': 'user',
})

env['iot.permission'].create({
    'iot_credential_id': operator.id,
    'topic': 'factory/machines/#',
    'action': 'subscribe',
})

# Machine sensors - publish telemetry
machine1 = env['iot.credentials'].create({
    'name': 'machine_01',
    'password': 'mach123',
    'resource_type': 'device',
})

env['iot.permission'].create({
    'iot_credential_id': machine1.id,
    'topic': 'factory/machines/machine01/#',
    'action': 'publish',
})

# Supervisor - can view and send commands
supervisor = env['iot.credentials'].create({
    'name': 'supervisor_admin',
    'password': 'super123',
    'resource_type': 'user',
})

# Can view all
env['iot.permission'].create({
    'iot_credential_id': supervisor.id,
    'topic': 'factory/#',
    'action': 'subscribe',
})

# Can send commands
env['iot.permission'].create({
    'iot_credential_id': supervisor.id,
    'topic': 'factory/commands/#',
    'action': 'publish',
})
```

## Scenario 3: Multi-Tenant System

### Setup

```python
# Company A devices
company_a_device = env['iot.credentials'].create({
    'name': 'device_company_a_01',
    'password': 'compA123',
    'resource_type': 'device',
})

# Only access Company A namespace
env['iot.permission'].create({
    'iot_credential_id': company_a_device.id,
    'topic': 'company_a/#',
    'action': 'all',
})

# Company B devices
company_b_device = env['iot.credentials'].create({
    'name': 'device_company_b_01',
    'password': 'compB123',
    'resource_type': 'device',
})

# Only access Company B namespace
env['iot.permission'].create({
    'iot_credential_id': company_b_device.id,
    'topic': 'company_b/#',
    'action': 'all',
})
```

### Test Isolation

```bash
# Company A device accessing Company A topic (allow)
curl -X POST http://localhost:8069/iot/acl/test \
  -H "Content-Type: application/json" \
  -d '{"username": "device_company_a_01", "topic": "company_a/sensors/temp", "action": "publish"}'
# Result: allow

# Company A device accessing Company B topic (deny)
curl -X POST http://localhost:8069/iot/acl/test \
  -H "Content-Type: application/json" \
  -d '{"username": "device_company_a_01", "topic": "company_b/sensors/temp", "action": "publish"}'
# Result: deny
```

## Scenario 4: Role-Based Access

### Setup

```python
def create_role_permissions(credential, role):
    """Create permissions based on role"""

    if role == 'viewer':
        # Can only view sensor data
        env['iot.permission'].create({
            'iot_credential_id': credential.id,
            'topic': 'sensors/#',
            'action': 'subscribe',
        })

    elif role == 'operator':
        # Can view sensors and send basic commands
        env['iot.permission'].create({
            'iot_credential_id': credential.id,
            'topic': 'sensors/#',
            'action': 'subscribe',
        })
        env['iot.permission'].create({
            'iot_credential_id': credential.id,
            'topic': 'commands/basic/#',
            'action': 'publish',
        })

    elif role == 'admin':
        # Full access
        credential.is_superuser = True

# Create users with roles
viewer = env['iot.credentials'].create({
    'name': 'user_viewer',
    'password': 'view123',
    'resource_type': 'user',
})
create_role_permissions(viewer, 'viewer')

operator = env['iot.credentials'].create({
    'name': 'user_operator',
    'password': 'oper123',
    'resource_type': 'user',
})
create_role_permissions(operator, 'operator')

admin = env['iot.credentials'].create({
    'name': 'user_admin',
    'password': 'admin123',
    'resource_type': 'user',
})
create_role_permissions(admin, 'admin')
```

## Scenario 5: Temporary Access

### Setup

```python
# Guest user with limited time access
guest = env['iot.credentials'].create({
    'name': 'guest_temp',
    'password': 'guest123',
    'resource_type': 'user',
})

# Grant permission
permission = env['iot.permission'].create({
    'iot_credential_id': guest.id,
    'topic': 'public/sensors/#',
    'action': 'subscribe',
    'active': True,
})

# Revoke after 1 hour (manual or scheduled)
# Option 1: Deactivate permission
permission.active = False

# Option 2: Archive credential
guest.active = False
```

## Wildcard Pattern Examples

### Single Level (+)

```python
# Match: sensors/room1/temp, sensors/room2/temp
# No match: sensors/temp, sensors/room1/temp/current
topic = 'sensors/+/temp'

# Match: devices/device1/status, devices/device2/status
# No match: devices/status, devices/device1/online/status
topic = 'devices/+/status'
```

### Multi Level (#)

```python
# Match: sensors/temp, sensors/room1/temp, sensors/room1/temp/current
# No match: controls/temp
topic = 'sensors/#'

# Match everything in home namespace
topic = 'home/#'

# Match everything
topic = '#'
```

### Combined Wildcards

```python
# Match: home/floor1/room1/temp, home/floor2/room3/temp
# No match: home/floor1/temp, office/floor1/room1/temp
topic = 'home/+/+/temp'

# Match: sensors/room1/temp, sensors/room1/temp/current, sensors/room1/humidity
# No match: sensors/temp, controls/room1/temp
topic = 'sensors/+/#'
```

## Testing Script

```python
def test_authorization(username, topic, action):
    """Test authorization for a username/topic/action"""
    controller = env['http.controllers.api'].IotDevicesController()

    # Simulate request
    class MockRequest:
        def get_json_data(self):
            return {
                'username': username,
                'topic': topic,
                'action': action,
            }

        def make_json_response(self, data, status=200):
            return {'data': data, 'status': status}

    # Mock request object
    import odoo.http as http
    original_request = http.request
    http.request = MockRequest()

    try:
        result = controller.authorize_topic(token='test')
        print(f"Username: {username}")
        print(f"Topic: {topic}")
        print(f"Action: {action}")
        print(f"Result: {result}")
        print()
    finally:
        http.request = original_request

# Run tests
test_authorization('test_user', 'sensors/temperature', 'subscribe')
test_authorization('test_device', 'sensors/device01/temp', 'publish')
test_authorization('test_user', 'admin/config', 'publish')  # Should deny
```

## Common Issues and Solutions

### Issue: Permission not working

```python
# Debug: Check if permission exists and is active
credential = env['iot.credentials'].search([('name', '=', 'test_user')])
permissions = env['iot.permission'].search([
    ('iot_credential_id', '=', credential.id),
    ('active', '=', True),
])
for p in permissions:
    print(f"Topic: {p.topic}, Action: {p.action}")
```

### Issue: Wildcard not matching

```python
# Test topic matching
controller = env.ref('iot_base.iot_devices_controller')
pattern = 'sensors/+/temp'
topic = 'sensors/room1/temp'
matches = controller._mqtt_topic_matches(pattern, topic)
print(f"Pattern '{pattern}' matches '{topic}': {matches}")
```

### Issue: Superuser not being applied

```python
# Check superuser status
credential = env['iot.credentials'].search([('name', '=', 'admin')])
print(f"Is superuser: {credential.is_superuser}")

# Set superuser
credential.is_superuser = True
```

## Performance Testing

```python
import time

def benchmark_authorization(iterations=1000):
    """Benchmark authorization performance"""

    credential = env['iot.credentials'].search([], limit=1)

    # Create test permission
    permission = env['iot.permission'].create({
        'iot_credential_id': credential.id,
        'topic': 'test/#',
        'action': 'publish',
    })

    start = time.time()
    for i in range(iterations):
        # Simulate authorization check
        permissions = env['iot.permission'].search([
            ('iot_credential_id', '=', credential.id),
            ('active', '=', True),
            ('action', 'in', ['publish', 'all']),
        ])
    end = time.time()

    print(f"Checked {iterations} authorizations in {end-start:.2f}s")
    print(f"Average: {(end-start)/iterations*1000:.2f}ms per check")

    permission.unlink()

benchmark_authorization()
```

## Next Steps

1. Review `MQTT_AUTHORIZATION.md` for complete documentation
2. Configure EMQX to use the authorization webhook
3. Test with real MQTT clients
4. Monitor authorization logs in Odoo
5. Adjust permissions as needed for your use case
