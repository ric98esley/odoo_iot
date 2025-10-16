from odoo import fields, models


class IotDevices(models.Model):
    _name = "iot.devices"
    _description = "Iot Devices"

    name = fields.Char(string="Device Name", required=True)
    device_type = fields.Many2one("iot.device.type")
    device_uid = fields.Char(string="Device UID")

    # Credentials for EMQX authentication
    credential_ids = fields.One2many(
        "iot.credentials",
        "device_id",
        string="EMQX Credentials",
    )

    company_id = fields.Many2one("res.company", default=lambda self: self.env.company)
