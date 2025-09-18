import os
from datetime import datetime, timezone
from pymongo import MongoClient

def cleanup_email_change_tokens():
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
    db_name = os.getenv('MONGO_DB_NAME', 'imagehub')
    collection_name = os.getenv('MONGO_COLLECTION', 'users')

    client = MongoClient(mongo_uri)
    db = client[db_name]
    collection = db[collection_name]

    now = datetime.now(timezone.utc)
    now_ts_ms = int(now.timestamp() * 1000)

    result = collection.update_many(
        {'emailChangeTokenExpires': {'$lt': now_ts_ms}},
        {'$unset': {
            'pendingEmail': '',
            'emailChangeToken': '',
            'emailChangeTokenExpires': ''
        }}
    )

    print(f'{result.modified_count} documents have been updated')

    client.close()

if __name__ == "__main__":
    cleanup_email_change_tokens()
