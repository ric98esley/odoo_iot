# Testing Guide for IoT Dashboard

This document provides instructions for testing the IoT Dashboard frontend components
and MQTT functionality.

## Quick Start Testing

### 1. Start Odoo Server

```bash
cd /path/to/odoo
./odoo-bin -c odoo.conf -u iot_base
```

### 2. Access the Dashboard

Open your browser and navigate to:

```
http://localhost:8069/iot/app
```

### 3. Run Local MQTT Broker

```bash
# Using Mosquitto
mosquitto -c mosquitto.conf -v

# Using Docker
docker run -it -p 1883:1883 -p 8883:8883 eclipse-mosquitto
```

## Component Testing

### Input Component

**Test Cases**:

1. **Basic Input**:

   - Enter text in input field
   - Verify onChange event fires on blur
   - Verify onInput event fires on each keystroke

2. **Enter Key Handling**:

   - Type text and press Enter
   - Verify onEnter event fires with correct value

3. **Required Field**:

   - Set required prop to true
   - Verify red asterisk appears next to label
   - Test form validation

4. **Disabled State**:

   - Set disabled prop to true
   - Verify input is not editable
   - Verify visual disabled state

5. **Different Types**:
   - Test with type="password"
   - Test with type="email"
   - Test with type="number"

### Button Component

**Test Cases**:

1. **Basic Button**:

   - Click button
   - Verify onClick event fires

2. **Loading State**:

   - Set loading prop to true
   - Verify spinner appears
   - Verify button is disabled during loading

3. **Disabled State**:

   - Set disabled prop to true
   - Click button
   - Verify onClick does not fire

4. **Variants**:

   - Test all Bootstrap variants (primary, secondary, success, danger, etc.)
   - Verify correct styling applies

5. **Icon Support**:

   - Add icon prop with FontAwesome class
   - Verify icon displays correctly

6. **Slot Content**:
   - Use slot instead of label prop
   - Verify custom content renders

## Widget Testing

### MQTT Subscriber Widget

**Test Cases**:

#### Connection Tests

1. **Connect to Broker**:

   - Enter valid broker URL
   - Subscribe to a topic
   - Verify "Connected" badge appears
   - Verify badge is green

2. **Connection Error**:

   - Enter invalid broker URL
   - Try to subscribe
   - Verify error message appears
   - Verify error message is descriptive

3. **Connection Retry**:
   - Start with broker offline
   - Try to connect
   - Start broker
   - Verify automatic reconnection

#### Subscription Tests

1. **Basic Subscription**:

   - Enter topic name "test/basic"
   - Click Subscribe button
   - Verify subscription confirmation message
   - Verify button changes to Unsubscribe

2. **Empty Topic**:

   - Leave topic field empty
   - Click Subscribe
   - Verify error message "Please enter a topic"

3. **Topic Wildcards**:

   - Subscribe to "sensors/+/temperature"
   - Publish to "sensors/room1/temperature"
   - Publish to "sensors/room2/temperature"
   - Verify both messages received

4. **Multiple Subscriptions**:

   - Subscribe to topic A
   - Change topic to B
   - Subscribe to topic B
   - Verify previous subscription is cleaned up

5. **Unsubscribe**:
   - Subscribe to a topic
   - Click Unsubscribe button
   - Publish message to that topic
   - Verify no new messages appear

#### Message Display Tests

1. **Simple Text Message**:

   - Subscribe to topic
   - Publish plain text message
   - Verify message appears in list
   - Verify timestamp is correct

2. **JSON Message**:

   - Publish JSON message
   - Verify message is formatted with indentation
   - Verify JSON is valid and readable

3. **Multiple Messages**:

   - Publish 10 messages rapidly
   - Verify all messages appear
   - Verify newest messages at top
   - Verify order is correct

4. **Message Limit**:

   - Set maxMessages prop to 5
   - Publish 10 messages
   - Verify only 5 most recent messages are kept

5. **Long Messages**:

   - Publish very long message (> 1000 chars)
   - Verify message is scrollable
   - Verify UI doesn't break

6. **Special Characters**:
   - Publish message with emojis
   - Publish message with HTML tags
   - Publish message with escape characters
   - Verify proper handling and display

#### UI Interaction Tests

1. **Clear Messages**:

   - Receive multiple messages
   - Click Clear button
   - Verify all messages are removed
   - Verify clear button disappears when no messages

2. **Message List Scrolling**:

   - Receive 50+ messages
   - Verify scroll bar appears
   - Scroll up and down
   - Verify smooth scrolling

3. **Responsive Design**:
   - Test on different screen sizes
   - Verify layout adapts properly
   - Test on mobile viewport

#### Cleanup Tests

1. **Component Unmount**:
   - Subscribe to topic
   - Navigate away from dashboard
   - Verify subscription is cleaned up
   - Verify no memory leaks

## MQTT Service Testing

### Connection Management

**Test Script** (Browser Console):

```javascript
import {mqttService} from "./services/mqtt_service";

// Test connection
await mqttService.connect({
  url: "ws://localhost:8883",
});

console.log("Connected:", mqttService.state.connected);

// Test disconnection
mqttService.disconnect();
console.log("Connected:", mqttService.state.connected);
```

### Subscription Management

**Test Script**:

```javascript
// Subscribe with callback
const callback = (message, topic) => {
  console.log(`Received on ${topic}:`, message);
};

await mqttService.subscribe("test/topic", callback);
console.log("Subscriptions:", mqttService.state.subscriptions);

// Unsubscribe
mqttService.unsubscribe("test/topic", callback);
console.log("Subscriptions:", mqttService.state.subscriptions);
```

### Message Publishing

**Test Script**:

```javascript
// Publish text message
mqttService.publish("test/topic", "Hello World");

// Publish JSON message
mqttService.publish("test/topic", {
  temperature: 25.5,
  humidity: 60,
});

// Publish with options
mqttService.publish("test/topic", "Important", {
  qos: 1,
  retain: true,
});
```

## Integration Testing

### End-to-End Test Scenario

1. **Setup**:

   - Start Mosquitto broker
   - Start Odoo server
   - Open dashboard in browser

2. **Test Flow**:

   ```
   a. Enter broker URL: ws://localhost:8883
   b. Enter topic: test/e2e
   c. Click Subscribe
   d. Verify connected
   e. Run external publisher:
      mosquitto_pub -h localhost -t test/e2e -m "Test message"
   f. Verify message appears in dashboard
   g. Click Clear
   h. Verify messages cleared
   i. Click Unsubscribe
   j. Verify unsubscribed
   k. Publish another message
   l. Verify message does NOT appear
   ```

3. **Cleanup**:
   - Refresh page
   - Verify clean state
   - No console errors

## Performance Testing

### Load Testing

**Test Script**:

```bash
#!/bin/bash
# Publish 1000 messages rapidly

for i in {1..1000}; do
    mosquitto_pub -h localhost -t test/load -m "{\"count\": $i}"
done
```

**Verify**:

- Dashboard remains responsive
- No browser freezing
- Message list scrolls smoothly
- Memory usage stays reasonable

### Stress Testing

**Test Script**:

```bash
#!/bin/bash
# Publish very large messages

for i in {1..100}; do
    # Generate 10KB message
    msg=$(head -c 10000 /dev/urandom | base64)
    mosquitto_pub -h localhost -t test/stress -m "$msg"
done
```

**Verify**:

- Dashboard handles large messages
- No crashes or errors
- UI remains usable

## Browser Compatibility Testing

Test on:

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**Test on each browser**:

1. Basic functionality
2. WebSocket connection
3. Visual appearance
4. Console errors

## Automated Testing (Future)

### Unit Tests (Planned)

```javascript
// Example test structure
describe("MQTTService", () => {
  test("should connect to broker", async () => {
    const service = new MQTTService();
    await service.connect({url: "ws://localhost:8883"});
    expect(service.state.connected).toBe(true);
  });
});
```

### Component Tests (Planned)

```javascript
describe("Input Component", () => {
  test("should render with label", () => {
    // Test implementation
  });

  test("should call onChange when value changes", () => {
    // Test implementation
  });
});
```

## Test Checklist

### Before Each Release

- [ ] All components render without errors
- [ ] MQTT connection works
- [ ] Subscription/unsubscription works
- [ ] Messages display correctly
- [ ] Error handling works
- [ ] Loading states work
- [ ] Buttons are responsive
- [ ] No console errors
- [ ] No console warnings
- [ ] Performance is acceptable
- [ ] Works on all supported browsers
- [ ] Mobile responsive
- [ ] Documentation is up to date

## Reporting Issues

When reporting bugs, include:

1. **Environment**:

   - Odoo version
   - Browser and version
   - Operating system
   - MQTT broker and version

2. **Steps to Reproduce**:

   - Detailed steps
   - Expected behavior
   - Actual behavior

3. **Logs**:

   - Browser console output
   - MQTT broker logs
   - Odoo server logs

4. **Screenshots/Videos**:
   - Visual evidence of the issue

## Test Data

### Sample MQTT Messages

```json
// Temperature sensor
{
  "sensor_id": "temp_001",
  "value": 25.5,
  "unit": "celsius",
  "timestamp": "2025-10-09T10:30:00Z"
}

// Motion detector
{
  "sensor_id": "motion_001",
  "detected": true,
  "location": "entrance",
  "timestamp": "2025-10-09T10:30:00Z"
}

// Door sensor
{
  "sensor_id": "door_001",
  "state": "open",
  "battery": 85,
  "timestamp": "2025-10-09T10:30:00Z"
}

// Smart light
{
  "device_id": "light_001",
  "state": "on",
  "brightness": 75,
  "color": "#FFFFFF",
  "timestamp": "2025-10-09T10:30:00Z"
}
```

## Resources

- [MQTT Test Server](http://test.mosquitto.org/)
- [MQTT.fx Tool](https://mqttfx.jensd.de/)
- [HiveMQ WebSocket Client](http://www.hivemq.com/demos/websocket-client/)
- [Odoo Testing Documentation](https://www.odoo.com/documentation/18.0/developer/reference/backend/testing.html)

---

**Last Updated**: 2025-10-09
