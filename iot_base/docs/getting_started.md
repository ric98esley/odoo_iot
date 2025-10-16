# Getting Started with IoT Dashboard

This guide will help you get started with the IoT Dashboard and test the MQTT
functionality.

## Prerequisites

- Odoo 18.0 installed and running
- MQTT broker (e.g., Mosquitto, EMQX, or HiveMQ)
- Modern web browser with WebSocket support

## Installation

1. Ensure the `iot_base` module is in your Odoo addons path
2. Restart Odoo server
3. Go to Apps menu and install the `iot_base` module
4. Access the dashboard at: `http://localhost:8069/iot/app`

## MQTT Broker Setup

### Option 1: Using Mosquitto (Recommended for Development)

1. **Install Mosquitto**:

   ```bash
   # Ubuntu/Debian
   sudo apt-get install mosquitto mosquitto-clients

   # macOS
   brew install mosquitto

   # Windows
   # Download from https://mosquitto.org/download/
   ```

2. **Enable WebSocket Support**:

   Edit Mosquitto configuration file (usually at `/etc/mosquitto/mosquitto.conf`):

   ```conf
   # Default MQTT port
   listener 1883

   # WebSocket support
   listener 8883
   protocol websockets

   # Allow anonymous connections (for testing only!)
   allow_anonymous true
   ```

3. **Start Mosquitto**:

   ```bash
   # Linux/macOS
   mosquitto -c /etc/mosquitto/mosquitto.conf -v

   # Windows
   mosquitto.exe -c mosquitto.conf -v
   ```

### Option 2: Using Docker

```bash
docker run -it -p 1883:1883 -p 8883:8883 \
  -v $(pwd)/mosquitto.conf:/mosquitto/config/mosquitto.conf \
  eclipse-mosquitto
```

### Option 3: Using Public Broker (Testing Only)

For quick testing, you can use a public MQTT broker:

- **HiveMQ**: `wss://broker.hivemq.com:8884/mqtt`
- **EMQX**: `wss://broker.emqx.io:8084/mqtt`
- **Mosquitto Test**: `ws://test.mosquitto.org:8080`

⚠️ **Warning**: Public brokers are not secure and should only be used for testing!

## Testing the Dashboard

### 1. Access the Dashboard

Open your browser and navigate to:

```
http://localhost:8069/iot/app
```

You should see the IoT Dashboard with the MQTT Subscriber widget.

### 2. Connect to MQTT Broker

1. In the "Broker URL" field, enter your MQTT broker WebSocket URL:

   - Local Mosquitto: `ws://localhost:8883`
   - Public HiveMQ: `wss://broker.hivemq.com:8884/mqtt`

2. The dashboard will attempt to connect when you try to subscribe to a topic.

### 3. Subscribe to a Topic

1. In the "MQTT Topic" field, enter a topic name (e.g., `test/temperature`)
2. Click the "Subscribe" button
3. You should see a green "Connected" badge and a confirmation message

### 4. Send Test Messages

You can send test messages using various methods:

#### Method 1: Using Mosquitto CLI

```bash
# Send a simple message
mosquitto_pub -h localhost -p 1883 -t "test/temperature" -m "25.5"

# Send a JSON message
mosquitto_pub -h localhost -p 1883 -t "test/temperature" \
  -m '{"value": 25.5, "unit": "celsius", "sensor": "DHT22"}'

# Send multiple messages
for i in {1..10}; do
  mosquitto_pub -h localhost -p 1883 -t "test/temperature" \
    -m "{\"value\": $((20 + RANDOM % 10)), \"timestamp\": \"$(date -Iseconds)\"}"
  sleep 1
done
```

#### Method 2: Using Python

```python
import paho.mqtt.client as mqtt
import json
import time

# Connect to broker
client = mqtt.Client()
client.connect("localhost", 1883, 60)

# Send messages
for i in range(10):
    payload = {
        "value": 20 + i,
        "unit": "celsius",
        "sensor": "DHT22",
        "timestamp": time.time()
    }
    client.publish("test/temperature", json.dumps(payload))
    time.sleep(1)

client.disconnect()
```

#### Method 3: Using Node.js

```javascript
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  let count = 0;
  setInterval(() => {
    const payload = {
      value: 20 + Math.random() * 10,
      unit: "celsius",
      sensor: "DHT22",
      timestamp: Date.now(),
    };
    client.publish("test/temperature", JSON.stringify(payload));
    console.log("Sent:", payload);
    count++;
    if (count >= 10) {
      client.end();
    }
  }, 1000);
});
```

#### Method 4: Using MQTT.fx (GUI Tool)

1. Download MQTT.fx from https://mqttfx.jensd.de/
2. Configure connection to your broker
3. Connect and publish messages to your topic

### 5. View Messages

Messages should appear in the dashboard in real-time:

- Each message shows the topic, timestamp, and content
- JSON messages are automatically formatted
- Message list is scrollable
- Latest messages appear at the top

## Common Use Cases

### Temperature Monitoring

**Topic**: `sensors/temperature`

**Message Format**:

```json
{
  "value": 25.5,
  "unit": "celsius",
  "sensor_id": "temp_001",
  "location": "living_room"
}
```

### Device Status

**Topic**: `devices/+/status`

**Message Format**:

```json
{
  "device_id": "led_001",
  "status": "online",
  "battery": 85,
  "last_seen": "2025-10-09T10:30:00Z"
}
```

### Switch Control

**Topic**: `devices/+/switch`

**Message Format**:

```json
{
  "device_id": "switch_001",
  "state": "on",
  "timestamp": 1696848600
}
```

## Troubleshooting

### Connection Issues

**Problem**: "Connection Error: Connection refused"

**Solutions**:

- Verify MQTT broker is running
- Check WebSocket port is correct (usually 8883 or 9001)
- Ensure broker allows WebSocket connections
- Check firewall settings
- Try using `ws://` instead of `wss://` for local testing

**Problem**: "WebSocket connection failed"

**Solutions**:

- Ensure broker has WebSocket listener configured
- Check browser console for detailed error messages
- Verify broker URL format (must start with `ws://` or `wss://`)
- Try a different port if available

### Subscription Issues

**Problem**: Not receiving messages

**Solutions**:

- Verify you're subscribed to the correct topic
- Check topic wildcards (`+` for single level, `#` for multiple levels)
- Ensure messages are being published to the broker
- Check broker logs for errors
- Verify QoS settings match

### Browser Issues

**Problem**: Dashboard not loading

**Solutions**:

- Clear browser cache
- Check browser console for JavaScript errors
- Verify Odoo module is installed and updated
- Check asset bundle compilation
- Try a different browser

### Performance Issues

**Problem**: Dashboard becomes slow with many messages

**Solutions**:

- Reduce `maxMessages` prop value
- Use "Clear" button to remove old messages
- Unsubscribe when not actively monitoring
- Consider using topic filters

## MQTT Topic Patterns

### Best Practices

1. **Use hierarchical structure**:

   ```
   company/location/device-type/device-id/measurement
   ```

   Example: `home/living-room/sensor/temp-001/temperature`

2. **Use wildcards for subscriptions**:

   - Single level: `sensors/+/temperature` (matches `sensors/temp1/temperature`)
   - Multiple levels: `sensors/#` (matches all under `sensors/`)

3. **Avoid leading slashes**: Use `sensors/temp` not `/sensors/temp`

4. **Keep topics readable**: Use descriptive names

5. **Separate read/write topics**:
   - Read: `sensors/temp-001/data`
   - Write: `sensors/temp-001/command`

## Next Steps

1. **Explore the Code**: Check out the `static/src/` directory to understand the
   architecture
2. **Read Documentation**: See `docs/frontend.md` for detailed architecture information
3. **Create Custom Widgets**: Follow the widget creation guide in
   `static/src/widgets/README.md`
4. **Extend Functionality**: Add new components or services as needed
5. **Build Your Dashboard**: Combine multiple widgets to create your custom IoT
   dashboard

## Resources

- [MQTT Protocol Specification](https://mqtt.org/mqtt-specification/)
- [Mosquitto Documentation](https://mosquitto.org/documentation/)
- [MQTT.js Client Documentation](https://github.com/mqttjs/MQTT.js)
- [Odoo Owl Framework](https://github.com/odoo/owl)
- [IoT Dashboard Frontend Architecture](frontend.md)

## Need Help?

- Check the [FAQ](faq.md) (coming soon)
- Review [Troubleshooting Guide](troubleshooting.md) (coming soon)
- Open an issue on GitHub
- Contact the development team

---

**Happy IoT Development! 🚀**
