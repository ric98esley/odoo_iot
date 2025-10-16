/**
 * MQTT Message Model
 * Represents the structure of data received from MQTT topics
 */
export class MQTTMessage {
  /**
   * Create a new MQTT Message
   * @param {Object} data - Raw message data
   * @param {String} data.userId - User ID
   * @param {String} data.dId - Device ID
   * @param {String} data.variable - Variable name
   * @param {Number} data.value - Variable value
   * @param {Number} data.time - Timestamp
   */
  constructor(data) {
    this.validate(data);

    this.userId = data.userId;
    this.dId = data.dId;
    this.variable = data.variable;
    this.value = data.value;
    this.time = data.time;
  }

  /**
   * Validate message data
   * @param {Object} data - Data to validate
   * @throws {Error} If validation fails
   */
  validate(data) {
    if (!data) {
      throw new Error("Message data is required");
    }

    const required = ["dId", "variable", "value"];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`Field '${field}' is required`);
      }
    }

    if (data.userId && typeof data.userId !== "string") {
      throw new Error("userId must be a string");
    }

    if (typeof data.dId !== "string") {
      throw new Error("dId must be a string");
    }

    if (typeof data.variable !== "string") {
      throw new Error("variable must be a string");
    }

    if (typeof data.value !== "number") {
      throw new Error("value must be a number");
    }

    if (data.time && typeof data.time !== "number") {
      throw new Error("time must be a number");
    }
  }

  /**
   * Parse MQTT message from JSON string
   * @param {String} messageStr - JSON string message
   * @returns {MQTTMessage} Parsed message object
   * @throws {Error} If parsing or validation fails
   */
  static fromString(messageStr) {
    try {
      const data = JSON.parse(messageStr);
      return new MQTTMessage(data);
    } catch (error) {
      throw new Error(`Failed to parse MQTT message: ${error.message}`);
    }
  }

  /**
   * Convert message to JSON string
   * @returns {String} JSON string representation
   */
  toString() {
    return JSON.stringify({
      userId: this.userId,
      dId: this.dId,
      variable: this.variable,
      value: this.value,
      time: this.time,
    });
  }

  /**
   * Get formatted timestamp
   * @returns {String} Formatted date/time string
   */
  getFormattedTime() {
    return this.time ? new Date(this.time).toLocaleString() : null;
  }

  /**
   * Check if value represents "on" state (non-zero)
   * @returns {Boolean} True if value is truthy/non-zero
   */
  isOn() {
    return this.value !== 0;
  }

  /**
   * Get a plain object representation
   * @returns {Object} Plain object with all properties
   */
  toObject() {
    return {
      userId: this.userId,
      dId: this.dId,
      variable: this.variable,
      value: this.value,
      time: this.time,
    };
  }
}
