from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse

from .agent import generate_reply
from .config import settings
from .db import message_exists, save_message
from .log import logger
from .wa import send_text, verify_signature

router = APIRouter()


@router.get("/webhook")
async def verify(request: Request):
    """Meta webhook verification handshake (one-time, when you save the URL in Meta)."""
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    if mode == "subscribe" and token == settings.META_VERIFY_TOKEN:
        return PlainTextResponse(content=challenge or "")
    raise HTTPException(status_code=403, detail="forbidden")


async def _process_text(phone: str, text: str, wa_message_id: str, contact_name: Optional[str]) -> None:
    try:
        if await message_exists(wa_message_id):
            logger.info("Skipping duplicate message id=%s", wa_message_id)
            return
        await save_message(phone, "user", text, wa_message_id)
        reply = await generate_reply(phone, contact_name=contact_name)
        await save_message(phone, "assistant", reply, None)
        await send_text(phone, reply)
        logger.info("Replied to %s (id=%s)", phone, wa_message_id)
    except Exception as exc:
        logger.exception("Failed to process message id=%s: %s", wa_message_id, exc)


async def _ack_non_text(phone: str, wa_message_id: str, msg_type: str) -> None:
    try:
        if await message_exists(wa_message_id):
            return
        await save_message(phone, "user", f"[{msg_type} message]", wa_message_id)
        await send_text(phone, "I can only read text right now — type something and I've got you.")
    except Exception as exc:
        logger.exception("Failed to ack non-text id=%s: %s", wa_message_id, exc)


@router.post("/webhook")
async def receive(request: Request, background_tasks: BackgroundTasks):
    raw = await request.body()
    sig = request.headers.get("X-Hub-Signature-256")
    if not verify_signature(raw, sig):
        logger.warning("Invalid signature on webhook")
        raise HTTPException(status_code=403, detail="invalid signature")

    payload = await request.json()

    # Meta payload: entry[].changes[].value.messages[]
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {}) or {}

            # Build a wa_id -> profile name map for this batch.
            contacts = {
                c.get("wa_id"): (c.get("profile") or {}).get("name")
                for c in (value.get("contacts") or [])
            }

            for msg in value.get("messages") or []:
                phone = msg.get("from")
                wa_id = msg.get("id")
                msg_type = msg.get("type")
                if not phone or not wa_id or not msg_type:
                    continue

                if msg_type != "text":
                    background_tasks.add_task(_ack_non_text, phone, wa_id, msg_type)
                    continue

                text = ((msg.get("text") or {}).get("body") or "").strip()
                if not text:
                    continue

                background_tasks.add_task(
                    _process_text,
                    phone,
                    text,
                    wa_id,
                    contacts.get(phone),
                )

    # Meta requires a fast 200. Background tasks run after this response is sent.
    return JSONResponse({"ok": True})
