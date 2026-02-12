#!/usr/bin/env python3
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API_DIR = ROOT / "apps" / "api"
sys.path.insert(0, str(API_DIR))


def main() -> None:
    if "DATABASE_URL" not in os.environ:
        os.environ["DATABASE_URL"] = "postgresql+psycopg2://postgres:postgres@localhost:5432/golestan"

    from app.db.init_db import create_all  # noqa: E402
    from app.db.session import SessionLocal  # noqa: E402
    from app.services.seeding import ensure_seed_data  # noqa: E402

    create_all()
    db = SessionLocal()
    try:
        ensure_seed_data(db)
    finally:
        db.close()
    print("Seed completed.")


if __name__ == "__main__":
    main()
