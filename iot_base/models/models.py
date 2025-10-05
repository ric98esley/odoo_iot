# from odoo import models, fields, api


# class iot_base(models.Model):
#     _name = 'iot_base.iot_base'
#     _description = 'iot_base.iot_base'

#     name = fields.Char()
#     value = fields.Integer()
#     value2 = fields.Float(compute="_value_pc", store=True)
#     description = fields.Text()
#
#     @api.depends('value')
#     def _value_pc(self):
#         for record in self:
#             record.value2 = float(record.value) / 100
