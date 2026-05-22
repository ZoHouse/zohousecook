from typing import List, Tuple, Optional
import aiosqlite

from .config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    wa_message_id TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_phone_created
    ON messages(phone, created_at);
"""


async def init_db() -> None:
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.executescript(SCHEMA)
        await db.commit()


async def message_exists(wa_message_id: str) -> bool:
    async with aiosqlite.connect(settings.DB_PATH) as db:
        cursor = await db.execute(
            "SELECT 1 FROM messages WHERE wa_message_id = ?",
            (wa_message_id,),
        )
        return await cursor.fetchone() is not None


async def save_message(
    phone: str,
    role: str,
    content: str,
    wa_message_id: Optional[str] = None,
) -> None:
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            "INSERT OR IGNORE INTO messages (phone, role, content, wa_message_id) "
            "VALUES (?, ?, ?, ?)",
            (phone, role, content, wa_message_id),
        )
        await db.commit()


async def fetch_history(phone: str, limit: int = 20) -> List[Tuple[str, str]]:
    """Return [(role, content), ...] in chronological order (oldest first)."""
    async with aiosqlite.connect(settings.DB_PATH) as db:
        cursor = await db.execute(
            "SELECT role, content FROM messages "
            "WHERE phone = ? AND role IN ('user', 'assistant') "
            "ORDER BY created_at DESC LIMIT ?",
            (phone, limit),
        )
        rows = await cursor.fetchall()
        return [(row[0], row[1]) for row in reversed(rows)]
