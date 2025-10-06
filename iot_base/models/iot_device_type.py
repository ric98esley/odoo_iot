from odoo import fields, models


class IotDeviceType(models.Model):
    _name = "iot.device.type"
    _description = "Iot Device Type"

    name = fields.Char()
    description = fields.Text()
    company_id = fields.Many2one("res.company")
