import secrets
import string

from odoo import fields, models


class ResUser(models.Model):
    _inherit = "res.users"

    # Credentials for EMQX authentication
    iot_credential_ids = fields.One2many(
        "iot.credentials",
        "user_id",
        string="IoT EMQX Credentials",
    )

    def _generate_iot_password(self):
        """Generate a secure random password for IoT credentials"""
        alphabet = string.ascii_letters + string.digits
        return "".join(secrets.choice(alphabet) for _ in range(16))

    def get_or_create_iot_credentials(self):
        """
        Get existing IoT credentials or create new ones for the user
        Returns a dict with username and password for MQTT connection
        """
        self.ensure_one()

        # Check if user already has credentials
        credential = self.iot_credential_ids[:1]

        if not credential:
            # Generate username based on user login
            username = f"user_{self.login.replace('@', '_').replace('.', '_')}"
            password = self._generate_iot_password()

            # Create new credential
            credential = self.env["iot.credentials"].create(
                {
                    "name": username,
                    "password": password,
                    "resource_type": "user",
                    "user_id": self.id,
                    "is_superuser": False,
                    "company_id": self.company_id.id,
                }
            )

        return {
            "username": credential.name,
            "password": credential.password,
            "is_superuser": credential.is_superuser,
        }
