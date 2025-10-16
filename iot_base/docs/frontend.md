# IoT Base - Frontend Architecture

## Overview

The IoT Base frontend is built with **Odoo Owl Framework** to create a modern, reactive
dashboard for managing IoT devices through MQTT protocol. The architecture follows a
component-based approach with clear separation of concerns.

## Architecture Principles

### Component-Based Design

- **Reusable Components**: Small, focused, single-responsibility components
- **Reactive State Management**: Using Owl's `useState` for reactive updates
- **Service Layer**: Shared functionalities across components
- **Widget System**: Pre-configured visualizations for IoT data

## Directory Structure

```
static/src/
├── app.esm.js              # Application entry point
├── root.esm.js             # Root component
├── root.xml                # Root component template
├── components/             # Basic UI components (inputs, buttons, toggles)
│   ├── input/
│   │   ├── input.js
│   │   └── input.xml
│   ├── button/
│   └── ...
├── widgets/                # Pre-configured IoT visualizations
│   ├── mqtt_subscriber/    # Widget for MQTT topic subscription & display
│   │   ├── mqtt_subscriber.js
│   │   ├── mqtt_subscriber.xml
│   │   └── mqtt_subscriber.scss
│   ├── sensor_status/      # Widget to display sensor on/off status
│   ├── device_control/     # Widget with control buttons
│   └── ...
├── services/               # Shared business logic
│   ├── mqtt_service.js     # MQTT connection and messaging
│   └── ...
├── store/                  # Application state management
│   ├── mqtt_store.js       # MQTT connections state
│   └── ...
└── models/                 # Widget-specific logic models
    ├── mqtt_message.js
    └── ...
```

## Core Concepts

### 1. Components (`/components`)

Basic, reusable UI elements that have no specific business logic. Examples:

- **Input**: Text input with validation
- **Button**: Clickable button with states
- **Toggle**: Switch component for boolean values
- **Select**: Dropdown selection component

**Characteristics:**

- Generic and reusable across the application
- Props-driven behavior
- Minimal internal state
- Emit events for parent handling

### 2. Widgets (`/widgets`)

Pre-configured components designed for specific IoT use cases. Examples:

- **MQTT Subscriber**: Subscribe to topics and display messages
- **Sensor Status**: Visual indicator for sensor on/off state
- **Device Control**: Button panel to control device actions

**Characteristics:**

- Use basic components internally
- Contain IoT-specific logic
- May have their own models for data transformation
- Connect to services for external communication

### 3. Services (`/services`)

Singleton services providing shared functionality. Examples:

- **MQTT Service**: Handle MQTT connections, subscriptions, and message routing
- **Device Service**: Manage device data and API calls
- **Notification Service**: User notifications and alerts

**Characteristics:**

- Created once and shared across components
- Provide interfaces for external systems (MQTT broker, Odoo backend)
- Handle connection lifecycle and error management
- Use Odoo's service pattern with `makeService`

### 4. Store (`/store`)

Centralized state management for shared application state. Examples:

- **MQTT Store**: Active connections, subscriptions, message history
- **Device Store**: Connected devices and their states

**Characteristics:**

- Reactive state using Owl's `reactive` API
- Single source of truth for shared data
- Accessed through services or direct import
- Persist important state when needed

### 5. Models (`/models`)

Business logic specific to widget types. Examples:

- **MQTT Message Model**: Parse and format MQTT messages
- **Sensor Data Model**: Transform sensor readings

**Characteristics:**

- Plain JavaScript classes or objects
- Data transformation and validation logic
- Widget-specific calculations and formatting
- Independent of UI framework

## Technology Stack

### Core Technologies

- **Odoo Owl 2.x**: Reactive component framework
- **MQTT.js**: MQTT protocol client
- **QWeb Templates**: XML-based templating system
- **Bootstrap 5**: UI styling framework

### Communication Patterns

1. **MQTT Protocol**: Real-time bidirectional communication with IoT devices
2. **Odoo RPC**: HTTP/JSON-RPC for backend integration
3. **Owl Events**: Component-to-component communication
4. **Service Bus**: Global event broadcasting

## MQTT Integration

### Connection Flow

1. User provides MQTT broker connection details
2. MQTT Service establishes WebSocket connection
3. Service maintains connection state
4. Widgets subscribe to specific topics through the service
5. Service routes incoming messages to subscribed widgets

### Message Flow

```
MQTT Broker → MQTT Service → Store → Widget Components → UI Update
Device Control → Widget → MQTT Service → MQTT Broker → IoT Device
```

## Component Communication

### Parent-to-Child

- Props passing with validation
- Using `t-props` for bulk properties

### Child-to-Parent

- Event emission with `this.trigger()`
- Callback props for simple cases

### Sibling-to-Sibling

- Through parent coordination
- Through shared services
- Through reactive store

### Global Communication

- Service bus for application-wide events
- MQTT Service for device-related messages

## State Management Strategy

### Local State

- Component-specific UI state (loading, expanded, etc.)
- Managed with `useState` hook
- Scoped to component lifecycle

### Shared State

- MQTT connections and subscriptions
- Device list and status
- User preferences
- Stored in reactive store objects

### Backend State

- Persisted device configurations
- User settings and layouts
- Historical data
- Fetched through RPC calls

## Styling Approach

### Utility-First with Bootstrap 5

- Use Bootstrap classes for layout and common patterns
- Custom SCSS for widget-specific styling
- Follow Odoo's design system

### Component Styling

- Each widget has its own `.scss` file
- Use BEM methodology for custom classes
- Scope styles to component root class

### Theming

- Support light/dark mode (future)
- Use CSS custom properties for theming
- Respect Odoo theme settings

## Error Handling

### UI Level

- Display user-friendly error messages
- Loading states during async operations
- Graceful degradation when services unavailable

### Service Level

- Try-catch blocks for async operations
- Connection retry logic for MQTT
- Error event emission for component handling

### Development Mode

- Detailed console logging
- Error boundaries for component errors
- Debug mode toggle

## Performance Considerations

### Rendering Optimization

- Use `t-key` for list rendering
- Implement `shouldUpdate` for expensive components
- Lazy load widgets when possible

### MQTT Optimization

- Throttle high-frequency messages
- Limit message history size
- Unsubscribe from topics when components unmount

### Memory Management

- Clean up event listeners in `onWillDestroy`
- Disconnect MQTT clients when not needed
- Clear message buffers periodically

## Development Workflow

### Adding a New Widget

1. Create widget directory in `/widgets`
2. Implement component class with Owl
3. Create XML template
4. Add styling in SCSS file
5. Register widget if needed
6. Document widget props and usage

### Adding a New Component

1. Create component directory in `/components`
2. Follow single-responsibility principle
3. Define clear prop interface
4. Emit events for actions
5. Keep styling minimal and flexible

### Adding a New Service

1. Create service file in `/services`
2. Use `makeService` pattern
3. Define clear public API
4. Handle initialization and cleanup
5. Document service methods

## Testing Strategy (Future)

### Unit Tests

- Test pure functions in models
- Test service logic independently
- Mock external dependencies

### Component Tests

- Test component rendering
- Test prop variations
- Test event emission

### Integration Tests

- Test widget with services
- Test MQTT message flow
- Test full user workflows

## Future Enhancements

### Planned Features

- Widget marketplace/library
- Dashboard customization (drag & drop)
- Widget configuration persistence
- Historical data visualization
- Alert and automation rules
- Multi-broker support
- Device grouping and filtering

### Technical Improvements

- TypeScript migration
- PWA capabilities
- Offline support
- WebRTC for video streams
- GraphQL for backend (optional)

## Best Practices

### Code Quality

- Follow Odoo Owl framework patterns
- Use JSDoc comments for documentation
- Implement proper prop validation
- Handle edge cases and errors

### Security

- Validate all user inputs
- Sanitize MQTT messages before display
- Use secure WebSocket connections (wss://)
- Respect Odoo security model

### Accessibility

- Use semantic HTML
- Provide ARIA labels
- Support keyboard navigation
- Ensure color contrast

### Maintainability

- Keep components small and focused
- Document complex logic
- Use meaningful names
- Follow consistent code style

## References

- [Odoo Owl Documentation](https://github.com/odoo/owl)
- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [Odoo 18 Developer Documentation](https://www.odoo.com/documentation/18.0/developer.html)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0)

---

**Document Version**: 1.0 **Last Updated**: 2025-10-09 **Author**: Ricardo Perez
(ric98esley)
