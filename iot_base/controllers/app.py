from odoo.http import Controller, request, route


class IotAppController(Controller):
    @route("/iot/app", auth="user")
    def app(self):
        # Get or create IoT credentials for the current user
        user = request.env.user
        iot_credentials = user.get_or_create_iot_credentials()

        # MQTT Broker configuration (hardcoded for now)
        mqtt_config = {
            "broker_url": "ws://localhost:8083/mqtt",  # WebSocket URL for EMQX
            "credentials": iot_credentials,
        }

        return request.render(
            "iot_base.app",
            {
                "session_info": request.env["ir.http"].get_frontend_session_info(),
                "mqtt_config": mqtt_config,
            },
        )
