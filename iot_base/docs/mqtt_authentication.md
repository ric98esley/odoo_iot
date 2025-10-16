# MQTT Authentication Flow

This document describes how the automatic MQTT authentication works in the IoT Base
module.

## Overview

The system automatically generates and manages MQTT credentials for users, enabling
seamless connection to the EMQX broker without manual configuration.

## Architecture Flow

```
┌─────────────────┐
│   User Login    │
│   to /iot/app   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  app.py Controller                          │
│  - Calls user.get_or_create_iot_credentials()│
│  - Prepares mqtt_config context             │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  res.users Model                             │
│  - Checks if user has credentials            │
│  - Creates new if not exists                 │
│  - Returns username/password                 │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  iot_app_view.xml Template                   │
│  - Renders HTML with mqtt_config in JS      │
│  - Available as window.odoo.mqtt_config      │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  mqtt_service.esm.js                         │
│  - connectWithOdooConfig() method            │
│  - Reads window.odoo.mqtt_config             │
│  - Connects to EMQX broker                   │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  MQTTSubscriber Component                    │
│  - Auto-connects on setup()                  │
│  - Pre-fills credentials in UI               │
│  - Ready to subscribe to topics              │
└─────────────────────────────────────────────┘
```

## Components

### 1. Backend: `res.users` Model

**File:** `iot/iot_base/models/res_user.py`

#### Method: `get_or_create_iot_credentials()`

This method:

- Checks if the user already has IoT credentials
- If not, generates a unique username and secure password
- Creates a new `iot.credentials` record
- Returns credentials as a dictionary

**Username Format:** `user_{login_sanitized}`

- Example: `user_admin_example_com` for `admin@example.com`

**Password:** 16-character alphanumeric string generated securely

### 2. Backend: Controller

**File:** `iot/iot_base/controllers/app.py`

The `/iot/app` route:

- Gets the current user
- Calls `get_or_create_iot_credentials()`
- Prepares `mqtt_config` with:
  - `broker_url`: WebSocket URL of EMQX broker
  - `credentials`: Username, password, and superuser flag
- Passes config to template context

**Current Broker URL:** `ws://localhost:8083/mqtt` (hardcoded, can be made configurable)

### 3. Frontend: Template

**File:** `iot/iot_base/views/iot_app_view.xml`

The template:

- Includes `mqtt_config` in the global `odoo` JavaScript object
- Makes it accessible as `window.odoo.mqtt_config`

**Structure:**

```javascript
window.odoo.mqtt_config = {
  broker_url: "ws://localhost:8083/mqtt",
  credentials: {
    username: "user_admin",
    password: "xYz123AbC456DeF7",
    is_superuser: false,
  },
};
```

### 4. Frontend: MQTT Service

**File:** `iot/iot_base/static/src/services/mqtt_service.esm.js`

#### Method: `connectWithOdooConfig()`

New convenience method that:

- Reads `window.odoo.mqtt_config`
- Validates configuration exists
- Calls `connect()` with proper credentials
- Uses clientId format: `odoo_user_{username}`

**Usage:**

```javascript
await mqttService.connectWithOdooConfig();
```

### 5. Frontend: MQTT Subscriber Widget

**File:** `iot/iot_base/static/src/widgets/mqtt_subscriber/mqtt_subscriber.esm.js`

Enhanced to:

- Auto-detect Odoo MQTT configuration
- Pre-fill connection fields (broker URL, username, password)
- Auto-connect on component mount if config is available
- Show connection status

## Security Features

### Password Generation

- Uses Python's `secrets` module for cryptographically secure random generation
- 16 characters from alphanumeric alphabet (62 possibilities per character)
- Entropy: ~95 bits

### Storage

- Passwords stored in `iot.credentials` model
- Protected by Odoo's ACL system
- Only accessible by authorized users (iot_user, iot_manager groups)

### Transport

- Credentials transmitted over HTTPS (in production)
- WebSocket connection to EMQX can use WSS (secure WebSocket)

## Authentication with EMQX

The EMQX broker uses the `/iot/auth/<token>` endpoint for authentication:

**Endpoint:** `POST /iot/auth/<token>`

**Request Body:**

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

**Response (Failure):**

```json
{
  "result": "deny"
}
```

## Configuration

### Making Broker URL Configurable

To make the broker URL configurable via system parameters:

1. Add to `app.py`:

```python
broker_url = request.env['ir.config_parameter'].sudo().get_param(
    'iot_base.mqtt_broker_url',
    default='ws://localhost:8083/mqtt'
)
```

2. Set parameter in Odoo:

```python
env['ir.config_parameter'].set_param(
    'iot_base.mqtt_broker_url',
    'wss://mqtt.example.com/mqtt'
)
```

### Multiple Credentials per User

The system supports multiple credentials per user:

- User can have multiple `iot_credential_ids`
- `get_or_create_iot_credentials()` returns the first one
- Additional credentials can be created manually via UI

## Troubleshooting

### Connection Fails

**Check:**

1. EMQX broker is running
2. WebSocket port (8083) is accessible
3. Authentication endpoint is configured in EMQX
4. Credentials exist in database

**Console Logs:**

```javascript
console.log(window.odoo.mqtt_config); // Check if config is loaded
```

### Credentials Not Created

**Check:**

1. User has proper permissions
2. `iot_base` module is installed
3. Database migrations ran successfully

**Manual Creation:**

```python
user = env.user
credentials = user.get_or_create_iot_credentials()
print(credentials)
```

### Auto-connect Not Working

**Check:**

1. Browser console for errors
2. Network tab for WebSocket connection
3. MQTT service state: `mqttService.state.connected`

## Best Practices

1. **Production Deployment:**

   - Use WSS (secure WebSocket) instead of WS
   - Use proper SSL/TLS certificates
   - Set broker URL via system parameters

2. **Security:**

   - Rotate passwords periodically
   - Use EMQX ACL rules to restrict topic access
   - Enable EMQX authentication logging

3. **Monitoring:**

   - Monitor MQTT connection status
   - Log authentication failures
   - Track active connections in EMQX dashboard

4. **Scalability:**
   - Use EMQX clustering for high availability
   - Implement connection pooling if needed
   - Consider using MQTT 5.0 features

## Future Enhancements

1. **Credential Rotation:**

   - Automatic password rotation
   - Expiration dates for credentials

2. **Advanced ACL:**

   - Topic-level permissions
   - Dynamic ACL based on user roles

3. **Multi-tenancy:**

   - Separate MQTT namespaces per company
   - Company-specific broker configurations

4. **Monitoring Dashboard:**
   - Connection status widget
   - Message throughput metrics
   - Authentication audit logs
