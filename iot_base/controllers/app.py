from odoo.http import Controller, request, route


class IotAppController(Controller):
    @route("/iot/app", auth="user")
    def app(self):
        return request.render(
            "iot_base.app",
            {
                "session_info": request.env["ir.http"].get_frontend_session_info(),
            },
        )
