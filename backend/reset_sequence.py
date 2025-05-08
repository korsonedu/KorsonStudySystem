from app.database import engine
from sqlalchemy import text

def reset_sequence():
    with engine.connect() as conn:
        conn.execute(text("ALTER SEQUENCE study_tasks_id_seq RESTART WITH 13"))
        conn.commit()
        print('Sequence reset successfully')

if __name__ == "__main__":
    reset_sequence()
