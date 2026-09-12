import logging

# logging.basicConfig(
#     filename="/home/daycare1/fastapi-react/api/errors.log",  # Set an absolute path
#     level=logging.ERROR,
#     format="%(asctime)s - %(levelname)s - %(message)s"
# )

logging.basicConfig(
    filename="/home/daycare1/fastapi-react/api/errors.log", 
    level=logging.ERROR, 
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Test: Write a log entry
logger.error("Test error log entry")
