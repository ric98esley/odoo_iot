/** @odoo-module **/

import {Component, onWillDestroy, useState} from "@odoo/owl";
import {Card} from "../../components/card/card.esm";
import {mqttService} from "../../services/mqtt_service.esm";
import {MQTTMessage} from "../../models/mqtt_message.esm";

/**
 * Event Indicator Widget
 * Displays a hexagon icon that turns on/off based on MQTT variable data
 */
export class EventIndicator extends Component {
  static template = "iot_base.EventIndicator";

  static components = {
    Card,
  };

  static props = {
    title: {type: String, optional: true},
    width: {type: String, optional: true},
    variable: {type: String, optional: true},
    className: {type: String, optional: true},
  };

  static defaultProps = {
    title: "Event Indicator",
    width: "300px",
    variable: "",
    className: "",
  };

  setup() {
    this.mqttService = mqttService;

    this.state = useState({
      topic: "",
      subscribedTopic: null,
      isOn: false,
      lastMessage: null,
      error: null,
      isSubscribing: false,
    });

    // Callback reference for unsubscribing
    this.messageCallback = null;

    // Cleanup on component destroy
    onWillDestroy(() => {
      this._cleanup();
    });
  }

  /**
   * Handle topic input change
   */
  onTopicChange(ev) {
    this.state.topic = ev.target.value;
    this.state.error = null;
  }

  /**
   * Handle subscribe button click
   */
  async onSubscribe() {
    const topic = this.state.topic.trim();

    if (!topic) {
      this.state.error = "Please enter a topic";
      return;
    }

    this.state.isSubscribing = true;
    this.state.error = null;

    try {
      // Ensure MQTT is connected
      if (!this.mqttService.state.connected) {
        throw new Error("MQTT not connected. Please connect first.");
      }

      // Unsubscribe from previous topic if exists
      if (this.state.subscribedTopic) {
        await this._unsubscribe();
      }

      // Subscribe to new topic
      this.messageCallback = (message, receivedTopic) => {
        this._onMessage(message, receivedTopic);
      };

      await this.mqttService.subscribe(topic, this.messageCallback);

      this.state.subscribedTopic = topic;
      this.state.error = null;
    } catch (error) {
      console.error("Subscription error:", error);
      this.state.error = error.message || "Failed to subscribe to topic";
    } finally {
      this.state.isSubscribing = false;
    }
  }

  /**
   * Handle unsubscribe button click
   */
  async onUnsubscribe() {
    await this._unsubscribe();
  }

  /**
   * Handle incoming MQTT message
   * @private
   */
  _onMessage(messageStr, topic) {
    try {
      // Parse message using the model
      const message = MQTTMessage.fromString(messageStr);

      console.log(message, topic);

      // Only process if it matches our variable (if specified)
      if (this.props.variable && message.variable !== this.props.variable) {
        return;
      }

      // Update state
      this.state.isOn = message.isOn();
      this.state.lastMessage = message.toObject();
      this.state.error = null;
    } catch (error) {
      console.error("Failed to parse message:", error);
      this.state.error = `Invalid message format: ${error.message}`;
    }
  }

  /**
   * Unsubscribe from current topic
   * @private
   */
  async _unsubscribe() {
    if (this.state.subscribedTopic && this.messageCallback) {
      this.mqttService.unsubscribe(this.state.subscribedTopic, this.messageCallback);
      this.state.subscribedTopic = null;
      this.state.isOn = false;
      this.state.lastMessage = null;
      this.messageCallback = null;
    }
  }

  /**
   * Cleanup subscriptions
   * @private
   */
  _cleanup() {
    if (this.state.subscribedTopic && this.messageCallback) {
      this.mqttService.unsubscribe(this.state.subscribedTopic, this.messageCallback);
    }
  }

  /**
   * Check if currently subscribed
   */
  get isSubscribed() {
    return this.state.subscribedTopic !== null;
  }

  /**
   * Get icon color based on state
   */
  get iconColor() {
    return this.state.isOn ? "#FFD700" : "#CCCCCC";
  }

  /**
   * Get status text
   */
  get statusText() {
    if (!this.isSubscribed) {
      return "Not subscribed";
    }
    return this.state.isOn ? "ON" : "OFF";
  }

  /**
   * Get status badge class
   */
  get statusBadgeClass() {
    if (!this.isSubscribed) {
      return "bg-secondary";
    }
    return this.state.isOn ? "bg-success" : "bg-dark";
  }

  /**
   * Get formatted last update time
   */
  get lastUpdateTime() {
    if (!this.state.lastMessage) {
      return "Never";
    }
    return new Date(this.state.lastMessage.time).toLocaleTimeString();
  }
}
