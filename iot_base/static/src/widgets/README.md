# IoT Widgets

This directory contains pre-configured widgets for visualizing and controlling IoT
devices.

## Available Widgets

### MQTT Subscriber Widget

**Location**: `widgets/mqtt_subscriber/`

A complete widget for subscribing to MQTT topics and viewing incoming messages in
real-time.

#### Features

- Connect to MQTT broker
- Subscribe/unsubscribe to topics
- Display incoming messages with timestamps
- JSON formatting support
- Message history with configurable limit
- Connection status indicator
- Error handling and notifications

#### Usage

```javascript
import { MQTTSubscriber } from "./widgets/mqtt_subscriber/mqtt_subscriber";

// In your component
static components = {
    MQTTSubscriber,
};
```

```xml
<MQTTSubscriber
  title="'My MQTT Monitor'"
  maxMessages="100"
  className="'my-custom-class'"
/>
```

#### Props

| Prop          | Type   | Default           | Description                                   |
| ------------- | ------ | ----------------- | --------------------------------------------- |
| `title`       | String | "MQTT Subscriber" | Widget title                                  |
| `maxMessages` | Number | 50                | Maximum number of messages to keep in history |
| `className`   | String | ""                | Additional CSS classes                        |

#### Example

```javascript
<MQTTSubscriber title="'Temperature Sensors'" maxMessages="100" />
```

## Creating New Widgets

To create a new widget:

1. Create a new directory in `widgets/` with your widget name (e.g., `sensor_status/`)
2. Create the following files:

   - `widget_name.js` - Component logic
   - `widget_name.xml` - Component template
   - `widget_name.scss` - Component styles (optional)

3. Follow this structure:

```javascript
/** @odoo-module **/

import {Component, useState} from "@odoo/owl";
import {mqttService} from "../../services/mqtt_service";

export class MyWidget extends Component {
  static template = "iot_base.MyWidget";

  static props = {
    // Define your props here
  };

  setup() {
    this.mqttService = mqttService;
    this.state = useState({
      // Your state here
    });
  }
}
```

4. Register your widget in the parent component:

```javascript
import { MyWidget } from "./widgets/my_widget/my_widget";

static components = {
    MyWidget,
};
```

## Widget Guidelines

### State Management

- Use `useState` for reactive local state
- Access `mqttService` for MQTT operations
- Clean up subscriptions in `onWillDestroy`

### Styling

- Use Bootstrap 5 utility classes
- Create custom SCSS file for widget-specific styles
- Use BEM naming convention for custom classes
- Scope styles to widget root class

### Error Handling

- Display user-friendly error messages
- Handle connection failures gracefully
- Validate user inputs before operations

### Performance

- Limit message history size
- Throttle high-frequency updates
- Unsubscribe from topics when component unmounts

## Future Widgets

Planned widgets for future releases:

- **Sensor Status**: Visual indicator for sensor on/off state
- **Device Control Panel**: Button grid for device control
- **Temperature Gauge**: Circular gauge for temperature display
- **Switch Widget**: Toggle switch for device control
- **Chart Widget**: Real-time data visualization
- **Camera Feed**: Video stream display
- **Alert Panel**: Display and manage alerts
- **Device List**: List view of connected devices

## Contributing

When creating new widgets:

1. Follow Odoo Owl best practices
2. Document all props and events
3. Include usage examples
4. Add proper error handling
5. Test with various scenarios
6. Update this README

## References

- [Odoo Owl Documentation](https://github.com/odoo/owl)
- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [Frontend Architecture](../../docs/frontend.md)
