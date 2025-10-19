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
        Also creates default permissions for company-scoped topics
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

        # Create default permissions for company topics
        self._create_default_company_permissions(credential)

        return {
            "username": credential.name,
            "password": credential.password,
            "is_superuser": credential.is_superuser,
        }

    def _create_default_company_permissions(self, credential):
        """
        Create default MQTT permissions for user to access company-scoped topics

        Users get access to topics starting with their company ID:
        - Subscribe: company_id/#
        - Publish: company_id/#

        Args:
            credential: iot.credentials record
        """
        self.ensure_one()

        # Get user's company ID
        company_id = self.company_id.id

        # Topic pattern for company namespace
        company_topic = f"{company_id}/#"

        # Create permissions for subscribe and publish
        permissions_data = [
            {
                "iot_credential_id": credential.id,
                "topic": company_topic,
                "action": "subscribe",
                "active": True,
            },
            {
                "iot_credential_id": credential.id,
                "topic": company_topic,
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
