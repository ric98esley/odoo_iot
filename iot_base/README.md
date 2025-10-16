# IoT Base Module

Odoo 18.0 module for IoT device management and MQTT communication with EMQX broker.

## Features

- 🔐 **Automatic MQTT Authentication** - Auto-generates secure credentials for users
- 🔌 **EMQX Integration** - Seamless connection to EMQX broker via WebSocket
- ⚙️ **Configurable Broker** - Set MQTT broker URL per company via Settings UI
- 📱 **Device Management** - Manage IoT devices with credentials
- 🎯 **Transparent Authentication** - Users and devices authenticate the same way
- 🎨 **Owl Components** - Modern JavaScript widgets for MQTT subscriptions
- 🏢 **Multi-Company Support** - Each company can have its own broker configuration

## Quick Start

### 1. Install Module

```bash
# Install dependencies (if needed)
pip install -r requirements.txt

# Update module
./odoo-bin -u iot_base -d your_database
```

### 2. Configure MQTT Broker

**Via Odoo UI:**

1. Go to **Settings → General Settings**
2. Scroll to **IoT** section
3. Set **MQTT Broker URL**: `ws://localhost:8083/mqtt`
4. Or configure **Advanced Settings** (Host, Port, SSL)
5. Click **Save**

**Via Python:**

```python
env.company.mqtt_broker_url = 'ws://localhost:8083/mqtt'
```

### 3. Access IoT App

Navigate to: `http://your-odoo-server/iot/app`

- Credentials are auto-generated on first access
- Auto-connects to MQTT broker
- Ready to subscribe to topics!

## Architecture

```
┌─────────────────┐
│   Odoo User     │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐      ┌──────────────────┐
│  IoT Base Module    │      │  EMQX Broker     │
│  - Auto-credentials │◄────►│  - WebSocket     │
│  - MQTT Service     │      │  - Authentication│
│  - Owl Components   │      └──────────────────┘
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   IoT Devices       │
│  - Sensors          │
│  - Actuators        │
└─────────────────────┘
```

## Models

### iot.credentials

Unified credentials for EMQX authentication (users and devices).

**Fields:**

- `name` - Username
- `password` - Password (encrypted)
- `resource_type` - 'user' or 'device'
- `user_id` - Link to res.users
- `device_id` - Link to iot.devices
- `is_superuser` - MQTT superuser flag

### iot.devices

IoT device registry.

**Fields:**

- `name` - Device name
- `device_type` - Device type
- `device_uid` - Unique device identifier
- `credential_ids` - MQTT credentials for this device

### res.company (Extended)

MQTT broker configuration per company.

**Fields:**

- `mqtt_broker_url` - Full WebSocket URL
- `mqtt_broker_host` - Broker hostname
- `mqtt_broker_port` - WebSocket port
- `mqtt_use_ssl` - Use wss:// instead of ws://

## Frontend Components

### MQTTService

JavaScript service for MQTT operations.

**Usage:**

```javascript
import {mqttService} from "./services/mqtt_service.esm";

// Connect with Odoo config
await mqttService.connectWithOdooConfig();

// Subscribe
await mqttService.subscribe("sensors/temp", (msg, topic) => {
  console.log(`${topic}: ${msg}`);
});

// Publish
mqttService.publish("commands/led", JSON.stringify({state: "on"}));
```

### MQTTSubscriber Widget

Owl component for MQTT subscriptions with UI.

**Features:**

- Auto-connects using Odoo configuration
- Topic subscription with live message display
- Pre-filled credentials
- Connection status indicator

## Configuration

### Via Settings UI

**Path:** Settings → General Settings → IoT

**Options:**

1. **Direct URL:** Enter complete WebSocket URL
2. **Advanced:** Configure Host + Port + SSL (auto-generates URL)

### Via Python

```python
# Direct URL
env.company.mqtt_broker_url = 'wss://mqtt.example.com:8084/mqtt'

# Advanced settings
env.company.write({
    'mqtt_broker_host': 'mqtt.example.com',
    'mqtt_broker_port': 8084,
    'mqtt_use_ssl': True,
})
```

### Multi-Company

Each company can have different broker:

```python
company_a = env['res.company'].browse(1)
company_a.mqtt_broker_url = 'ws://broker-a.local:8083/mqtt'

company_b = env['res.company'].browse(2)
company_b.mqtt_broker_url = 'ws://broker-b.local:8083/mqtt'
```

## Security

### Password Generation

- Uses Python `secrets` module
- 16 alphanumeric characters
- ~95 bits of entropy

### Storage

- Passwords in `iot.credentials` model
- Protected by Odoo ACL
- Access restricted to iot_user and iot_manager groups

### Transport

- HTTPS for Odoo (production)
- WSS for MQTT (production)
- Authentication via `/iot/auth/<token>` endpoint

## API Endpoints

### /iot/app

**Auth:** user **Method:** GET **Description:** IoT application interface

**Returns:**

- HTML page with Owl app
- MQTT config in JavaScript context
- Auto-generated credentials

### /iot/auth/<token>

**Auth:** none **Method:** POST **Description:** EMQX authentication webhook

**Request:**

```json
{
  "username": "user_admin",
  "password": "xYz123AbC456DeF7"
}
```

**Response (Success):**

```json
{
  "result": "allow",
  "is_superuser": false,
  "resource_type": "user"
}
```

### /iot/devices

**Auth:** user **Method:** GET **Description:** Get list of IoT devices

**Response:**

```json
{
  "devices": [...]
}
```

## Documentation

### User Guides

- `docs/MQTT_QUICKSTART.md` - Quick start guide
- `docs/MQTT_CONFIGURATION.md` - Configuration details
- `docs/mqtt_authentication.md` - Authentication architecture

### Technical Documentation

- `docs/ARCHITECTURE_DIAGRAM.md` - System architecture
- `docs/EVENT_INDICATOR.md` - Event indicator widget
- `docs/frontend.md` - Frontend development guide

## Common Use Cases

### 1. Monitor Sensor Data

```javascript
await mqttService.subscribe("sensors/+/temperature", (message) => {
  const data = JSON.parse(message);
  console.log(`Temperature: ${data.value}°C`);
});
```

### 2. Control Device

```javascript
mqttService.publish(
  "devices/led123/commands",
  JSON.stringify({
    command: "turn_on",
    brightness: 75,
  })
);
```

### 3. Subscribe to Multiple Topics

```javascript
const topics = ["sensors/temp", "sensors/humidity", "alerts/critical"];
for (const topic of topics) {
  await mqttService.subscribe(topic, handleMessage);
}
```

## Troubleshooting

### Connection Failed

**Check:**

1. EMQX broker is running
2. WebSocket port is accessible (8083)
3. Broker URL is configured in Settings
4. Authentication webhook is configured in EMQX

**Test:**

```javascript
// Browser console
console.log(window.odoo.mqtt_config);
console.log(mqttService.state.connected);
```

### Credentials Not Created

**Check:**

```python
# Odoo shell
user = env.user
credentials = user.get_or_create_iot_credentials()
print(credentials)
```

### Configuration Not Applied

**Clear cache:**

- Refresh browser (Ctrl+F5)
- Restart Odoo server
- Clear Odoo assets cache

## Development

### Project Structure

```
iot_base/
├── models/
│   ├── iot_credentials.py
│   ├── iot_devices.py
│   ├── res_company.py
│   ├── res_config_settings.py
│   └── res_user.py
├── controllers/
│   ├── api.py
│   └── app.py
├── views/
│   ├── iot_credentials_views.xml
│   ├── iot_devices_views.xml
│   ├── res_config_settings_views.xml
│   └── ...
├── static/src/
│   ├── services/
│   │   └── mqtt_service.esm.js
│   ├── widgets/
│   │   ├── mqtt_subscriber/
│   │   └── event_indicator/
│   └── components/
├── security/
│   ├── iot_security.xml
│   └── ir.model.access.csv
└── docs/
    ├── MQTT_QUICKSTART.md
    ├── MQTT_CONFIGURATION.md
    └── mqtt_authentication.md
```

### Running Tests

```bash
./odoo-bin --test-enable --test-tags iot_base -d your_database
```

### Code Style

- Python: PEP 8
- JavaScript: Odoo Owl conventions
- XML: Odoo guidelines

## Dependencies

- Odoo 18.0
- EMQX broker (5.x recommended)
- mqtt.js (loaded from CDN)

## License

AGPL-3

## Author

Ricardo Perez (ric98esley)

## Support

- GitHub: https://github.com/ric98esley/odoo_iot
- Issues: Report via GitHub Issues

## Changelog

### 18.0.0.0.1

- Initial release
- Automatic credential generation
- EMQX integration
- Configurable broker URL per company
- Owl components for MQTT
- Multi-company support
