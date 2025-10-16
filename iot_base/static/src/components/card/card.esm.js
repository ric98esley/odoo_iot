/** @odoo-module **/

import {Component} from "@odoo/owl";

/**
 * Card Component
 * Reusable card container with configurable width and styling
 */
export class Card extends Component {
  static template = "iot_base.Card";

  static props = {
    title: {type: String, optional: true},
    width: {type: String, optional: true},
    className: {type: String, optional: true},
    headerClass: {type: String, optional: true},
    bodyClass: {type: String, optional: true},
    slots: {type: Object, optional: true},
  };

  static defaultProps = {
    width: "auto",
    className: "",
    headerClass: "",
    bodyClass: "",
  };

  /**
   * Get card style with width
   */
  get cardStyle() {
    return this.props.width !== "auto" ? `width: ${this.props.width}` : "";
  }

  /**
   * Get card CSS classes
   */
  get cardClasses() {
    const classes = ["card", "shadow-sm"];

    if (this.props.className) {
      classes.push(this.props.className);
    }

    return classes.join(" ");
  }

  /**
   * Get header CSS classes
   */
  get headerClasses() {
    const classes = ["card-header"];

    if (this.props.headerClass) {
      classes.push(this.props.headerClass);
    } else {
      classes.push("bg-light");
    }

    return classes.join(" ");
  }

  /**
   * Get body CSS classes
   */
  get bodyClasses() {
    const classes = ["card-body"];

    if (this.props.bodyClass) {
      classes.push(this.props.bodyClass);
    }

    return classes.join(" ");
  }
}
