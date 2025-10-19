# Device Topic Structure

## Overview

Devices in the IoT Base module use a specific topic structure that provides isolation by
company and device, with clear separation between sensor data and action commands.

## Topic Pattern

### Structure

```
{company_id}/{device_id}/{data_type}/[sdata|acdata]
```

**Components:**

- `company_id`: Company ID for multi-tenant isolation
- `device_id`: Unique device ID
- `data_type`: Type of data or command (wildcard `+` for multiple types)
- `sdata`: Sensor data (device publishes)
- `acdata`: Action/Command data (device subscribes)

### Default Permissions

When a device is created, it automatically receives two permissions:

1. **Publish Permission:**

   - Pattern: `{company_id}/{device_id}/+/sdata`
   - Purpose: Device publishes sensor data
   - Examples: temperature, humidity, status, battery

2. **Subscribe Permission:**
   - Pattern: `{company_id}/{device_id}/+/acdata`
   - Purpose: Device receives commands and actions
   - Examples: turn_on, turn_off, update_config, reboot

## Examples

### Example 1: Temperature Sensor

**Device:** Temperature Sensor (ID: 5) in Company 1

**Publish Topics:**

```
1/5/temperature/sdata    → {"value": 23.5, "unit": "celsius"}
1/5/humidity/sdata       → {"value": 65, "unit": "percent"}
1/5/status/sdata         → {"online": true, "battery": 85}
```

**Subscribe Topics:**

```
1/5/update_interval/acdata → {"interval": 60}
1/5/calibrate/acdata       → {"offset": 0.5}
```

### Example 2: Smart Thermostat

**Device:** Smart Thermostat (ID: 12) in Company 2

**Publish Topics:**

```
2/12/current_temp/sdata    → {"value": 22.0}
2/12/target_temp/sdata     → {"value": 24.0}
2/12/mode/sdata            → {"mode": "heating"}
2/12/status/sdata          → {"online": true, "power": "on"}
```

**Subscribe Topics:**

```
2/12/set_temp/acdata       → {"target": 25.0}
2/12/set_mode/acdata       → {"mode": "cooling"}
2/12/turn_off/acdata       → {"action": "shutdown"}
```

### Example 3: Multi-Sensor Device

**Device:** Environmental Monitor (ID: 7) in Company 1

**Publish Topics:**

```
1/7/temperature/sdata
1/7/humidity/sdata
1/7/pressure/sdata
1/7/light/sdata
1/7/noise/sdata
```

**Subscribe Topics:**

```
1/7/set_interval/acdata
1/7/enable_sensor/acdata
1/7/disable_sensor/acdata
1/7/reboot/acdata
```

## Wildcard Usage

### Device Side (Publish)

Device publishes to specific topics (no wildcards):

```python
# Device publishes temperature
topic = f"{company_id}/{device_id}/temperature/sdata"
mqtt_client.publish(topic, json.dumps({"value": 23.5}))
```

### Server/User Side (Subscribe)

Server subscribes with wildcards to receive all data from device:

```python
# Subscribe to all sensor data from device
topic = f"{company_id}/{device_id}/+/sdata"
mqtt_client.subscribe(topic)

# Subscribe to all sensor data from all devices in company
topic = f"{company_id}/+/+/sdata"
mqtt_client.subscribe(topic)
```

### Device Side (Subscribe)

Device subscribes to receive commands:

```python
# Subscribe to all commands for this device
topic = f"{company_id}/{device_id}/+/acdata"
mqtt_client.subscribe(topic)
```

## Permissions in Odoo

### Automatic Creation

When a device is created:

```python
device = env['iot.devices'].create({
    'name': 'Temperature Sensor 01',
    'company_id': 1,
})

# Automatically creates:
# Permission 1:
#   - Topic: "1/{device.id}/+/sdata"
#   - Action: "publish"
#
# Permission 2:
#   - Topic: "1/{device.id}/+/acdata"
#   - Action: "subscribe"
```

### View Permissions

In the device form, navigate to the **Topic Permissions** tab to see and manage all
permissions for the device.

### Add Additional Permissions

```python
# Allow device to subscribe to broadcast messages
env['iot.permission'].create({
    'iot_credential_id': device.credential_ids[0].id,
    'topic': f'{company_id}/broadcast/#',
    'action': 'subscribe',
    'active': True,
})
```

## Benefits of This Structure

### 1. Company Isolation

Each company's data is isolated by the company_id prefix:

- Company 1: `1/*/...`
- Company 2: `2/*/...`

### 2. Device Isolation

Each device has its own namespace:

- Device 5: `{company_id}/5/...`
- Device 12: `{company_id}/12/...`

### 3. Clear Data Direction

- `sdata`: Data flows FROM device TO server
- `acdata`: Commands flow FROM server TO device

### 4. Flexible Data Types

The wildcard `+` allows multiple data types without creating many permissions:

- One permission covers: temperature, humidity, pressure, etc.

### 5. Easy Filtering

Subscribe patterns allow flexible filtering:

- All data from device: `1/5/+/sdata`
- All commands to device: `1/5/+/acdata`
- Specific data type: `1/5/temperature/sdata`
- All devices temperature: `1/+/temperature/sdata`

## MQTT Publishing Examples

### Python (Device)

```python
import paho.mqtt.client as mqtt
import json

# Device configuration
COMPANY_ID = 1
DEVICE_ID = 5
USERNAME = "device_temp_sensor_01"
PASSWORD = "secure_password"

# Connect to broker
client = mqtt.Client()
client.username_pw_set(USERNAME, PASSWORD)
client.connect("mqtt.example.com", 1883, 60)

# Publish temperature
topic = f"{COMPANY_ID}/{DEVICE_ID}/temperature/sdata"
payload = json.dumps({"value": 23.5, "unit": "celsius", "timestamp": "2025-10-18T10:30:00Z"})
client.publish(topic, payload)

# Publish status
topic = f"{COMPANY_ID}/{DEVICE_ID}/status/sdata"
payload = json.dumps({"online": True, "battery": 85, "signal": -45})
client.publish(topic, payload)
```

### Arduino/ESP32 (Device)

```cpp
#include <PubSubClient.h>

const char* company_id = "1";
const char* device_id = "5";
const char* username = "device_temp_sensor_01";
const char* password = "secure_password";

WiFiClient espClient;
PubSubClient client(espClient);

void publishTemperature(float temp) {
    char topic[50];
    sprintf(topic, "%s/%s/temperature/sdata", company_id, device_id);

    char payload[100];
    sprintf(payload, "{\"value\": %.2f, \"unit\": \"celsius\"}", temp);

    client.publish(topic, payload);
}

void setup() {
    client.setServer("mqtt.example.com", 1883);
    client.connect(device_id, username, password);
}
```

## MQTT Subscribing Examples

### Python (Server/Dashboard)

```python
import paho.mqtt.client as mqtt

# Subscribe to all sensor data from device 5 in company 1
def on_connect(client, userdata, flags, rc):
    topic = "1/5/+/sdata"
    client.subscribe(topic)
    print(f"Subscribed to {topic}")

def on_message(client, userdata, msg):
    print(f"Received on {msg.topic}: {msg.payload.decode()}")
    # Parse and process data
    data = json.loads(msg.payload.decode())
    # Store in database, update UI, etc.

client = mqtt.Client()
client.username_pw_set("user_admin", "admin_password")
client.on_connect = on_connect
client.on_message = on_message
client.connect("mqtt.example.com", 1883, 60)
client.loop_forever()
```

### JavaScript/Node.js (Web Dashboard)

```javascript
const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://mqtt.example.com:1883", {
  username: "user_admin",
  password: "admin_password",
});

client.on("connect", () => {
  // Subscribe to all devices in company 1
  client.subscribe("1/+/+/sdata");
  console.log("Subscribed to all sensor data");
});

client.on("message", (topic, message) => {
  const parts = topic.split("/");
  const companyId = parts[0];
  const deviceId = parts[1];
  const dataType = parts[2];

  const data = JSON.parse(message.toString());
  console.log(`Device ${deviceId} - ${dataType}:`, data);

  // Update dashboard, trigger alerts, etc.
});
```

## Sending Commands to Devices

### Python (Server)

```python
import paho.mqtt.client as mqtt
import json

# Connect
client = mqtt.Client()
client.username_pw_set("user_admin", "admin_password")
client.connect("mqtt.example.com", 1883, 60)

# Send command to device 5 in company 1
company_id = 1
device_id = 5

# Turn on command
topic = f"{company_id}/{device_id}/turn_on/acdata"
payload = json.dumps({"action": "turn_on", "timestamp": "2025-10-18T10:30:00Z"})
client.publish(topic, payload)

# Update configuration
topic = f"{company_id}/{device_id}/update_config/acdata"
payload = json.dumps({"interval": 60, "threshold": 25.0})
client.publish(topic, payload)
```

### Device Receiving Commands

```python
def on_message(client, userdata, msg):
    # Parse topic
    parts = msg.topic.split('/')
    command_type = parts[2]  # e.g., "turn_on", "update_config"

    # Parse payload
    data = json.loads(msg.payload.decode())

    # Execute command
    if command_type == "turn_on":
        device_turn_on()
    elif command_type == "update_config":
        device_update_config(data)
    elif command_type == "reboot":
        device_reboot()

# Subscribe to all commands
topic = f"{COMPANY_ID}/{DEVICE_ID}/+/acdata"
client.subscribe(topic)
client.on_message = on_message
```

## Best Practices

### 1. Use Descriptive Data Types

```python
# Good
topic = f"{company_id}/{device_id}/ambient_temperature/sdata"
topic = f"{company_id}/{device_id}/water_level/sdata"

# Avoid
topic = f"{company_id}/{device_id}/data1/sdata"
topic = f"{company_id}/{device_id}/sensor/sdata"
```

### 2. Include Metadata in Payload

```json
{
  "value": 23.5,
  "unit": "celsius",
  "timestamp": "2025-10-18T10:30:00Z",
  "quality": "good",
  "sensor_id": "DHT22"
}
```

### 3. Handle QoS Appropriately

```python
# Critical data (QoS 2 - exactly once)
client.publish(topic, payload, qos=2)

# Regular data (QoS 1 - at least once)
client.publish(topic, payload, qos=1)

# High-frequency data (QoS 0 - at most once)
client.publish(topic, payload, qos=0)
```

### 4. Implement Retained Messages for Status

```python
# Retain last status
topic = f"{company_id}/{device_id}/status/sdata"
payload = json.dumps({"online": True})
client.publish(topic, payload, retain=True)
```

### 5. Use Will Messages for Disconnection

```python
will_topic = f"{company_id}/{device_id}/status/sdata"
will_payload = json.dumps({"online": False})
client.will_set(will_topic, will_payload, retain=True)
```

## Troubleshooting

### Device Cannot Publish

1. Check device permissions in Odoo
2. Verify topic format matches pattern
3. Check EMQX logs for authorization failures
4. Test with mosquitto_pub:

```bash
mosquitto_pub -h mqtt.example.com -p 1883 \
  -u "device_temp_sensor_01" -P "password" \
  -t "1/5/temperature/sdata" \
  -m '{"value": 23.5}'
```

### Device Not Receiving Commands

1. Verify subscription topic
2. Check permission for subscribe action
3. Test with mosquitto_sub:

```bash
mosquitto_sub -h mqtt.example.com -p 1883 \
  -u "device_temp_sensor_01" -P "password" \
  -t "1/5/+/acdata" \
  -v
```

### Permission Denied

Check Odoo authorization:

```bash
curl -X POST http://localhost:8069/iot/acl/test_token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "device_temp_sensor_01",
    "topic": "1/5/temperature/sdata",
    "action": "publish"
  }'
```

## Related Documentation

- `MQTT_AUTHORIZATION.md` - Authorization system details
- `COMPANY_SCOPED_TOPICS.md` - Company namespace overview
- `AUTHORIZATION_EXAMPLES.md` - More examples
