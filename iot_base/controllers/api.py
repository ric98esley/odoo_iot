import re

from odoo.http import Controller, request, route


class IotDevicesController(Controller):
    def _mqtt_topic_matches(self, topic_pattern, topic):
        """
        Check if a topic matches a topic pattern with MQTT wildcards.

        MQTT wildcards:
        - '+' matches a single level (e.g., 's/+/temp' matches 's/room1/temp')
        - '#' matches multiple levels (e.g., 's/#' matches 's/room1/temp/current')

        Args:
            topic_pattern: Pattern with wildcards (e.g., 'sensors/+/temp')
            topic: Actual topic to match (e.g., 'sensors/room1/temp')

        Returns:
            bool: True if topic matches the pattern
        """
        # Escape special regex characters except our wildcards
        pattern = re.escape(topic_pattern)

        # Replace MQTT wildcards with regex equivalents
        # '+' matches one level (anything except '/')
        pattern = pattern.replace(r"\+", r"[^/]+")

        # '#' matches multiple levels (anything)
        # Must be at the end or followed by nothing
        pattern = pattern.replace(r"\#", r".*")

        # Ensure exact match (start to end)
        pattern = f"^{pattern}$"

        return bool(re.match(pattern, topic))

    @route("/iot/auth/<token>", auth="none", type="http", methods=["POST"], csrf=False)
    def auth_device(self, token, **kwargs):
        """
        EMQX authentication endpoint - works transparently for both users and devices
        """
        if not token:
            return request.make_json_response(
                {
                    "result": "ignore",
                    "error": "Token is required",
                },
                status=403,
            )

        data = request.get_json_data()
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return request.make_json_response(
                {
                    "error": "Username and password are required",
                },
                status=400,
            )

        # Search in unified credentials table (works for both users and devices)
        credential = (
            request.env["iot.credentials"]
            .sudo()
            .search([("name", "=", username), ("password", "=", password)], limit=1)
        )

        if not credential:
            return request.make_json_response(
                {
                    "result": "deny",
                },
                status=403,
            )

        return request.make_json_response(
            {
                "result": "allow",
                "is_superuser": credential.is_superuser,
                "resource_type": credential.resource_type,
            }
        )

    @route("/iot/acl/<token>", auth="none", type="http", methods=["POST"], csrf=False)
    def authorize_topic(self, token, **kwargs):
        """
        EMQX authorization endpoint - checks if user/device has permission for a topic

        Request body:
        {
            "username": "user_admin",
            "topic": "sensors/temperature",
            "action": "publish"  // or "subscribe"
        }

        Response:
        {
            "result": "allow"  // or "deny" or "ignore"
        }

        Status codes:
        - 200: Permission allowed
        - 403: Permission denied or ignored
        """
        if not token:
            return request.make_json_response(
                {"result": "ignore", "error": "Token is required"}, status=403
            )

        data = request.get_json_data()
        username = data.get("username")
        topic = data.get("topic")
        action = data.get("action", "").lower()  # "publish" or "subscribe"

        # Validate required fields
        if not username:
            return request.make_json_response(
                {"result": "ignore", "error": "Username is required"}, status=403
            )

        if not topic:
            return request.make_json_response(
                {"result": "ignore", "error": "Topic is required"}, status=403
            )

        if action not in ["publish", "subscribe"]:
            return request.make_json_response(
                {
                    "result": "ignore",
                    "error": "Action must be 'publish' or 'subscribe'",
                },
                status=403,
            )

        try:
            # Check if credential exists and is a superuser
            credential = (
                request.env["iot.credentials"]
                .sudo()
                .search([("name", "=", username)], limit=1)
            )

            if not credential:
                return request.make_json_response(
                    {"result": "deny", "reason": "Credential not found"}, status=403
                )

            # Superusers have access to all topics
            if credential.is_superuser:
                return request.make_json_response({"result": "allow"}, status=200)

            # Search for matching permissions
            # Get all active permissions for this credential
            permissions = (
                request.env["iot.permission"]
                .sudo()
                .search(
                    [
                        ("iot_credential_id", "=", credential.id),
                        ("active", "=", True),
                        "|",
                        ("action", "=", action),
                        ("action", "=", "all"),
                    ]
                )
            )

            if not permissions:
                return request.make_json_response(
                    {"result": "deny", "reason": "No permissions found"}, status=403
                )

            # Check if any permission matches the topic (considering wildcards)
            for permission in permissions:
                if self._mqtt_topic_matches(permission.topic, topic):
                    return request.make_json_response({"result": "allow"}, status=200)

            # No matching permission found
            return request.make_json_response(
                {"result": "deny", "reason": "No matching topic permission"}, status=403
            )

        except Exception as e:
            # Log error and return ignore
            request.env["ir.logging"].sudo().create(
                {
                    "name": "iot.acl.error",
                    "type": "server",
                    "level": "error",
                    "message": f"Authorization error for "
                    f"{username} on {topic} - {str(e)}",
                    "path": "iot_base.controllers.api",
                    "func": "authorize_topic",
                }
            )
            return request.make_json_response(
                {"result": "ignore", "error": "Internal error"}, status=403
            )

    @route("/iot/devices", auth="user")
    def devices(self):
        return request.make_json_response(
            {
                "devices": request.env["iot.devices"].search([]).to_json(),
            }
        )
