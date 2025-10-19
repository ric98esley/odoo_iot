import secrets
import string
import uuid

from odoo import api, fields, models


class IotDevices(models.Model):
    _name = "iot.devices"
    _description = "Iot Devices"

    name = fields.Char(string="Device Name", required=True)
    device_type = fields.Many2one("iot.device.type")
    device_uid = fields.Char(
        string="Device UID", default=lambda self: self._generate_device_uid()
    )

    # Credentials for EMQX authentication
    credential_ids = fields.One2many(
        "iot.credentials",
        "device_id",
        string="EMQX Credentials",
    )

    # Topic permissions via related field
    permission_ids = fields.One2many(
        "iot.permission",
        "iot_device_id",
        string="Topic Permissions",
        help="MQTT topic permissions for this device. "
        "Automatically created on device creation.",
    )

    company_id = fields.Many2one("res.company", default=lambda self: self.env.company)

    @api.model_create_multi
    def create(self, vals_list):
        """Override create to automatically generate
        credentials with company permissions and topic permissions"""
        devices = super().create(vals_list)

        # Create credentials for each new device
        for device in devices:
            if not device.credential_ids:
                device._create_device_credentials()

        return devices

    def _generate_iot_password(self):
        """Generate a secure random password for IoT credentials"""
        alphabet = string.ascii_letters + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(16))

    def _generate_device_uid(self):
        """Generate a unique device UID for the device"""
        return "dev_" + str(uuid.uuid4())[:10]

    def _create_device_credentials(self):
        """
        Create MQTT credentials for the device with company-scoped permissions
        """
        self.ensure_one()

        # Generate username based on device name and UID
        device_name_clean = self.name.replace(" ", "_").replace(".", "_").lower()
        username = f"device_{device_name_clean}_{self.device_uid}"

        # Make username unique if needed
        counter = 1
        original_username = username
        while self.env["iot.credentials"].search([("name", "=", username)], limit=1):
            username = f"{original_username}_{counter}"
            counter += 1

        password = self._generate_iot_password()

        # Create credential
        credential = self.env["iot.credentials"].create(
            {
                "name": username,
                "password": password,
                "resource_type": "device",
                "device_id": self.id,
                "is_superuser": False,
                "company_id": self.company_id.id,
            }
        )

        # Create default permissions for company topics
        self._create_default_company_permissions(credential)

        return credential

    def _create_default_company_permissions(self, credential):
        """
        Create default MQTT permissions for device with specific topic patterns

        Devices get access to:
        - Publish: {company_id}/{device_uid}/+/sdata (sensor data)
        - Subscribe: {company_id}/{device_uid}/+/acdata (action/command data)

        Topic structure:
        - company_id: Isolates data by company
        - device_id: Isolates data by device
        - +: Wildcard for variable level (e.g., sensor type, location)
        - sdata: Sensor data (device publishes)
        - acdata: Action/Command data (device subscribes)

        Examples:
        - Publish: 1/5/temperature/sdata
        - Subscribe: 1/5/turn_on/acdata

        Args:
            credential: iot.credentials record
        """
        self.ensure_one()

        # Get device's company ID and device ID
        company_id = self.company_id.id
        device_id = self.device_uid

        # Topic patterns for device-specific communication
        # Publish: Device sends sensor data
        publish_topic = f"{company_id}/{device_id}/+/sdata"

        # Subscribe: Device receives commands/actions
        subscribe_topic = f"{company_id}/{device_id}/+/acdata"

        # Create permissions
        permissions_data = [
            {
                "iot_credential_id": credential.id,
                "topic": subscribe_topic,
                "action": "subscribe",
                "active": True,
            },
            {
                "iot_credential_id": credential.id,
                "topic": publish_topic,
                "action": "publish",
                "active": True,
            },
        ]

        # Create permissions
        for perm_data in permissions_data:
            # Check if permission already exists
            existing = self.env["iot.permission"].search(
                [
                    ("iot_credential_id", "=", credential.id),
                    ("topic", "=", perm_data["topic"]),
                    ("action", "=", perm_data["action"]),
                ],
                limit=1,
            )

            if not existing:
                self.env["iot.permission"].create(perm_data)

    def action_regenerate_credentials(self):
        """
        Action to regenerate credentials for the device
        Useful if credentials are compromised
        """
        self.ensure_one()

        # Archive old credentials
        self.credential_ids.write({"active": False})

        # Create new credentials
        self._create_device_credentials()

        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": "Credentials Regenerated",
                "message": f"New credentials created for device {self.name}",
                "type": "success",
                "sticky": False,
            },
        }
