import {Component} from "@odoo/owl";
import {MQTTSubscriber} from "./widgets/mqtt_subscriber/mqtt_subscriber";

export class Root extends Component {
  static template = "iot_base.Root";
  static props = {};

  static components = {
    MQTTSubscriber,
  };
}
