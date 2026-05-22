from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import supabase

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
@app.get("/api")
def home():
    return {"message": "MediVoice Supabase Backend Running"}

@app.post("/book-appointment")
@app.post("/api/book-appointment")
def book_appointment(data: AppointmentRequest):
    response = supabase.table("appointments").insert({
        "patient_name": data.patient_name,
        "doctor_type": data.doctor_type,
        "appointment_date": data.appointment_date,
        "appointment_time": data.appointment_time,
        "status": "Confirmed"
    }).execute()

    return {
        "success": True,
        "message": "Appointment booked successfully",
        "appointment": response.data[0] if response.data else None
    }

@app.get("/appointments")
@app.get("/api/appointments")
def get_appointments():
    response = supabase.table("appointments").select("*").order("id", desc=True).execute()
    return response.data

@app.put("/appointments/{appointment_id}/status")
@app.put("/api/appointments/{appointment_id}/status")
def update_appointment_status(appointment_id: int, data: StatusUpdateRequest):
    response = (
        supabase.table("appointments")
        .update({"status": data.status})
        .eq("id", appointment_id)
        .execute()
    )

    return {
        "success": True,
        "message": "Status updated",
        "appointment": response.data[0] if response.data else None
    }

@app.delete("/appointments/{appointment_id}")
@app.delete("/api/appointments/{appointment_id}")
def delete_appointment(appointment_id: int):
    response = (
        supabase.table("appointments")
        .delete()
        .eq("id", appointment_id)
        .execute()
    )

    return {
        "success": True,
        "message": "Appointment deleted successfully",
        "deleted": response.data
    }

@app.post("/save-call-log")
@app.post("/api/save-call-log")
def save_call_log(data: CallLogRequest):
    response = supabase.table("call_logs").insert({
        "caller_name": data.caller_name,
        "phone_number": data.phone_number,
        "call_summary": data.call_summary,
        "transcript": data.transcript,
        "status": data.status
    }).execute()

    return {
        "success": True,
        "message": "Call log saved",
        "call_log": response.data[0] if response.data else None
    }

@app.get("/call-logs")
@app.get("/api/call-logs")
def get_call_logs():
    response = supabase.table("call_logs").select("*").order("id", desc=True).execute()
    return response.data