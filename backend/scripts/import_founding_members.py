import argparse
import csv
import sys
from hashlib import sha256
from pathlib import Path
from secrets import token_urlsafe

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import func, select

from app.database import Base, SessionLocal, engine
from app.models import FoundingInvite
from app.security import normalize_email


def main() -> None:
    parser = argparse.ArgumentParser(description="Create email-bound founding-member codes (maximum 60 total).")
    parser.add_argument("input_csv", help="CSV containing an email column")
    parser.add_argument("output_csv", help="New CSV that will contain email and one-time code")
    args = parser.parse_args()
    if Path(args.output_csv).exists():
        raise SystemExit("Output CSV already exists. Choose a new path to avoid overwriting founding codes.")
    Base.metadata.create_all(engine)

    with open(args.input_csv, newline="", encoding="utf-8-sig") as source:
        emails = [normalize_email(row["email"]) for row in csv.DictReader(source) if row.get("email")]
    emails = list(dict.fromkeys(emails))
    if not emails:
        raise SystemExit("No emails found. The CSV must contain an email column.")

    created: list[tuple[str, str]] = []
    with SessionLocal() as db:
        existing_count = db.scalar(select(func.count()).select_from(FoundingInvite)) or 0
        existing_emails = set(db.scalars(select(FoundingInvite.email)))
        new_emails = [email for email in emails if email not in existing_emails]
        if existing_count + len(new_emails) > 60:
            raise SystemExit(f"Import would exceed the 60 founding-member limit ({existing_count} already exist).")
        for email in new_emails:
            code = token_urlsafe(18)
            db.add(FoundingInvite(email=email, code_hash=sha256(code.encode("utf-8")).hexdigest()))
            created.append((email, code))
        db.commit()

    with open(args.output_csv, "w", newline="", encoding="utf-8") as destination:
        writer = csv.writer(destination)
        writer.writerow(["email", "founding_code"])
        writer.writerows(created)
    print(f"Created {len(created)} one-time founding-member codes. Protect the output file and delete it after delivery.")


if __name__ == "__main__":
    main()
