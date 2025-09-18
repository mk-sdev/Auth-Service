import os
from datetime import datetime, timezone
import psycopg2

def cleanup_email_change_tokens():
    pg_host = os.getenv('PG_HOST', 'localhost')
    pg_port = os.getenv('PG_PORT', '5432')
    pg_dbname = os.getenv('PG_DBNAME', 'imagehub')
    pg_user = os.getenv('PG_USER', 'postgres')
    pg_password = os.getenv('PG_PASSWORD', 'password')

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
    UPDATE users
    SET
        passwordResetToken = NULL,
        passwordResetTokenExpires = NULL
    WHERE passwordResetTokenExpires < %s
    """

    cur.execute(query, (now,))
    updated_count = cur.rowcount

    conn.commit()
    cur.close()
    conn.close()

    print(f'{updated_count} records have been updated')

if __name__ == "__main__":
    cleanup_email_change_tokens()
