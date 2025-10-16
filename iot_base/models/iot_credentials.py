from odoo import _, api, fields, models


class IotCredentials(models.Model):
    _name = "iot.credentials"
    _description = "IoT Credentials for EMQX Authentication"

    name = fields.Char(string="Username", required=True, index=True)
    password = fields.Char(required=True)
    is_superuser = fields.Boolean(default=False)

    # Reference to either user or device
    resource_type = fields.Selection(
        [("user", "User"), ("device", "Device")],
        required=True,
        index=True,
    )
    user_id = fields.Many2one(
        "res.users",
        string="User",
        ondelete="cascade",
    )
    device_id = fields.Many2one(
        "iot.devices",
        string="Device",
        ondelete="cascade",
    )

    company_id = fields.Many2one(
        "res.company",
        string="Company",
        default=lambda self: self.env.company,
    )

    @api.constrains("resource_type", "user_id", "device_id")
    def _check_resource_consistency(self):
        for record in self:
            if record.resource_type == "user" and not record.user_id:
                raise models.ValidationError(
                    _("User must be set when resource type is 'User'")
                )
            if record.resource_type == "device" and not record.device_id:
                raise models.ValidationError(
                    _("Device must be set when resource type is 'Device'")
                )

    @api.onchange("user_id")
    def _onchange_user_id(self):
        if self.user_id and not self.resource_type:
            self.resource_type = "user"

    @api.onchange("device_id")
    def _onchange_device_id(self):
        if self.device_id and not self.resource_type:
            self.resource_type = "device"

    _sql_constraints = [
        ("name_unique", "UNIQUE(name)", "Username must be unique!"),
    ]
