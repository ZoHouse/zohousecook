import hashlib
import hmac
from typing import Optional

import httpx

from .config import settings
from .log import logger

GRAPH_URL = "https://graph.facebook.com/v21.0"


def verify_signature(raw_body: bytes, signature_header: Optional[str]) -> bool:
    """Verify Meta's X-Hub-Signature-256 header. Compares HMAC-SHA256 of raw body using app secret."""
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    provided = signature_header.split("=", 1)[1]
    computed = hmac.new(
        settings.META_APP_SECRET.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(provided, computed)


async def send_text(to: str, text: str) -> None:
    url = f"{GRAPH_URL}/{settings.META_PHONE_NUMBER_ID}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {"body": text, "preview_url": False},
    }
    headers = {
        "Authorization": f"Bearer {settings.META_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code >= 300:
            logger.error("WA send failed [%d]: %s", resp.status_code, resp.text)
            resp.raise_for_status()
