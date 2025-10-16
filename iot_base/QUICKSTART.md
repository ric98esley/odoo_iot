# IoT Dashboard - Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Update the Module in Odoo

```bash
cd /path/to/odoo
./odoo-bin -c odoo.conf -u iot_base
```

### Step 2: Start MQTT Broker (Local Testing)

**Option A: Using Mosquitto**

```bash
# Create config file
cat > mosquitto.conf << EOF
listener 1883
listener 8883
protocol websockets
allow_anonymous true
EOF

# Start broker
mosquitto -c mosquitto.conf -v
```

**Option B: Using Docker**

```bash
docker run -it --rm -p 1883:1883 -p 8883:8883 eclipse-mosquitto
```

**Option C: Use Public Broker**

- No setup needed
- URL: `wss://broker.hivemq.com:8884/mqtt`
- ⚠️ Not secure, testing only!

### Step 3: Access the Dashboard

Open your browser:

```
http://localhost:8069/iot/app
```

You should see:

- 🎨 Beautiful IoT Dashboard header
- 📡 MQTT Subscriber widget
- 🔴 "Disconnected" status badge

### Step 4: Connect and Subscribe

1. **Broker URL**: Enter your broker address

   - Local: `ws://localhost:8883`
   - Public: `wss://broker.hivemq.com:8884/mqtt`

2. **Topic**: Enter a topic name

   - Example: `test/quickstart`

3. **Click "Subscribe"**
   - Badge turns 🟢 green
   - Shows "Connected"
   - Shows "Subscribed to: test/quickstart"

### Step 5: Send Test Messages

**Terminal 1 (Mosquitto CLI)**:

```bash
# Simple message
mosquitto_pub -h localhost -t test/quickstart -m "Hello from IoT!"

# JSON message
mosquitto_pub -h localhost -t test/quickstart \
  -m '{"temperature": 25.5, "humidity": 60, "sensor": "DHT22"}'
```

**Terminal 2 (Python)**:

```python
import paho.mqtt.publish as publish

# Simple message
publish.single("test/quickstart", "Hello from Python!", hostname="localhost")

# JSON message
import json
data = {"temperature": 25.5, "humidity": 60, "sensor": "DHT22"}
publish.single("test/quickstart", json.dumps(data), hostname="localhost")
```

**Terminal 3 (JavaScript/Node.js)**:

```javascript
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  client.publish("test/quickstart", "Hello from Node.js!");
  client.publish(
    "test/quickstart",
    JSON.stringify({
      temperature: 25.5,
      humidity: 60,
      sensor: "DHT22",
    })
  );
  client.end();
});
```

### Step 6: Watch Messages Appear! ✨

Messages will appear in real-time in the dashboard:

- 📨 Latest messages at the top
- 🕐 Timestamp for each message
- 📋 JSON automatically formatted
- 🔄 Smooth animations

## 🎯 What You Just Built

You now have:

- ✅ Real-time MQTT communication
- ✅ WebSocket connection to broker
- ✅ Interactive dashboard
- ✅ Message visualization
- ✅ Production-ready architecture

## 📚 Next Steps

### Learn More

- 📖 [Frontend Architecture](docs/frontend.md)
- 🧪 [Testing Guide](docs/TESTING.md)
- 🗺️ [Architecture Diagrams](docs/ARCHITECTURE_DIAGRAM.md)
- 📘 [Complete Documentation](docs/getting_started.md)

### Extend the Dashboard

- 🧩 Add more components (toggle, select, etc.)
- 🎨 Create custom widgets
- 📊 Add data visualization
- 🔌 Integrate with Odoo backend
- 🤖 Build automation rules

### Explore the Code

```bash
cd iot_base/static/src/

# Components (basic UI)
ls components/
  input/    - Text input component
  button/   - Button component
  README.md - Component documentation

# Widgets (IoT specific)
ls widgets/
  mqtt_subscriber/  - MQTT topic monitor
  README.md         - Widget documentation

# Services (shared logic)
ls services/
  mqtt_service.js   - MQTT client service

# Documentation
ls ../docs/
  frontend.md              - Architecture
  getting_started.md       - User guide
  TESTING.md              - Test guide
  ARCHITECTURE_DIAGRAM.md - Visual diagrams
  SUMMARY.md              - Implementation summary
```

## 🔧 Troubleshooting

### Can't Connect to Broker

```bash
# Check if Mosquitto is running
ps aux | grep mosquitto

# Check WebSocket port
netstat -an | grep 8883

# Test with mosquitto_sub
mosquitto_sub -h localhost -t test/quickstart
```

### Messages Not Appearing

```bash
# Verify broker receives messages
mosquitto_sub -h localhost -t '#' -v

# Check browser console for errors
# Press F12 in browser and check Console tab
```

### Dashboard Not Loading

```bash
# Update module
./odoo-bin -c odoo.conf -u iot_base

# Check Odoo logs
tail -f odoo.log

# Clear browser cache
# Ctrl+Shift+Delete (Chrome/Firefox)
```

## 💡 Pro Tips

### 1. Use Topic Wildcards

```javascript
// Single level wildcard
Subscribe to: sensors/+/temperature
Matches: sensors/room1/temperature, sensors/room2/temperature

// Multi-level wildcard
Subscribe to: sensors/#
Matches: sensors/room1/temperature, sensors/room1/humidity, etc.
```

### 2. Format Your Messages

```javascript
// Good - structured JSON
{
  "device_id": "temp_001",
  "value": 25.5,
  "unit": "celsius",
  "timestamp": "2025-10-09T10:30:00Z"
}

// Works - simple text
"Temperature: 25.5°C"
```

### 3. Monitor Multiple Topics

```javascript
// Option 1: Use wildcards
sensors/+/temperature

// Option 2: Multiple widgets (future)
<MQTTSubscriber title="Temperature" topic="sensors/temp" />
<MQTTSubscriber title="Humidity" topic="sensors/humidity" />
```

## 📊 Example Use Cases

### 1. Temperature Monitoring

```bash
# Topic: sensors/room1/temperature
mosquitto_pub -h localhost -t sensors/room1/temperature \
  -m '{"value": 22.5, "unit": "C", "location": "Living Room"}'
```

### 2. Device Status

```bash
# Topic: devices/light001/status
mosquitto_pub -h localhost -t devices/light001/status \
  -m '{"state": "on", "brightness": 75, "color": "#FFFFFF"}'
```

### 3. Motion Detection

```bash
# Topic: sensors/motion/entrance
mosquitto_pub -h localhost -t sensors/motion/entrance \
  -m '{"detected": true, "confidence": 95, "timestamp": 1696848600}'
```

## 🎓 Learning Resources

- [MQTT Basics](https://mqtt.org/getting-started/)
- [Mosquitto Tutorials](https://mosquitto.org/documentation/)
- [Odoo Owl Framework](https://github.com/odoo/owl)
- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)

## 🤝 Need Help?

1. Check the documentation in `docs/`
2. Review code comments in `static/src/`
3. Look at examples in this guide
4. Open an issue on GitHub
5. Contact the development team

## 🎉 Congratulations!

You've successfully set up your IoT Dashboard! Now you can:

- Monitor real-time sensor data
- Control IoT devices
- Build custom widgets
- Create your own IoT solutions

**Happy Building! 🚀**

---

**Version**: 1.0 **Created**: 2025-10-09 **Author**: Ricardo Perez (ric98esley)
**Module**: iot_base (Odoo 18.0)
