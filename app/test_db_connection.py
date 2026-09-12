import asyncpg
import asyncio
from config import DATABASE_URL  # Importing the hardcoded connection URL

async def test_connection():
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Connection successful!")
        await conn.close()
    except Exception as e:
        print(f"❌ Connection failed: {e}")

asyncio.run(test_connection())
