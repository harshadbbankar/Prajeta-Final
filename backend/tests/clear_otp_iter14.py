# Iteration 14 helper: clear OTP rate-limit records so UI login works repeatedly
from dotenv import dotenv_values
from pymongo import MongoClient

ENV = dotenv_values("/app/backend/.env")
print("cleared", MongoClient(ENV["MONGO_URL"])[ENV["DB_NAME"]].otp_requests.delete_many({}).deleted_count)
