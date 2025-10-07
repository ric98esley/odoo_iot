from odoo import fields, models


class IotDevices(models.Model):
    _name = "iot.devices"
    _description = "Iot Devices"

    name = fields.Char()
    password = fields.Char()
    device_type = fields.Many2one("iot.device.type")
    device_uid = fields.Char(
        string="Device UID",
    )
    is_superuser = fields.Boolean(default=False)
    company_id = fields.Many2one("res.company", default=lambda self: self.env.company)
