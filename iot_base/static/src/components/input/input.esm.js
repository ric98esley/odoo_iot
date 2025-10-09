import {Component} from "@odoo/owl";

/**
 * Basic Input Component
 * Reusable text input with validation and events
 */
export class Input extends Component {
  static template = "iot_base.Input";

  static props = {
    value: {type: String, optional: true},
    placeholder: {type: String, optional: true},
    label: {type: String, optional: true},
    type: {type: String, optional: true},
    disabled: {type: Boolean, optional: true},
    required: {type: Boolean, optional: true},
    className: {type: String, optional: true},
    onChange: {type: Function, optional: true},
    onInput: {type: Function, optional: true},
    onEnter: {type: Function, optional: true},
  };

  static defaultProps = {
    value: "",
    placeholder: "",
    type: "text",
    disabled: false,
    required: false,
    className: "",
  };

  /**
   * Handle input change event
   */
  _onChange(ev) {
    if (this.props.onChange) {
      this.props.onChange(ev.target.value);
    }
  }

  /**
   * Handle input event (real-time)
   */
  _onInput(ev) {
    if (this.props.onInput) {
      this.props.onInput(ev.target.value);
    }
  }

  /**
   * Handle Enter key press
   */
  _onKeyPress(ev) {
    if (ev.key === "Enter" && this.props.onEnter) {
      this.props.onEnter(ev.target.value);
    }
  }
}
