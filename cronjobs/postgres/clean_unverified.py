import os
from datetime import datetime, timezone
import psycopg2

def delete_expired_tokens():
    pg_host = os.getenv('PG_HOST', 'localhost')
    pg_port = os.getenv('PG_PORT', '5432')
    pg_dbname = os.getenv('PG_DBNAME', 'imagehub')
    pg_user = os.getenv('PG_USER', 'postgres')
    pg_password = os.getenv('PG_PASSWORD', 'password')

    # connect with the db
    conn = psycopg2.connect(
        host=pg_host,
        port=pg_port,
        dbname=pg_dbname,
        user=pg_user,
        password=pg_password
    )
    cur = conn.cursor()

    now = datetime.now(timezone.utc)

    query = """
    DELETE FROM users
    WHERE verification_token_expires < %s
    """
    cur.execute(query, (now,))
    deleted_count = cur.rowcount

    conn.commit()
    cur.close()
    conn.close()

    print(f'{deleted_count} have been deleted')

if __name__ == "__main__":
    delete_expired_tokens()
