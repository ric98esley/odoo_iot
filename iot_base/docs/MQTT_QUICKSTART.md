# MQTT Connection - Quick Start

## Automatic Connection (Recommended)

The IoT Base module automatically handles MQTT authentication for you!

### How it Works

1. **Login to Odoo** and navigate to `/iot/app`
2. **Credentials are auto-generated** on first access
3. **Auto-connection** to EMQX broker happens automatically
4. **Start subscribing** to topics immediately

### In the Frontend (JavaScript/Owl)

#### Option 1: Use Auto-Connect (Easiest)

The `MQTTSubscriber` widget connects automatically. Just use it:

```javascript
import { MQTTSubscriber } from "./widgets/mqtt_subscriber/mqtt_subscriber.esm";

// In your component
static components = { MQTTSubscriber };
```

#### Option 2: Manual Connection with Odoo Config

```javascript
import {mqttService} from "./services/mqtt_service.esm";

// Connect using Odoo's configuration
await mqttService.connectWithOdooConfig();

// Subscribe to topics
await mqttService.subscribe("sensors/temperature", (message, topic) => {
  console.log(`Received on ${topic}:`, message);
});

// Publish messages
mqttService.publish("commands/led", JSON.stringify({state: "on"}));
```

#### Option 3: Custom Connection

```javascript
import {mqttService} from "./services/mqtt_service.esm";

// Connect with custom settings
await mqttService.connect({
  url: "ws://custom-broker.com:8083/mqtt",
  username: "custom_user",
  password: "custom_pass",
  clientId: "my_custom_client",
});
```

## Configuration

### Default Broker URL

**Current:** `ws://localhost:8083/mqtt`

### Changing Broker URL

Edit `iot/iot_base/controllers/app.py`:

```python
mqtt_config = {
    'broker_url': 'wss://your-broker.com/mqtt',  # Change this
    'credentials': iot_credentials,
}
```

Or make it configurable (see `docs/mqtt_authentication.md`)

## Checking Your Credentials

### Via Odoo UI

1. Navigate to **IoT → EMQX Credentials**
2. Find your username (format: `user_yourlogin`)
3. View/Edit credentials

### Via Browser Console

```javascript
console.log(window.odoo.mqtt_config);
// Output:
// {
//   broker_url: "ws://localhost:8083/mqtt",
//   credentials: {
//     username: "user_admin",
//     password: "xYz123AbC456DeF7",
//     is_superuser: false
//   }
// }
```

### Via Python

```python
# In Odoo shell or code
user = env.user
credentials = user.get_or_create_iot_credentials()
print(credentials)
# Output: {'username': 'user_admin', 'password': 'xYz...', 'is_superuser': False}
```

## Testing the Connection

### 1. Open Browser Console

Navigate to `/iot/app` and open DevTools console

### 2. Check Configuration

```javascript
console.log(window.odoo.mqtt_config);
```

### 3. Check Connection Status

```javascript
import {mqttService} from "./services/mqtt_service.esm";
console.log(mqttService.state.connected); // Should be true
```

### 4. Subscribe to a Test Topic

Use the UI in the MQTTSubscriber widget:

- Topic: `test/hello`
- Click "Subscribe"

### 5. Publish a Test Message

From another terminal or MQTT client:

```bash
mosquitto_pub -h localhost -p 1883 -t "test/hello" -m "Hello World"
```

Or use the MQTT service:

```javascript
mqttService.publish("test/hello", "Hello from Odoo!");
```

## Troubleshooting

### Connection Error: "MQTT configuration not found"

**Solution:** Make sure you're accessing via `/iot/app` route, not directly opening the
HTML.

### Connection Error: "Failed to connect"

**Check:**

- Is EMQX running? `systemctl status emqx` or `docker ps`
- Is port 8083 accessible? `telnet localhost 8083`
- Check EMQX logs for authentication errors

### Authentication Failed

**Check:**

1. Credentials exist in database
2. EMQX authentication webhook is configured
3. `/iot/auth/<token>` endpoint is accessible

**Test endpoint manually:**

```bash
curl -X POST http://localhost:8069/iot/auth/test \
  -H "Content-Type: application/json" \
  -d '{"username":"user_admin","password":"your_password"}'
```

### Auto-connect Not Working

**Check browser console:**

```javascript
// Should show connection attempt
console.log("Auto-connecting...");
```

**Force reconnect:**

```javascript
await mqttService.disconnect();
await mqttService.connectWithOdooConfig();
```

## Examples

### Subscribe and Display Messages

```javascript
import {mqttService} from "./services/mqtt_service.esm";

async function subscribeToSensor() {
  // Connect if not already connected
  if (!mqttService.state.connected) {
    await mqttService.connectWithOdooConfig();
  }

  // Subscribe to sensor data
  await mqttService.subscribe("sensors/+/temperature", (message, topic) => {
    const data = JSON.parse(message);
    console.log(`Sensor ${topic}: ${data.value}°C`);
  });
}
```

### Publish Command

```javascript
import {mqttService} from "./services/mqtt_service.esm";

function sendCommand(deviceId, command) {
  const topic = `devices/${deviceId}/commands`;
  const message = {
    command: command,
    timestamp: new Date().toISOString(),
  };

  mqttService.publish(topic, message);
}

// Usage
sendCommand("device123", "turn_on");
```

### Listen to Multiple Topics

```javascript
const topics = ["sensors/temp", "sensors/humidity", "alerts/critical"];

for (const topic of topics) {
  await mqttService.subscribe(topic, (message, receivedTopic) => {
    console.log(`[${receivedTopic}] ${message}`);
  });
}
```

## Next Steps

- Read full documentation: `docs/mqtt_authentication.md`
- Configure EMQX authentication webhook
- Set up topic ACLs for security
- Create custom Owl components using MQTT

## Support

For issues or questions:

1. Check logs: Browser Console + Odoo logs
2. Review EMQX dashboard
3. Test authentication endpoint manually
