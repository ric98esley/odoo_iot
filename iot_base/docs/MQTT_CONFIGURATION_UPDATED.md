# MQTT Broker Configuration (Updated)

## Overview

The MQTT broker URL is now configured **globally** using Odoo's System Parameters
(`ir.config_parameter`), not per company.

## Why the Change?

The original implementation used `res.company` for multi-company support, but this
caused a technical issue with `res.config.settings` related fields. We've simplified the
approach:

- **Before:** Per-company configuration (complex)
- **Now:** Global configuration (simple, works reliably)

## Configuration Location

Navigate to: **Settings → General Settings → IoT Section**

## Configuration Options

### Option 1: Direct URL

Enter the complete WebSocket URL:

- Development: `ws://localhost:8083/mqtt`
- Production: `wss://mqtt.example.com:8084/mqtt`

### Option 2: Advanced Settings (Auto-generate)

Configure components individually:

- **Host:** `localhost` or `mqtt.example.com`
- **Port:** `8083` (ws) or `8084` (wss)
- **Use SSL:** Checked for `wss://`

The URL will be auto-generated when you change these fields.

## How It Works

### Storage

Configuration is stored in `ir.config_parameter`:

```python
# View current configuration
env['ir.config_parameter'].get_param('iot_base.mqtt_broker_url')
# Output: 'ws://localhost:8083/mqtt'

env['ir.config_parameter'].get_param('iot_base.mqtt_broker_host')
# Output: 'localhost'

env['ir.config_parameter'].get_param('iot_base.mqtt_broker_port')
# Output: '8083'

env['ir.config_parameter'].get_param('iot_base.mqtt_use_ssl')
# Output: 'False'
```

### Retrieval

The controller reads from system parameters:

```python
broker_url = env['ir.config_parameter'].sudo().get_param(
    'iot_base.mqtt_broker_url',
    'ws://localhost:8083/mqtt'  # Default fallback
)
```

## Configuration Methods

### Via UI (Recommended)

1. Go to **Settings → General Settings**
2. Scroll to **IoT** section
3. Configure:
   - **MQTT Broker URL:** Direct URL, or
   - **Advanced Settings:** Host + Port + SSL
4. Click **Save**

### Via Python Code

```python
# Set broker URL
env['ir.config_parameter'].set_param(
    'iot_base.mqtt_broker_url',
    'wss://mqtt.production.com:8084/mqtt'
)

# Set advanced parameters
env['ir.config_parameter'].set_param('iot_base.mqtt_broker_host', 'mqtt.production.com')
env['ir.config_parameter'].set_param('iot_base.mqtt_broker_port', '8084')
env['ir.config_parameter'].set_param('iot_base.mqtt_use_ssl', 'True')
```

### Via XML Data

```xml
<odoo>
  <data noupdate="1">
    <record id="mqtt_broker_url_param" model="ir.config_parameter">
      <field name="key">iot_base.mqtt_broker_url</field>
      <field name="value">ws://localhost:8083/mqtt</field>
    </record>
  </data>
</odoo>
```

## Default Values

If not configured:

- **URL:** `ws://localhost:8083/mqtt`
- **Host:** `localhost`
- **Port:** `8083`
- **SSL:** `False`

## Multi-Company Considerations

**Important:** This configuration is now **global** (system-wide), not per company.

All companies in the system will use the same MQTT broker URL.

### If You Need Multi-Company Support

If you need different brokers per company, you have two options:

#### Option 1: Use Topic Namespaces

Use a single broker but separate topics per company:

```javascript
// Company A uses: company_a/sensors/temp
// Company B uses: company_b/sensors/temp
const topic = `${company_id}/sensors/temp`;
```

#### Option 2: Extend for Per-Company Config

Add custom logic in the controller:

```python
@route("/iot/app", auth="user")
def app(self):
    user = request.env.user
    company = user.company_id

    # Custom logic: check if company has specific config
    if company.name == "Company A":
        broker_url = "ws://broker-a.local:8083/mqtt"
    elif company.name == "Company B":
        broker_url = "ws://broker-b.local:8083/mqtt"
    else:
        # Use global config
        broker_url = env['ir.config_parameter'].sudo().get_param(
            'iot_base.mqtt_broker_url',
            'ws://localhost:8083/mqtt'
        )

    # ... rest of code
```

## Common Configurations

### Local Development

```
URL: ws://localhost:8083/mqtt
Host: localhost
Port: 8083
SSL: No
```

### Docker Compose

```
URL: ws://emqx:8083/mqtt
Host: emqx
Port: 8083
SSL: No
```

### Production

```
URL: wss://mqtt.mycompany.com:8084/mqtt
Host: mqtt.mycompany.com
Port: 8084
SSL: Yes
```

## Checking Current Configuration

### Via UI

Settings → Technical → Parameters → System Parameters

Look for keys starting with `iot_base.mqtt_`

### Via Python

```python
# Odoo shell
params = env['ir.config_parameter'].search([
    ('key', 'like', 'iot_base.mqtt_%')
])
for param in params:
    print(f"{param.key}: {param.value}")
```

### Via Browser Console

```javascript
console.log(window.odoo.mqtt_config.broker_url);
```

## Troubleshooting

### Configuration Not Saved

**Check:**

1. You have admin permissions
2. You clicked "Save" button
3. No validation errors

**Verify:**

```python
env['ir.config_parameter'].get_param('iot_base.mqtt_broker_url')
```

### Configuration Not Applied

**Steps:**

1. Refresh browser (Ctrl+F5)
2. Restart Odoo server
3. Clear browser cache

**Verify in browser:**

```javascript
// Should show your configured URL
console.log(window.odoo.mqtt_config.broker_url);
```

### URL Not Auto-Generating

**Check:**

1. All three fields filled: Host, Port, SSL
2. Port is a valid number
3. You clicked outside the field (to trigger onchange)

**Manual trigger:**

```python
# Via Odoo shell
settings = env['res.config.settings'].create({})
settings.mqtt_broker_host = 'mqtt.example.com'
settings.mqtt_broker_port = 8084
settings.mqtt_use_ssl = True
settings._onchange_mqtt_broker_settings()
print(settings.mqtt_broker_url)
# Should output: wss://mqtt.example.com:8084/mqtt
```

## Migration from Previous Version

If you were using the per-company configuration:

### Old Way (res.company)

```python
company.mqtt_broker_url = 'ws://broker.com:8083/mqtt'
```

### New Way (ir.config_parameter)

```python
env['ir.config_parameter'].set_param(
    'iot_base.mqtt_broker_url',
    'ws://broker.com:8083/mqtt'
)
```

**Note:** Old company-specific settings are no longer used. Migrate your configuration
to the new system parameters.

## Security

- System parameters are only editable by administrators
- Parameters are stored in the database
- Use HTTPS in production for secure transmission
- Use WSS (not WS) for secure WebSocket connections

## Best Practices

1. **Development:** Use `ws://localhost:8083/mqtt`
2. **Staging:** Use `wss://mqtt-staging.example.com:8084/mqtt`
3. **Production:** Use `wss://mqtt.example.com:8084/mqtt` with valid SSL certificates
4. **Docker:** Use service name as host (e.g., `ws://emqx:8083/mqtt`)
5. **Document:** Keep track of your broker URL in deployment docs

## Next Steps

1. Configure broker URL via Settings
2. Test connection at `/iot/app`
3. Configure EMQX to accept WebSocket connections
4. Set up EMQX authentication webhook
5. Start subscribing to topics!

## Related Documentation

- `MQTT_QUICKSTART.md` - Quick start guide
- `mqtt_authentication.md` - Authentication details
- EMQX Configuration: https://www.emqx.io/docs/
