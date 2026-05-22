from typing import Optional

from openai import AsyncOpenAI

from .config import settings
from .db import fetch_history
from .log import logger
from .prompt import SYSTEM_PROMPT


async def generate_reply(phone: str, contact_name: Optional[str] = None) -> str:
    """Generate Zomad's reply.

    Assumes the inbound user message has already been persisted via save_message
    before this function is called — so fetch_history includes it as the last entry.

    If OPENAI_API_KEY is not set, falls back to a static "ping" reply so you can
    validate the WhatsApp wiring before connecting the brain.
    """
    history = await fetch_history(phone, limit=20)

    # Ping mode — no LLM wired yet
    if not settings.OPENAI_API_KEY:
        name = contact_name or "there"
        is_first = len([m for m in history if m[0] == "assistant"]) == 0
        if is_first:
            return f"Zo Zo Zo {name}! pong from Zomad — I see you. Brain isn't connected yet, just the wiring. We'll plug it in soon."
        return "pong — still wiring up the brain. You're hitting Zomad, just no AI yet."

    name_hint = (
        f"\n\nThe citizen's WhatsApp profile name is: {contact_name}."
        if contact_name
        else ""
    )

    messages = [{"role": "system", "content": SYSTEM_PROMPT + name_hint}]
    for role, content in history:
        messages.append({"role": role, "content": content})

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        completion = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=400,
            temperature=0.7,
        )
        reply = (completion.choices[0].message.content or "").strip()
        return reply or "Zo Zo Zo! Say that one more time?"
    except Exception as exc:
        logger.exception("LLM call failed: %s", exc)
        return "I'm having a moment — give me a sec and try again."
