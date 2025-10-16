# Event Indicator Widget

A beautiful IoT widget that displays a hexagon icon indicator that turns on/off based on
MQTT variable data.

## Features

- 🔆 **Animated Hexagon Icon** - Glowing effect when active
- ⚡ **Real-time Updates** - Responds instantly to MQTT messages
- 📊 **Variable Filtering** - Can filter by specific variable name
- 🎨 **Customizable Width** - Configurable card width
- 📡 **Topic Subscription** - Easy MQTT topic configuration
- 💾 **Data Validation** - Uses MQTTMessage model for data integrity

## Data Format

The widget expects MQTT messages in the following JSON format:

```json
{
  "userId": "user123",
  "dId": "device001",
  "variable": "event",
  "value": 1,
  "time": 1696848600000
}
```

### Fields

| Field      | Type   | Required | Description                             |
| ---------- | ------ | -------- | --------------------------------------- |
| `userId`   | String | ✅       | User identifier                         |
| `dId`      | String | ✅       | Device identifier                       |
| `variable` | String | ✅       | Variable name (e.g., "event", "motion") |
| `value`    | Number | ✅       | Variable value (0 = OFF, non-zero = ON) |
| `time`     | Number | ✅       | Unix timestamp in milliseconds          |

## Usage

### Basic Usage

```xml
<EventIndicator title="'Event Monitor'" width="'300px'" variable="'event'" />
```

### Props

| Prop        | Type   | Default           | Description                        |
| ----------- | ------ | ----------------- | ---------------------------------- |
| `title`     | String | "Event Indicator" | Widget title                       |
| `width`     | String | "300px"           | Card width (CSS value)             |
| `variable`  | String | ""                | Filter by variable name (optional) |
| `className` | String | ""                | Additional CSS classes             |

### Full Width Example

```xml
<EventIndicator title="'Motion Detector'" width="'100%'" variable="'motion'" />
```

### Multiple Indicators

```xml
<div class="row">
  <div class="col-md-4">
    <EventIndicator title="'Front Door'" variable="'door_front'" />
  </div>
  <div class="col-md-4">
    <EventIndicator title="'Motion Sensor'" variable="'motion_living'" />
  </div>
  <div class="col-md-4">
    <EventIndicator title="'Window Alert'" variable="'window_alert'" />
  </div>
</div>
```

## How It Works

### 1. Subscribe to Topic

Enter an MQTT topic and click "Subscribe":

```
device/sensor/events
```

### 2. Receive Messages

The widget listens for messages on the subscribed topic.

### 3. Parse and Validate

Messages are parsed using the `MQTTMessage` model, which validates:

- All required fields are present
- Data types are correct
- Values are within expected ranges

### 4. Update Display

- **Icon Color**: Gray (OFF) → Gold (ON)
- **Glow Effect**: Animated rays appear when ON
- **Status Badge**: Shows current state with icon
- **Last Message**: Displays variable details and timestamp

## Visual States

### OFF State

- Gray hexagon icon
- No glow effect
- Dark status badge
- Status: "OFF"

### ON State

- Gold hexagon icon (#FFD700)
- Animated glow rays
- Green status badge (pulsing)
- Status: "ON"
- Lightning bolt icon ⚡

## Testing

### Test Message - ON State

```bash
mosquitto_pub -h localhost -t device/events -m '{
  "userId": "user123",
  "dId": "sensor001",
  "variable": "event",
  "value": 1,
  "time": 1696848600000
}'
```

### Test Message - OFF State

```bash
mosquitto_pub -h localhost -t device/events -m '{
  "userId": "user123",
  "dId": "sensor001",
  "variable": "event",
  "value": 0,
  "time": 1696848700000
}'
```

### Python Test Script

```python
import paho.mqtt.client as mqtt
import json
import time

client = mqtt.Client()
client.connect("localhost", 1883, 60)

def send_event(variable, value):
    message = {
        "userId": "user123",
        "dId": "sensor001",
        "variable": variable,
        "value": value,
        "time": int(time.time() * 1000)
    }
    client.publish("device/events", json.dumps(message))
    print(f"Sent: {variable} = {value}")

# Turn ON
send_event("event", 1)
time.sleep(5)

# Turn OFF
send_event("event", 0)

client.disconnect()
```

### Node.js Test Script

```javascript
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  let state = 1;

  setInterval(() => {
    const message = {
      userId: "user123",
      dId: "sensor001",
      variable: "event",
      value: state,
      time: Date.now(),
    };

    client.publish("device/events", JSON.stringify(message));
    console.log(`Sent: event = ${state}`);

    state = state === 1 ? 0 : 1; // Toggle
  }, 3000);
});
```

## Variable Filtering

Set the `variable` prop to filter messages:

```xml
<EventIndicator variable="'motion'" />
```

This widget will **only** respond to messages where `message.variable === "motion"`.

Without the `variable` prop, it responds to **all** messages on the topic.

## Error Handling

The widget handles various error scenarios:

### Invalid Message Format

```
❌ Invalid message format: Field 'value' is required
```

### MQTT Not Connected

```
❌ MQTT not connected. Please connect first.
```

### Missing Topic

```
❌ Please enter a topic
```

### Parse Error

```
❌ Failed to parse MQTT message: Unexpected token
```

## Styling

The widget uses:

- **Background**: Gradient from cream to white
- **Border**: 2px solid light gray
- **Icon**: SVG hexagon with dynamic fill
- **Animation**: Pulse effect on rays and badge
- **Font**: Comic Sans MS for the "Event" label

## Components Used

### Card Component

A reusable card container with:

- Configurable width
- Optional header
- Custom body classes
- Slot support

### MQTTMessage Model

Data validation and parsing:

- Type checking
- Required field validation
- Helper methods (isOn, getFormattedTime)
- JSON serialization

## Architecture

```
EventIndicator Widget
├── Card Component (container)
├── MQTTMessage Model (data validation)
└── MQTT Service (communication)
```

## Integration

The widget is integrated in `root.xml`:

```xml
<div class="col-lg-4">
  <div class="row g-3">
    <div class="col-md-6 col-lg-12">
      <EventIndicator title="'Event Monitor'" width="'100%'" variable="'event'" />
    </div>
    <div class="col-md-6 col-lg-12">
      <EventIndicator title="'Motion Detector'" width="'100%'" variable="'motion'" />
    </div>
  </div>
</div>
```

## Future Enhancements

- [ ] Custom icons (not just hexagon)
- [ ] Color themes
- [ ] Sound alerts
- [ ] History log
- [ ] Chart visualization
- [ ] Multiple state values (not just ON/OFF)
- [ ] Custom thresholds
- [ ] Event counters

## Troubleshooting

### Icon Not Updating

- Check MQTT connection status
- Verify topic subscription
- Check message format
- Look at browser console for errors

### Wrong Variable

- Check `variable` prop matches message data
- Try without variable filter first
- Verify message structure

### No Glow Effect

- Ensure browser supports SVG filters
- Check if value is non-zero
- Clear browser cache

---

**Created**: 2025-10-10 **Author**: Ricardo Perez (ric98esley) **Version**: 1.0.0
