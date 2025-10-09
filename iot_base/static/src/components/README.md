# IoT Base Components

This directory contains basic, reusable UI components used throughout the IoT dashboard.

## Available Components

### Input Component

**Location**: `components/input/`

A flexible text input component with validation and event handling.

#### Features

- Multiple input types (text, password, email, number, etc.)
- Label support with required indicator
- Placeholder text
- Disabled state
- Real-time value changes
- Enter key handling
- Custom CSS classes

#### Usage

```javascript
import { Input } from "./components/input/input";

// In your component
static components = {
    Input,
};
```

```xml
<Input
  label="'Topic Name'"
  value="state.topic"
  placeholder="'sensors/temperature'"
  onChange.bind="onTopicChange"
  onEnter.bind="onSubmit"
  required="true"
/>
```

#### Props

| Prop          | Type     | Default | Description                              |
| ------------- | -------- | ------- | ---------------------------------------- |
| `value`       | String   | ""      | Input value                              |
| `placeholder` | String   | ""      | Placeholder text                         |
| `label`       | String   | -       | Label text (optional)                    |
| `type`        | String   | "text"  | Input type (text, password, email, etc.) |
| `disabled`    | Boolean  | false   | Disable input                            |
| `required`    | Boolean  | false   | Show required indicator                  |
| `className`   | String   | ""      | Additional CSS classes                   |
| `onChange`    | Function | -       | Called when value changes                |
| `onInput`     | Function | -       | Called on every keystroke                |
| `onEnter`     | Function | -       | Called when Enter key is pressed         |

#### Events

- **onChange(value)**: Fired when the input value changes (on blur or Enter)
- **onInput(value)**: Fired on every keystroke
- **onEnter(value)**: Fired when Enter key is pressed

---

### Button Component

**Location**: `components/button/`

A versatile button component with multiple variants and states.

#### Features

- Multiple variants (primary, secondary, success, danger, etc.)
- Size options (small, medium, large)
- Loading state with spinner
- Icon support
- Disabled state
- Slot support for custom content

#### Usage

```javascript
import { Button } from "./components/button/button";

// In your component
static components = {
    Button,
};
```

```xml
<!-- Simple button -->
<Button
    label="'Subscribe'"
    variant="'primary'"
    onClick.bind="onSubscribe"
/>

<!-- Button with icon -->
<Button
    label="'Connect'"
    variant="'success'"
    icon="'fa-plug'"
    onClick.bind="onConnect"
/>

<!-- Loading button -->
<Button
    label="'Loading...'"
    loading="state.isLoading"
    disabled="true"
/>

<!-- Button with slot -->
<Button variant="'primary'" onClick.bind="onSave">
    <i class="fa fa-save"/> Save Changes
</Button>
```

#### Props

| Prop        | Type     | Default   | Description                                                                         |
| ----------- | -------- | --------- | ----------------------------------------------------------------------------------- |
| `label`     | String   | -         | Button text                                                                         |
| `variant`   | String   | "primary" | Bootstrap variant (primary, secondary, success, danger, warning, info, light, dark) |
| `size`      | String   | "md"      | Button size (sm, md, lg)                                                            |
| `disabled`  | Boolean  | false     | Disable button                                                                      |
| `loading`   | Boolean  | false     | Show loading spinner                                                                |
| `icon`      | String   | -         | FontAwesome icon class (e.g., "fa-play")                                            |
| `className` | String   | ""        | Additional CSS classes                                                              |
| `onClick`   | Function | -         | Click handler                                                                       |

#### Events

- **onClick(event)**: Fired when button is clicked (if not disabled or loading)

---

## Creating New Components

To create a new basic component:

1. Create a new directory in `components/` with your component name
2. Create the following files:

   - `component_name.js` - Component logic
   - `component_name.xml` - Component template
   - `component_name.scss` - Component styles (optional)

3. Follow this structure:

```javascript
/** @odoo-module **/

import {Component} from "@odoo/owl";

export class MyComponent extends Component {
  static template = "iot_base.MyComponent";

  static props = {
    value: {type: String, optional: true},
    onChange: {type: Function, optional: true},
  };

  static defaultProps = {
    value: "",
  };

  _onChange(ev) {
    if (this.props.onChange) {
      this.props.onChange(ev.target.value);
    }
  }
}
```

4. Template example:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<templates xml:space="preserve">
    <t t-name="iot_base.MyComponent">
    <div class="my-component">
      <!-- Component content -->
    </div>
  </t>
</templates>
```

## Component Guidelines

### Design Principles

1. **Single Responsibility**: Each component should do one thing well
2. **Reusability**: Components should be generic and reusable
3. **Props-Driven**: Behavior should be controlled through props
4. **Event Emission**: Use events for parent communication
5. **Minimal State**: Keep internal state to a minimum
6. **Composition**: Build complex UIs by composing simple components

### Props Best Practices

- Always define prop types with validation
- Provide default values where appropriate
- Mark optional props explicitly
- Document all props in code comments

### Events Best Practices

- Use descriptive event names
- Pass relevant data in event details
- Don't modify parent state directly
- Use `.bind` for method references in templates

### Styling Best Practices

- Use Bootstrap classes for common patterns
- Create custom SCSS only when needed
- Scope styles to component root class
- Use CSS variables for theming

### Accessibility

- Use semantic HTML elements
- Provide proper labels for form elements
- Support keyboard navigation
- Include ARIA attributes when needed
- Ensure proper color contrast

## Future Components

Planned components for future releases:

- **Toggle**: Switch component for boolean values
- **Select**: Dropdown selection component
- **Checkbox**: Checkbox component with label
- **Radio**: Radio button group component
- **Textarea**: Multi-line text input
- **DatePicker**: Date selection component
- **ColorPicker**: Color selection component
- **Slider**: Range slider component
- **Badge**: Status badge component
- **Card**: Card container component
- **Modal**: Modal dialog component
- **Tooltip**: Tooltip component

## Contributing

When creating new components:

1. Follow Odoo Owl best practices
2. Keep components simple and focused
3. Document all props and events
4. Include usage examples
5. Add proper prop validation
6. Test with various scenarios
7. Update this README

## References

- [Odoo Owl Components Guide](https://github.com/odoo/owl#components)
- [Bootstrap 5 Components](https://getbootstrap.com/docs/5.0/components/)
- [Frontend Architecture](../../docs/frontend.md)
