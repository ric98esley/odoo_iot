# MQTT Broker Configuration

This document explains how to configure the MQTT broker URL for the IoT Base module.

## Configuration Location

The MQTT broker URL is now configurable per company through Odoo's settings interface.

### Accessing Configuration

1. Navigate to **Settings → General Settings**
2. Scroll to the **IoT** section
3. Configure MQTT Broker settings

## Configuration Options

### Option 1: Direct URL Configuration

**Field:** MQTT Broker URL

Enter the complete WebSocket URL directly:

- **Development (no SSL):** `ws://localhost:8083/mqtt`
- **Production (with SSL):** `wss://broker.example.com:8084/mqtt`
- **Custom port:** `ws://192.168.1.100:8083/mqtt`

### Option 2: Advanced Settings (Auto-generated URL)

Configure individual components and the URL will be auto-generated:

**Fields:**

- **MQTT Broker Host:** Hostname or IP address (e.g., `localhost`, `mqtt.example.com`)
- **MQTT WebSocket Port:** Port number (default: 8083 for ws://, 8084 for wss://)
- **Use SSL/TLS:** Enable for secure WebSocket connections (wss://)

**Example:**

- Host: `mqtt.example.com`
- Port: `8084`
- Use SSL: ✓ (checked)
- **Result:** `wss://mqtt.example.com:8084/mqtt`

## Database Schema

The configuration is stored in the `res.company` table:

```python
class ResCompany(models.Model):
    _inherit = "res.company"

    mqtt_broker_url = fields.Char(...)      # Full URL
    mqtt_broker_host = fields.Char(...)     # Hostname
    mqtt_broker_port = fields.Integer(...)  # Port
    mqtt_use_ssl = fields.Boolean(...)      # SSL flag
```

## Default Values

If not configured, the system uses these defaults:

- **URL:** `ws://localhost:8083/mqtt`
- **Host:** `localhost`
- **Port:** `8083`
- **SSL:** `False`

## Multi-Company Support

Each company can have its own MQTT broker configuration:

- Company A → `ws://broker-a.example.com:8083/mqtt`
- Company B → `ws://broker-b.example.com:8083/mqtt`

The user's company determines which broker URL is used when accessing `/iot/app`.

## How It Works

### Backend Flow

1. User accesses `/iot/app` route
2. Controller gets user's company: `user.company_id`
3. Reads broker URL: `company.mqtt_broker_url`
4. Passes to frontend via `mqtt_config` context

### Frontend Flow

1. Template renders with `window.odoo.mqtt_config`
2. Contains `broker_url` from company settings
3. MQTT service uses this URL to connect
4. Auto-connection happens on page load

### Code Example

**Controller (`app.py`):**

```python
@route("/iot/app", auth="user")
def app(self):
    user = request.env.user
    company = user.company_id
    broker_url = company.mqtt_broker_url or "ws://localhost:8083/mqtt"

    mqtt_config = {
        "broker_url": broker_url,
        "credentials": iot_credentials,
    }
    # ... render template
```

**Frontend (automatic):**

```javascript
// Configuration is automatically loaded
console.log(window.odoo.mqtt_config.broker_url);
// Output: "wss://mqtt.example.com:8084/mqtt"

// Auto-connects using configured URL
await mqttService.connectWithOdooConfig();
```

## Programmatic Configuration

### Via Python Code

```python
# Set for specific company
company = env['res.company'].browse(1)
company.mqtt_broker_url = 'wss://production-broker.com:8084/mqtt'

# Or use advanced fields
company.write({
    'mqtt_broker_host': 'production-broker.com',
    'mqtt_broker_port': 8084,
    'mqtt_use_ssl': True,
})
# URL will be auto-generated: wss://production-broker.com:8084/mqtt
```

### Via XML Data

```xml
<record id="base.main_company" model="res.company">
  <field name="mqtt_broker_url">wss://mqtt.mycompany.com:8084/mqtt</field>
</record>
```

### Via System Parameters (Alternative)

For global configuration across all companies, you can use `ir.config_parameter`:

```python
env['ir.config_parameter'].set_param(
    'iot_base.default_mqtt_broker_url',
    'wss://global-broker.com:8084/mqtt'
)
```

Then modify `app.py`:

```python
broker_url = (
    company.mqtt_broker_url
    or env['ir.config_parameter'].sudo().get_param(
        'iot_base.default_mqtt_broker_url',
        'ws://localhost:8083/mqtt'
    )
)
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

### Production (AWS)

```
URL: wss://mqtt.mycompany.com:8084/mqtt
Host: mqtt.mycompany.com
Port: 8084
SSL: Yes
```

### Production (with Load Balancer)

```
URL: wss://mqtt.mycompany.com/mqtt
Host: mqtt.mycompany.com
Port: 443 (if using standard HTTPS port)
SSL: Yes
```

## Security Considerations

### Development

- Use `ws://` for local development
- Acceptable on localhost or private networks

### Production

- **Always use `wss://` (secure WebSocket)**
- Use valid SSL certificates
- Configure firewall rules
- Use VPN for sensitive deployments

### Network Ports

**Common MQTT Ports:**

- `1883` - MQTT over TCP (not for web browsers)
- `8883` - MQTT over SSL/TLS (not for web browsers)
- `8083` - MQTT over WebSocket (ws://)
- `8084` - MQTT over Secure WebSocket (wss://)

**Web browsers can only use WebSocket ports (8083/8084 or custom).**

## Troubleshooting

### Connection Failed

**Check configuration:**

```python
# In Odoo shell
company = env.user.company_id
print(f"Broker URL: {company.mqtt_broker_url}")
print(f"Host: {company.mqtt_broker_host}")
print(f"Port: {company.mqtt_broker_port}")
print(f"SSL: {company.mqtt_use_ssl}")
```

**Browser console:**

```javascript
console.log(window.odoo.mqtt_config);
```

### URL Not Updating

**Clear cache:**

- Refresh browser with Ctrl+F5 (hard refresh)
- Clear Odoo assets cache
- Restart Odoo server

**Check saved value:**

```python
env['res.company'].browse(1).mqtt_broker_url
```

### Multi-Company Issues

**Ensure correct company:**

```python
user = env.user
print(f"User: {user.name}")
print(f"Company: {user.company_id.name}")
print(f"Broker: {user.company_id.mqtt_broker_url}")
```

## Migration from Hardcoded URL

If you previously had hardcoded URLs in `app.py`, no migration is needed:

1. The system uses default values if not configured
2. Admins can configure via UI at any time
3. Existing deployments continue working with defaults

## Testing Configuration

### Test from Python

```python
# Test connection settings are accessible
company = env.user.company_id
print(f"Will connect to: {company.mqtt_broker_url}")

# Test with specific user
user = env['res.users'].browse(2)
print(f"{user.name} will use: {user.company_id.mqtt_broker_url}")
```

### Test from Browser

1. Open `/iot/app`
2. Open browser DevTools console
3. Check configuration:

```javascript
// Should show your configured URL
console.log(window.odoo.mqtt_config.broker_url);

// Should auto-connect
console.log(mqttService.state.connected); // true
```

## Best Practices

1. **Use environment-specific URLs:**

   - Development: `ws://localhost:8083/mqtt`
   - Staging: `wss://mqtt-staging.example.com:8084/mqtt`
   - Production: `wss://mqtt.example.com:8084/mqtt`

2. **Document your configuration:**

   - Keep track of broker URLs per environment
   - Document port mappings
   - Note any special firewall rules

3. **Use DNS names instead of IPs:**

   - Easier to change backend without updating config
   - Better for SSL certificates
   - More maintainable

4. **Configure SSL properly:**

   - Use valid certificates (not self-signed in production)
   - Configure EMQX to accept WebSocket SSL connections
   - Test with `wss://` URL

5. **Per-company configuration:**
   - Configure different brokers per company if needed
   - Use company-specific topics for isolation
   - Document which company uses which broker

## Next Steps

- Configure your MQTT broker URL via Settings
- Test connection from `/iot/app`
- Configure EMQX to accept WebSocket connections
- Set up SSL certificates for production
- Configure EMQX authentication webhook

## Related Documentation

- `mqtt_authentication.md` - Authentication flow
- `MQTT_QUICKSTART.md` - Quick start guide
- EMQX WebSocket Configuration:
  https://www.emqx.io/docs/en/v5.0/configuration/websocket.html
