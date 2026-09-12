import os

TORTOISE_ORM = {
    "connections": {
        "default": os.getenv("DATABASE_URL")
    },
    "apps": {
        "models": {
            "models": {"models": ["api.models"]},
            "default_connection": "default",
        }
    }
}
