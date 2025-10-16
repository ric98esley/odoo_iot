from odoo import api, fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    mqtt_broker_url = fields.Char(
        string="MQTT Broker URL",
        config_parameter="iot_base.mqtt_broker_url",
        default="ws://localhost:8083/mqtt",
        help="WebSocket URL for the EMQX MQTT broker. "
        "Use 'ws://' for development or 'wss://' for production with SSL.",
    )

    mqtt_broker_host = fields.Char(
        string="MQTT Broker Host",
        config_parameter="iot_base.mqtt_broker_host",
        default="localhost",
        help="Hostname or IP address of the MQTT broker",
    )
    mqtt_broker_port = fields.Integer(
        string="MQTT WebSocket Port",
        config_parameter="iot_base.mqtt_broker_port",
        default=8083,
        help="WebSocket port for MQTT broker (usually 8083 for ws:// or 8084 for wss://)",
    )
    mqtt_use_ssl = fields.Boolean(
        string="Use SSL/TLS",
        config_parameter="iot_base.mqtt_use_ssl",
        default=False,
        help="Use secure WebSocket connection (wss://) instead of ws://",
    )

    @api.onchange("mqtt_broker_host", "mqtt_broker_port", "mqtt_use_ssl")
    def _onchange_mqtt_broker_settings(self):
        """Auto-generate broker URL when host, port or SSL settings change"""
        if self.mqtt_broker_host and self.mqtt_broker_port:
            protocol = "wss" if self.mqtt_use_ssl else "ws"
            self.mqtt_broker_url = (
                f"{protocol}://{self.mqtt_broker_host}:{self.mqtt_broker_port}/mqtt"
            )
