/** @odoo-module **/

import {Component, onWillDestroy, useState} from "@odoo/owl";
import {Input} from "../../components/input/input";
import {Button} from "../../components/button/button";
import {mqttService} from "../../services/mqtt_service";

/**
 * MQTT Subscriber Widget
 * Allows subscribing to MQTT topics and viewing received messages
 */
export class MQTTSubscriber extends Component {
  static template = "iot_base.MQTTSubscriber";

  static components = {
    Input,
    Button,
  };

  static props = {
    title: {type: String, optional: true},
    maxMessages: {type: Number, optional: true},
    className: {type: String, optional: true},
  };

  static defaultProps = {
    title: "MQTT Subscriber",
    maxMessages: 50,
    className: "",
  };

  setup() {
    this.mqttService = mqttService;

    this.state = useState({
      topic: "",
      subscribedTopic: null,
      messages: [],
      brokerUrl: "ws://localhost:8883",
      username: "",
      password: "",
      isSubscribing: false,
      error: null,
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
  onTopicChange(value) {
    this.state.topic = value;
    this.state.error = null;
  }

  /**
   * Handle broker URL input change
   */
  onBrokerUrlChange(value) {
    this.state.brokerUrl = value;
    this.state.error = null;
  }

  /**
   * Handle username input change
   */
  onUsernameChange(value) {
    this.state.username = value;
    this.state.error = null;
  }

  /**
   * Handle password input change
   */
  onPasswordChange(value) {
    this.state.password = value;
    this.state.error = null;
  }

  /**
   * Handle subscribe button click or Enter key
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
      // Connect to broker if not connected
      if (!this.mqttService.state.connected) {
        await this._connectToBroker();
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
      this.state.messages = [];
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
   * Clear message history
   */
  onClearMessages() {
    this.state.messages = [];
  }

  /**
   * Connect to MQTT broker
   * @private
   */
  async _connectToBroker() {
    const brokerUrl = this.state.brokerUrl.trim();

    console.log("brokerUrl", brokerUrl);

    if (!brokerUrl) {
      throw new Error("Please enter a broker URL");
    }

    const connectOptions = {
      url: brokerUrl,
    };

    // Add credentials if provided
    if (this.state.username) {
      connectOptions.username = this.state.username.trim();
    }
    if (this.state.password) {
      connectOptions.password = this.state.password;
    }

    await this.mqttService.connect(connectOptions);
  }

  /**
   * Unsubscribe from current topic
   * @private
   */
  async _unsubscribe() {
    if (this.state.subscribedTopic && this.messageCallback) {
      this.mqttService.unsubscribe(this.state.subscribedTopic, this.messageCallback);
      this.state.subscribedTopic = null;
      this.messageCallback = null;
    }
  }

  /**
   * Handle incoming MQTT message
   * @private
   */
  _onMessage(message, topic) {
    const messageObj = {
      topic,
      message,
      timestamp: new Date().toLocaleTimeString(),
      id: Math.random().toString(36).substr(2, 9),
    };

    // Add message to the beginning of the array
    this.state.messages.unshift(messageObj);

    // Limit message history
    if (this.state.messages.length > this.props.maxMessages) {
      this.state.messages.pop();
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
   * Get connection status
   */
  get connectionStatus() {
    if (this.mqttService.state.connecting) {
      return "Connecting...";
    }
    if (this.mqttService.state.connected) {
      return "Connected";
    }
    return "Disconnected";
  }

  /**
   * Get connection status badge class
   */
  get statusBadgeClass() {
    if (this.mqttService.state.connecting) {
      return "bg-warning";
    }
    if (this.mqttService.state.connected) {
      return "bg-success";
    }
    return "bg-secondary";
  }

  /**
   * Check if currently subscribed
   */
  get isSubscribed() {
    return this.state.subscribedTopic !== null;
  }

  /**
   * Format message for display (try to parse JSON)
   */
  formatMessage(message) {
    try {
      const parsed = JSON.parse(message);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return message;
    }
  }
}
