import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal, Appointment, CallLog

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AppointmentRequest(BaseModel):
    patient_name: str
    doctor_type: str
    appointment_date: str
    appointment_time: str


class StatusUpdateRequest(BaseModel):
    status: str


class CallLogRequest(BaseModel):
    caller_name: str = "Unknown"
    phone_number: str = "Unknown"
    call_summary: str = ""
    transcript: str = ""
    status: str = "Completed"


@app.get("/")
def home():
    return {"message": "MediVoice Backend Running"}


@app.post("/book-appointment")
@app.post("/api/book-appointment")
def book_appointment(data: AppointmentRequest):
    db = SessionLocal()
    try:
        appointment = Appointment(
            patient_name=data.patient_name,
            doctor_type=data.doctor_type,
            appointment_date=data.appointment_date,
            appointment_time=data.appointment_time,
            status="Confirmed",
        )
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
        return {"success": True, "message": "Appointment booked successfully", "appointment": {
            "id": appointment.id,
            "patient_name": appointment.patient_name,
            "doctor_type": appointment.doctor_type,
            "appointment_date": appointment.appointment_date,
            "appointment_time": appointment.appointment_time,
            "status": appointment.status,
        }}
    finally:
        db.close()


@app.get("/appointments")
@app.get("/api/appointments")
def get_appointments():
    db = SessionLocal()
    try:
        return db.query(Appointment).order_by(Appointment.id.desc()).all()
    finally:
        db.close()


@app.put("/appointments/{appointment_id}/status")
@app.put("/api/appointments/{appointment_id}/status")
def update_appointment_status(appointment_id: int, data: StatusUpdateRequest):
    db = SessionLocal()
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return {"success": False, "message": "Appointment not found"}
        appointment.status = data.status
        db.commit()
        db.refresh(appointment)
        return {"success": True, "message": "Status updated", "appointment": {
            "id": appointment.id,
            "patient_name": appointment.patient_name,
            "doctor_type": appointment.doctor_type,
            "appointment_date": appointment.appointment_date,
            "appointment_time": appointment.appointment_time,
            "status": appointment.status,
        }}
    finally:
        db.close()


@app.delete("/appointments/{appointment_id}")
@app.delete("/api/appointments/{appointment_id}")
def delete_appointment(appointment_id: int):
    db = SessionLocal()
    try:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return {"success": False, "message": "Appointment not found"}
        db.delete(appointment)
        db.commit()
        return {"success": True, "message": "Appointment deleted successfully"}
    finally:
        db.close()


@app.post("/save-call-log")
@app.post("/api/save-call-log")
def save_call_log(data: CallLogRequest):
    db = SessionLocal()
    try:
        log = CallLog(
            caller_name=data.caller_name,
            phone_number=data.phone_number,
            call_summary=data.call_summary,
            transcript=data.transcript,
            status=data.status,
        )
        db.add(log)
        db.commit()
        return {"success": True, "message": "Call log saved"}
    finally:
        db.close()


@app.get("/call-logs")
@app.get("/api/call-logs")
def get_call_logs():
    db = SessionLocal()
    try:
        return db.query(CallLog).order_by(CallLog.id.desc()).all()
    finally:
        db.close()