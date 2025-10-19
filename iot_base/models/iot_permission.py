from odoo import fields, models


class IotPermission(models.Model):
    _name = "iot.permission"
    _description = "IoT Topic Permissions for EMQX Authorization"

    iot_credential_id = fields.Many2one(
        "iot.credentials",
        string="IoT Credential",
        required=True,
        ondelete="cascade",
        index=True,
    )
    iot_device_id = fields.Many2one(
        "iot.devices",
        related="iot_credential_id.device_id",
        store=True,
    )
    username = fields.Char(
        related="iot_credential_id.name",
        store=True,
    )

    topic = fields.Char(
        required=True,
        help="MQTT topic pattern (supports wildcards: + for single level,"
        " # for multi-level). Example: sensors/+/temp",
    )

    action = fields.Selection(
        [("subscribe", "Subscribe"), ("publish", "Publish"), ("all", "All")],
        required=True,
        default="all",
        help="Type of action allowed on this topic",
    )

    active = fields.Boolean(default=True)

    _sql_constraints = [
        (
            "unique_credential_topic_action",
            "UNIQUE(iot_credential_id, topic, action)",
            "A credential cannot have duplicate permissions"
            "for the same topic and action",
        ),
    ]
