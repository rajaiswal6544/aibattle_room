from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]


def load_environment() -> None:
    load_dotenv(ROOT_DIR / ".env")
    load_dotenv(BACKEND_DIR / ".env", override=True)

