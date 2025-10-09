# IoT Dashboard Frontend Source

This directory contains the complete frontend implementation for the IoT Dashboard built
with Odoo Owl Framework.

## 📁 Directory Structure

```
src/
├── app.esm.js              # Application entry point
├── root.esm.js             # Root component (main container)
├── root.xml                # Root component template
│
├── components/             # Basic reusable UI components
│   ├── README.md          # Component documentation
│   ├── input/             # Input component
│   │   ├── input.js
│   │   └── input.xml
│   └── button/            # Button component
│       ├── button.js
│       └── button.xml
│
├── widgets/               # Pre-configured IoT visualizations
│   ├── README.md         # Widget documentation
│   └── mqtt_subscriber/  # MQTT subscription widget
│       ├── mqtt_subscriber.js
│       ├── mqtt_subscriber.xml
│       └── mqtt_subscriber.scss
│
├── services/             # Shared business logic and utilities
│   └── mqtt_service.js   # MQTT connection and messaging service
│
├── store/                # Application state management (ready for use)
│
├── models/               # Widget-specific logic models (ready for use)
│
└── views/                # Additional views (ready for use)
```

## 🚀 Quick Start

### 1. Entry Point Flow

```
app.esm.js → mounts → Root Component → renders → Widgets & Components
```

### 2. Component Hierarchy

```
Root (root.esm.js)
 └─► MQTTSubscriber (widgets/mqtt_subscriber/)
      ├─► Input (components/input/)
      ├─► Button (components/button/)
      └─► MQTTService (services/mqtt_service.js)
```

### 3. Accessing the Dashboard

1. Install `iot_base` module in Odoo
2. Navigate to: `http://localhost:8069/iot/app`
3. Dashboard loads and mounts Root component
4. MQTT Subscriber widget is ready to use

## 📦 Key Files

### Application Files

#### `app.esm.js`

Application entry point that:

- Imports the Root component
- Mounts the component to document.body
- Initializes the Owl application

#### `root.esm.js` & `root.xml`

Root component that:

- Serves as the main container
- Imports and renders child widgets
- Provides application layout
- Sets up the dashboard header

### Component Files

Located in `components/`:

- **Basic UI components** that are generic and reusable
- Each component has its own directory with `.js` and `.xml` files
- Used by widgets to build complex interfaces

Current components:

- ✅ Input: Text input with validation and events
- ✅ Button: Versatile button with variants and states

See `components/README.md` for detailed documentation.

### Widget Files

Located in `widgets/`:

- **Pre-configured IoT visualizations**
- Each widget has `.js`, `.xml`, and optionally `.scss` files
- Widgets use components and services
- Contain IoT-specific business logic

Current widgets:

- ✅ MQTT Subscriber: Topic subscription and message display

See `widgets/README.md` for detailed documentation.

### Service Files

Located in `services/`:

- **Shared business logic and utilities**
- Singleton services accessible throughout the app
- Handle external communications (MQTT, RPC)
- Manage global state

Current services:

- ✅ MQTT Service: Connection management and message routing

### Store Files

Located in `store/`:

- **Centralized state management**
- Reactive state objects
- Single source of truth for shared data
- Currently empty, ready for use

### Model Files

Located in `models/`:

- **Widget-specific data models**
- Business logic independent of UI
- Data transformation and validation
- Currently empty, ready for use

## 🔧 Development

### Adding a New Component

```bash
# Create component directory
mkdir components/my_component

# Create component files
touch components/my_component/my_component.js
touch components/my_component/my_component.xml
```

```javascript
// components/my_component/my_component.js
/** @odoo-module **/

import {Component} from "@odoo/owl";

export class MyComponent extends Component {
  static template = "iot_base.MyComponent";
  static props = {
    // Define props
  };
}
```

See `components/README.md` for detailed guide.

### Adding a New Widget

```bash
# Create widget directory
mkdir widgets/my_widget

# Create widget files
touch widgets/my_widget/my_widget.js
touch widgets/my_widget/my_widget.xml
touch widgets/my_widget/my_widget.scss
```

```javascript
// widgets/my_widget/my_widget.js
/** @odoo-module **/

import {Component, useState} from "@odoo/owl";
import {mqttService} from "../../services/mqtt_service";

export class MyWidget extends Component {
  static template = "iot_base.MyWidget";

  setup() {
    this.mqttService = mqttService;
    this.state = useState({
      // Widget state
    });
  }
}
```

See `widgets/README.md` for detailed guide.

### Adding a New Service

```javascript
// services/my_service.js
/** @odoo-module **/

import {reactive} from "@odoo/owl";

export class MyService {
  constructor() {
    this.state = reactive({
      // Service state
    });
  }

  // Service methods
}

// Export singleton instance
export const myService = new MyService();
```

## 📚 Documentation

### Main Documentation

Located in `../docs/`:

- **frontend.md**: Complete architecture documentation
- **getting_started.md**: User guide for getting started
- **TESTING.md**: Comprehensive testing guide
- **SUMMARY.md**: Implementation summary

### Component Documentation

- `components/README.md`: Basic component documentation
- `widgets/README.md`: Widget documentation and guides

## 🧪 Testing

### Manual Testing

```bash
# 1. Start Odoo
./odoo-bin -c odoo.conf -u iot_base

# 2. Open browser
http://localhost:8069/iot/app

# 3. Test functionality
# See docs/TESTING.md for detailed test cases
```

### Browser Console Testing

```javascript
// Access MQTT service
import {mqttService} from "/iot_base/static/src/services/mqtt_service.js";

// Test connection
await mqttService.connect({url: "ws://localhost:8883"});

// Subscribe to topic
await mqttService.subscribe("test/topic", (message) => {
  console.log("Received:", message);
});
```

## 🎨 Styling

### Bootstrap 5

All components use Bootstrap 5 utility classes:

- Layout: `container`, `row`, `col`, `d-flex`
- Spacing: `m-*`, `p-*`, `gap-*`
- Typography: `h1-h6`, `text-*`, `fw-*`
- Components: `btn`, `card`, `badge`, `alert`

### Custom SCSS

Widget-specific styles are in their respective `.scss` files:

- Use BEM methodology for custom classes
- Scope styles to widget root class
- Use CSS custom properties for theming

## 🔌 MQTT Integration

### Using MQTT Service

```javascript
import { mqttService } from "./services/mqtt_service";

// In component setup
setup() {
    this.mqttService = mqttService;
}

// Connect to broker
await this.mqttService.connect({
    url: 'ws://localhost:8883',
    username: 'user',  // optional
    password: 'pass'   // optional
});

// Subscribe to topic
await this.mqttService.subscribe('sensors/temp', (message, topic) => {
    console.log(`${topic}: ${message}`);
});

// Publish message
this.mqttService.publish('devices/switch', 'on');

// Unsubscribe
this.mqttService.unsubscribe('sensors/temp');
```

## 🏗️ Architecture Patterns

### Component Communication

1. **Parent → Child**: Props

   ```xml
   <MyComponent value="state.value" />
   ```

2. **Child → Parent**: Events

   ```xml
   <MyComponent onChange.bind="onValueChange" />
   ```

3. **Sibling ↔ Sibling**: Shared Service
   ```javascript
   this.mqttService.subscribe("topic", callback);
   ```

### State Management

1. **Local State**: `useState` in components
2. **Shared State**: Reactive state in services
3. **Props**: Pass data down component tree

### Lifecycle Hooks

```javascript
import { onWillStart, onMounted, onWillDestroy } from "@odoo/owl";

setup() {
    onWillStart(async () => {
        // Before first render
    });

    onMounted(() => {
        // After component mounted
    });

    onWillDestroy(() => {
        // Cleanup
    });
}
```

## 📈 Performance Tips

1. **Use `t-key` in lists**: Efficient updates
2. **Limit message history**: Prevent memory bloat
3. **Cleanup subscriptions**: In `onWillDestroy`
4. **Throttle updates**: For high-frequency data
5. **Lazy load widgets**: When possible

## 🐛 Debugging

### Browser Console

```javascript
// Enable Owl dev mode
window.__OWL_DEVTOOLS__ = true;

// Check MQTT service state
console.log(mqttService.state);

// Monitor message flow
mqttService.subscribe("test/debug", (msg) => {
  console.log("Debug:", msg);
});
```

### Common Issues

1. **Component not rendering**: Check template name matches
2. **Props error**: Verify prop types and required props
3. **MQTT not connecting**: Check broker URL and WebSocket support
4. **Messages not received**: Verify subscription and topic

## 🚀 Next Steps

### Immediate

1. Test the MQTT Subscriber widget
2. Send test messages from external publisher
3. Verify real-time updates work

### Short Term

1. Add more basic components (toggle, select)
2. Create additional widgets (sensor status, device control)
3. Implement widget configuration
4. Add backend integration

### Long Term

1. Dashboard customization
2. Widget marketplace
3. Historical data visualization
4. Advanced analytics
5. PWA capabilities

## 📖 Resources

- [Odoo Owl Documentation](https://github.com/odoo/owl)
- [Odoo 18 Developer Docs](https://www.odoo.com/documentation/18.0/developer.html)
- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0)
- [MQTT Protocol Specification](https://mqtt.org/mqtt-specification/)

## 🤝 Contributing

### Code Style

- Follow Odoo Owl patterns
- Use JSDoc comments
- Validate all props
- Handle errors gracefully
- Clean up resources

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-widget

# Make changes and commit
git add .
git commit -m "Add: My new widget"

# Push and create PR
git push origin feature/my-widget
```

## 📝 License

AGPL-3 (as per Odoo module)

---

**Version**: 1.0 **Last Updated**: 2025-10-09 **Maintainer**: Ricardo Perez (ric98esley)
**Framework**: Odoo 18.0 + Owl Framework
