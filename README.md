# 🏥 MediVoice AI Healthcare Receptionist

MediVoice is an AI-powered healthcare voice receptionist system that allows patients to book appointments naturally through real-time voice conversations.

The assistant collects patient details, books appointments through a FastAPI backend, stores data in Supabase, and shows live updates in the admin dashboard.

---

## 🚀 Tech Stack

### Frontend
- React
- Vite
- Axios
- Lucide React
- Modern responsive UI

### Backend
- FastAPI
- Python
- Supabase Client

### Database
- Supabase PostgreSQL

### AI Voice
- Vapi AI Voice Assistant

---

## ✨ Features

### 🎤 AI Voice Appointment Booking
Patients can speak naturally with the AI receptionist to:
- Book appointments
- Select doctor type
- Choose appointment date
- Choose appointment time
- Confirm booking

### 📊 Admin Dashboard
The admin dashboard shows:
- All appointments
- Active appointments
- Completed appointments
- Cancelled / No Show appointments
- Live appointment data from Supabase

### 🔄 Appointment Status Management
Admin can update appointment status:
- Checked In
- In Consultation
- Completed
- Cancelled
- No Show

### 🗑️ Delete Appointment
Admin can delete appointments directly from the dashboard.

### ☁️ Cloud Database
Appointments and call logs are stored permanently in Supabase PostgreSQL.
---

# 📸 Screenshots

## Patient Portal

![alt text](image.png)

## Admin Dashboard
![alt text](image-1.png)
![alt text](image-2.png)
---



---

## 🏗️ System Architecture

```text
Patient Voice Call
        ↓
Vapi AI Assistant
        ↓
FastAPI Backend
        ↓
Supabase PostgreSQL
        ↓
React Admin Dashboard