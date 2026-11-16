"""Print private aggregate beta usage without exposing the admin key in URLs."""

import json
import os
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def main() -> int:
    origin = os.getenv("RISE_API_URL", "").rstrip("/")
    key = os.getenv("RISE_ADMIN_API_KEY", "")
    if not origin or len(key) < 32:
        print("Set RISE_API_URL and a 32+ character RISE_ADMIN_API_KEY in your environment.", file=sys.stderr)
        return 1
    if not origin.startswith("https://") and not origin.startswith(("http://127.0.0.1:", "http://localhost:")):
        print("Analytics requires HTTPS outside local development.", file=sys.stderr)
        return 1
    request = Request(f"{origin}/admin/analytics", headers={"X-RISE-ADMIN-KEY": key})
    try:
        with urlopen(request, timeout=15) as response:
            report = json.load(response)
    except (HTTPError, URLError) as error:
        print(f"Could not read analytics: {error}", file=sys.stderr)
        return 1
    print(f"Members: {report['total_members']}  |  Analytics opt-ins: {report['analytics_participants']}  |  Active opt-ins last 7 days: {report['active_last_7_days']}")
    print(
        f"Started at least one mission: {report['members_with_mission_started']}  |  "
        f"Completed at least one mission: {report['members_with_mission']}  |  "
        f"Start-to-completion: {report['mission_start_completion_rate_percent']}%"
    )
    print(f"Total missions: {report['total_missions']}  |  Focused minutes: {report['total_focused_minutes']}")
    print(f"App minutes (foreground sessions): {report['total_app_minutes']}")
    print(
        f"Average signup: {report['average_signup_seconds']} seconds  |  "
        f"Average first mission start: {report['average_minutes_to_first_mission_start']} minutes  |  "
        f"Average first completion: {report['average_minutes_to_first_mission']} minutes"
    )
    retention = report["retention"]
    print("\nRetention among eligible analytics participants:")
    for label in ("day_1", "day_7", "day_30"):
        window = retention[label]
        print(
            f"  {label.replace('_', ' ').title()}: {window['rate_percent']}%  "
            f"({window['retained_members']}/{window['eligible_members']})"
        )
    print(
        f"\nInvites shared: {report['invite_shares']} by {report['members_who_shared']} members  |  "
        f"Feedback: {report['feedback_total']} total, {report['feedback_email_pending']} email notification(s) pending"
    )
    if report["feedback_by_category"]:
        categories = ", ".join(f"{name}={count}" for name, count in sorted(report["feedback_by_category"].items()))
        print(f"Feedback categories: {categories}")
    print("\nMember activity (IDs only, no email or proof):")
    for member in report["members"]:
        print(f"  {member['user_id'][:8]}  missions={member['missions_completed']}  focused_minutes={member['focused_minutes']}  app_minutes={member['app_minutes']}  active_days={member['active_days']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
