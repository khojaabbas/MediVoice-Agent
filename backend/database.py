import os
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'medivoice.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String)
    doctor_type = Column(String)
    appointment_date = Column(String)
    appointment_time = Column(String)
    status = Column(String, default="Confirmed")


class CallLog(Base):
    __tablename__ = "call_logs"

    id = Column(Integer, primary_key=True, index=True)
    caller_name = Column(String)
    phone_number = Column(String)
    call_summary = Column(Text)
    transcript = Column(Text)
    status = Column(String)


Base.metadata.create_all(bind=engine)