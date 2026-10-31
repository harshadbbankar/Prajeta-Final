# Iteration 18 UI helper: clone a completed booking of demo customer 9000000003 into TEST_ unrated completed trips
# usage: python tests/setup_ui_iter18.py seed <n> [minutes_ago] | cleanup
import sys
import uuid
from datetime import datetime, timedelta, timezone

from dotenv import dotenv_values
from pymongo import MongoClient

ENV = dotenv_values("/app/backend/.env")
db = MongoClient(ENV["MONGO_URL"])[ENV["DB_NAME"]]
db.otp_requests.delete_many({})
cust = db.users.find_one({"phone": {"$regex": "9000000003$"}})
if sys.argv[1] == "cleanup":
    ids = [b["id"] for b in db.bookings.find({"customer_id": cust["id"], "ref": {"$regex": "^TESTUI"}})]
    db.reviews.delete_many({"booking_id": {"$in": ids}})
    db.trip_events.delete_many({"booking_id": {"$in": ids}})
    print("deleted", db.bookings.delete_many({"id": {"$in": ids}}).deleted_count)
    sys.exit()
src = db.bookings.find_one({"customer_id": cust["id"], "status": "COMPLETED", "driver_id": {"$ne": None}}, {"_id": 0})
n = int(sys.argv[2])
mins = int(sys.argv[3]) if len(sys.argv) > 3 else 0
for i in range(n):
    b = dict(src)
    b["id"] = str(uuid.uuid4())
    b["ref"] = "TESTUI" + b["id"][:4].upper()
    b["updated_at"] = (datetime.now(timezone.utc) - timedelta(minutes=mins + i * 5)).isoformat()
    b["date"] = "2020-01-01"
    db.bookings.insert_one(b)
    print(b["id"], b["ref"])
