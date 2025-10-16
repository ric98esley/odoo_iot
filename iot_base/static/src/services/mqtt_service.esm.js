/* global mqtt */
import {reactive} from "@odoo/owl";

/**
 * MQTT Service
 * Handles MQTT connections, subscriptions, and message routing
 */
export class MQTTService {
  constructor() {
    this.client = null;
    this.state = reactive({
      connected: false,
      connecting: false,
      error: null,
      subscriptions: new Map(), // Topic -> Set of callback functions
      messages: [], // Store recent messages
      maxMessages: 100, // Maximum messages to keep in history
    });
  }

  /**
   * Connect to MQTT broker using Odoo's configuration
   * Automatically uses credentials from the backend
   * @returns {Promise<void>}
   */
  async connectWithOdooConfig() {
    // Get MQTT config from Odoo global object
    const mqttConfig = window.odoo?.mqtt_config;

    if (!mqttConfig) {
      throw new Error("MQTT configuration not found in Odoo context");
    }

    const {broker_url, credentials} = mqttConfig;

    return this.connect({
      url: broker_url,
      username: credentials.username,
      password: credentials.password,
      clientId: `odoo_user_${credentials.username}`,
    });
  }

  /**
   * Connect to MQTT broker
   * @param {Object} options - Connection options
   * @param {String} options.url - Broker URL (e.g., 'ws://localhost:8883')
   * @param {String} options.clientId - Client ID
   * @param {String} options.username - Username (optional)
   * @param {String} options.password - Password (optional)
   * @returns {Promise<void>}
   */
  async connect(options) {
    if (this.client && this.state.connected) {
      console.warn("MQTT client already connected");
      return;
    }

    this.state.connecting = true;
    this.state.error = null;

    try {
      // Create MQTT client using mqtt.js (loaded from CDN in template)
      const clientId =
        options.clientId || `odoo_iot_${Math.random().toString(16).slice(2, 8)}`;

      const connectOptions = {
        clientId,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
      };

      if (options.username) {
        connectOptions.username = options.username;
      }
      if (options.password) {
        connectOptions.password = options.password;
      }

      // Use the global mqtt object from mqtt.min.js
      this.client = mqtt.connect(options.url, connectOptions);

      // Set up event handlers
      return new Promise((resolve, reject) => {
        this.client.on("connect", () => {
          console.log("MQTT Connected");
          this.state.connected = true;
          this.state.connecting = false;
          this.state.error = null;
          resolve();
        });

        this.client.on("error", (error) => {
          console.error("MQTT Error:", error);
          this.state.error = error.message || "Connection error";
          this.state.connecting = false;
          reject(error);
        });

        this.client.on("close", () => {
          console.log("MQTT Disconnected");
          this.state.connected = false;
          this.state.connecting = false;
        });

        this.client.on("message", (topic, message) => {
          this._handleMessage(topic, message);
        });

        this.client.on("reconnect", () => {
          console.log("MQTT Reconnecting...");
          this.state.connecting = true;
        });
      });
    } catch (error) {
      console.error("Failed to connect to MQTT broker:", error);
      this.state.error = error.message;
      this.state.connecting = false;
      throw error;
    }
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.state.connected = false;
      this.state.subscriptions.clear();
    }
  }

  /**
   * Subscribe to a topic
   * @param {String} topic - MQTT topic to subscribe to
   * @param {Function} callback - Callback function to handle messages
   * @returns {Promise<void>}
   */
  async subscribe(topic, callback) {
    if (!this.client || !this.state.connected) {
      throw new Error("MQTT client not connected");
    }

    return new Promise((resolve, reject) => {
      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error(`Failed to subscribe to ${topic}:`, error);
          reject(error);
          return;
        }

        console.log(`Subscribed to topic: ${topic}`);

        // Store callback for this topic
        if (!this.state.subscriptions.has(topic)) {
          this.state.subscriptions.set(topic, new Set());
        }
        this.state.subscriptions.get(topic).add(callback);

        resolve();
      });
    });
  }

  /**
   * Unsubscribe from a topic
   * @param {String} topic - MQTT topic to unsubscribe from
   * @param {Function} callback - Specific callback to remove (optional)
   */
  unsubscribe(topic, callback = null) {
    if (!this.client) {
      return;
    }

    if (callback) {
      // Remove specific callback
      const callbacks = this.state.subscriptions.get(topic);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.state.subscriptions.delete(topic);
          this.client.unsubscribe(topic);
          console.log(`Unsubscribed from topic: ${topic}`);
        }
      }
    } else {
      // Remove all callbacks for this topic
      this.state.subscriptions.delete(topic);
      this.client.unsubscribe(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    }
  }

  /**
   * Publish a message to a topic
   * @param {String} topic - MQTT topic to publish to
   * @param {string|Object} message - Message to publish
   * @param {Object} options - Publish options (qos, retain, etc.)
   */
  publish(topic, message, options = {}) {
    if (!this.client || !this.state.connected) {
      throw new Error("MQTT client not connected");
    }

    const payload = typeof message === "string" ? message : JSON.stringify(message);

    this.client.publish(topic, payload, options, (error) => {
      if (error) {
        console.error(`Failed to publish to ${topic}:`, error);
      } else {
        console.log(`Published to ${topic}:`, payload);
      }
    });
  }

  /**
   * Handle incoming messages
   * @private
   */
  _handleMessage(topic, messageBuffer) {
    const messageStr = messageBuffer.toString();

    // Store message in history
    const messageObj = {
      topic,
      message: messageStr,
      timestamp: new Date(),
    };

    this.state.messages.unshift(messageObj);

    // Limit message history
    if (this.state.messages.length > this.state.maxMessages) {
      this.state.messages.pop();
    }

    // Call all callbacks subscribed to this topic
    const callbacks = this.state.subscriptions.get(topic);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(messageStr, topic);
        } catch (error) {
          console.error(`Error in message callback for ${topic}:`, error);
        }
      });
    }
  }

  /**
   * Get message history
   * @param {String} topic - Optional topic filter
   * @returns {Array} Array of message objects
   */
  getMessages(topic = null) {
    if (topic) {
      return this.state.messages.filter((msg) => msg.topic === topic);
    }
    return [...this.state.messages];
  }

  /**
   * Clear message history
   * @param {String} topic - Optional topic to clear (clears all if not specified)
   */
  clearMessages(topic = null) {
    if (topic) {
      this.state.messages = this.state.messages.filter((msg) => msg.topic !== topic);
    } else {
      this.state.messages = [];
    }
  }
}

// Create singleton instance
export const mqttService = new MQTTService();
