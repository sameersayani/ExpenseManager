import asyncio
from tortoise import Tortoise

async def init():
    await Tortoise.init(
        config={
            "connections": {
                "default": "postgres://postgres:sameer@localhost:5432/smartexpensedb"
            },
            "apps": {
                "models": {
                    "models": ["api.models"],  # Make sure "models" is your actual model module
                    "default_connection": "default"
                }
            }
        }
    )
    await Tortoise.generate_schemas()
    print("✅ Database migration completed successfully!")
    await Tortoise.close_connections()

if __name__ == "__main__":
    asyncio.run(init())
