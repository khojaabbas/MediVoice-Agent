import os
import sys
import traceback

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "backend")
    )
)

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from database import supabase

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# MODELS
# =========================

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


# =========================
# HOME
# =========================

@app.get("/")
@app.get("/api")
def home():
    return {
        "message": "MediVoice Supabase Backend Running"
    }


# =========================
# BOOK APPOINTMENT
# =========================

@app.post("/book-appointment")
@app.post("/api/book-appointment")
def book_appointment(data: AppointmentRequest):

    try:
        appointment_data = {
            "patient_name": data.patient_name,
            "doctor_type": data.doctor_type,
            "appointment_date": data.appointment_date,
            "appointment_time": data.appointment_time,
            "status": "Confirmed",
        }

        result = (
            supabase
            .table("appointments")
            .insert(appointment_data)
            .execute()
        )

        return {
            "success": True,
            "message": "Appointment booked successfully",
            "appointment": result.data[0]
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }


# =========================
# GET APPOINTMENTS
# =========================

@app.get("/appointments")
@app.get("/api/appointments")
def get_appointments():

    try:
        result = (
            supabase
            .table("appointments")
            .select("*")
            .order("id", desc=True)
            .execute()
        )

        return result.data

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }


# =========================
# UPDATE STATUS
# =========================

@app.put("/appointments/{appointment_id}/status")
@app.put("/api/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    data: StatusUpdateRequest
):

    try:
        result = (
            supabase
            .table("appointments")
            .update({
                "status": data.status
            })
            .eq("id", appointment_id)
            .execute()
        )

        if not result.data:
            return {
                "success": False,
                "message": "Appointment not found"
            }

        return {
            "success": True,
            "message": "Status updated",
            "appointment": result.data[0]
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }


# =========================
# DELETE APPOINTMENT
# =========================

@app.delete("/appointments/{appointment_id}")
@app.delete("/api/appointments/{appointment_id}")
def delete_appointment(appointment_id: int):

    try:
        result = (
            supabase
            .table("appointments")
            .delete()
            .eq("id", appointment_id)
            .execute()
        )

        return {
            "success": True,
            "message": "Appointment deleted successfully",
            "deleted": result.data
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }


# =========================
# SAVE CALL LOG
# =========================

@app.post("/save-call-log")
@app.post("/api/save-call-log")
def save_call_log(data: CallLogRequest):

    try:
        log_data = {
            "caller_name": data.caller_name,
            "phone_number": data.phone_number,
            "call_summary": data.call_summary,
            "transcript": data.transcript,
            "status": data.status,
        }

        result = (
            supabase
            .table("call_logs")
            .insert(log_data)
            .execute()
        )

        return {
            "success": True,
            "message": "Call log saved",
            "call_log": result.data[0]
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }


# =========================
# GET CALL LOGS
# =========================

@app.get("/call-logs")
@app.get("/api/call-logs")
def get_call_logs():

    try:
        result = (
            supabase
            .table("call_logs")
            .select("*")
            .order("id", desc=True)
            .execute()
        )

        return result.data

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
        }