import os
import time
import psycopg2

def cleanup_delete_accounts():
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

    now_ms = int(time.time() * 1000)

    query = """
    DELETE FROM users
    WHERE is_deletion_pending = TRUE
      AND deletion_scheduled_at IS NOT NULL
      AND deletion_scheduled_at < %s
    """

    cur.execute(query, (now_ms,))
    deleted_count = cur.rowcount

    conn.commit()
    cur.close()
    conn.close()

    print(f'{deleted_count} accounts have been deleted')

if __name__ == "__main__":
    cleanup_delete_accounts()
