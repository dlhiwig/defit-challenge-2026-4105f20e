"""Concatenate ordered Supabase migrations into a restore snapshot."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
migrations = sorted((root / "supabase" / "migrations").glob("*.sql"))
out_dir = root / "supabase" / "backup"
out_dir.mkdir(parents=True, exist_ok=True)
out = out_dir / "full_schema.sql"

parts = [
    "-- DEFIT schema snapshot generated from repo migrations.",
    "-- Target project: dzvghrttcsfqjxwbtrlv",
    "-- Apply only to an empty database; statements are not re-entrant as a group.",
    "",
]
for path in migrations:
    parts.append(f"-- ===== {path.name} =====")
    parts.append(path.read_text(encoding="utf-8").rstrip())
    parts.append("")

out.write_text("\n".join(parts) + "\n", encoding="utf-8")
print(f"Wrote {out} ({out.stat().st_size} bytes) from {len(migrations)} migrations")
