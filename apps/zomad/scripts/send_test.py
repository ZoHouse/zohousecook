"""Smoke test: send 'pong' to a phone number to verify Meta creds.

Usage (from apps/zomad/):
    python -m scripts.send_test +91XXXXXXXXXX
"""

import asyncio
import sys

from app.wa import send_text


async def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python -m scripts.send_test +91XXXXXXXXXX")
        sys.exit(1)
    phone = sys.argv[1].lstrip("+")
    await send_text(phone, "pong from Zomad — env check passed.")
    print(f"sent to {phone}")


if __name__ == "__main__":
    asyncio.run(main())
