import {Component} from "@odoo/owl";

/**
 * Basic Button Component
 * Reusable button with different variants and states
 */
export class Button extends Component {
  static template = "iot_base.Button";

  static props = {
    label: {type: String, optional: true},
    variant: {type: String, optional: true},
    size: {type: String, optional: true},
    disabled: {type: Boolean, optional: true},
    loading: {type: Boolean, optional: true},
    icon: {type: String, optional: true},
    className: {type: String, optional: true},
    onClick: {type: Function, optional: true},
    slots: {type: Object, optional: true},
  };

  static defaultProps = {
    variant: "primary",
    size: "md",
    disabled: false,
    loading: false,
    className: "",
  };

  /**
   * Handle button click
   */
  _onClick(ev) {
    if (!this.props.disabled && !this.props.loading && this.props.onClick) {
      this.props.onClick(ev);
    }
  }

  /**
   * Get button CSS classes
   */
  get buttonClasses() {
    const classes = ["btn", `btn-${this.props.variant}`];

    if (this.props.size === "sm") {
      classes.push("btn-sm");
    } else if (this.props.size === "lg") {
      classes.push("btn-lg");
    }

    if (this.props.className) {
      classes.push(this.props.className);
    }

    return classes.join(" ");
  }
}
