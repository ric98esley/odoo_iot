from odoo.http import Controller, request, route


class IotDevicesController(Controller):
    @route("/iot/devices", auth="user")
    def devices(self):
        return request.render(
            "iot_base.devices",
            {
                "devices": request.env["iot.device"].search([]),
            },
        )
