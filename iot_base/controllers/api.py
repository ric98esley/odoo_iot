from odoo.http import Controller, request, route


class IotDevicesController(Controller):
    @route("/iot/auth/<token>", auth="none", type="http", methods=["POST"], csrf=False)
    def auth_device(self, **kwargs):
        token = kwargs.get("token")
        if not token:
            return request.make_json_response(
                {
                    "result": "ignore",
                    "error": "Token is required",
                },
                status=403,
            )

        data = request.get_json_data()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return request.make_json_response(
                {
                    "error": "Username and password are required",
                },
                status=400,
            )

        device = (
            request.env["iot.devices"]
            .sudo()
            .search([("name", "=", username), ("password", "=", password)])
        )
        if not device:
            return request.make_json_response(
                {
                    "result": "deny",
                },
                status=403,
            )

        return request.make_json_response(
            {
                "result": "allow",
                "is_superuser": device.is_superuser,
            }
        )

    @route("/iot/devices", auth="user")
    def devices(self):
        return request.make_json_response(
            {
                "devices": request.env["iot.devices"].search([]).to_json(),
            }
        )
