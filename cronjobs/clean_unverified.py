import os
from datetime import datetime, timezone
from pymongo import MongoClient

#deletes records of unverified users
def delete_expired_tokens():
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
    db_name = os.getenv('MONGO_DB_NAME', 'imagehub')
    collection_name = os.getenv('MONGO_COLLECTION', 'users')

    client = MongoClient(mongo_uri)
    db = client[db_name]
    collection = db[collection_name]

    now = datetime.now(timezone.utc)
    now_ts_ms = int(now.timestamp() * 1000)  # timestamp in ms

    result = collection.delete_many({'verificationTokenExpires': {'$lt': now_ts_ms}})

    print(f'{result.deleted_count} documents have been deleted')

    client.close()

if __name__ == "__main__":
    delete_expired_tokens()
