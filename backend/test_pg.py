import psycopg2

try:
    conn = psycopg2.connect(
        host="db.quantbots.co",
        database="tradexasia",
        user="tradexasia",
        password="tradexasia",
        port="5432"
    )

    print("✅ Connection successful!")

    conn.close()

except Exception as e:
    print("❌ Error:", e)