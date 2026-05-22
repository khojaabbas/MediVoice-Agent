import { useEffect, useRef, useState } from "react";
import axios from "axios";

import {
  CalendarCheck,
  PhoneCall,
  Activity,
  Users,
  RefreshCw,
  Stethoscope,
  ShieldCheck,
  Mic,
  PhoneOff,
  LayoutDashboard,
  Trash2,
} from "lucide-react";

import "./App.css";

const API_URL = "http://127.0.0.1:8000/api";
const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;
const VAPI_PHONE_NUMBER =
  import.meta.env.VITE_VAPI_PHONE_NUMBER || "+1 970 578 7052";

function App() {
  const [page, setPage] = useState("portal");
  const [appointments, setAppointments] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filter, setFilter] = useState("Active");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("AI Receptionist Online");

  const vapiRef = useRef(null);

  const activeStatuses = ["Confirmed", "Checked In", "In Consultation"];

  const fetchAppointments = async () => {
    const res = await axios.get(`${API_URL}/appointments`);
    setAppointments(res.data);

    if (!selectedAppointment && res.data.length > 0) {
      setSelectedAppointment(res.data[0]);
    }
  };

  const fetchCallLogs = async () => {
    const res = await axios.get(`${API_URL}/call-logs`);
    setCallLogs(res.data);
  };

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      await fetchAppointments();
      await fetchCallLogs();
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const res = await axios.put(`${API_URL}/appointments/${appointmentId}/status`, {
        status: newStatus,
      });

      if (res.data.success) {
        setAppointments((prev) =>
          prev.map((item) =>
            item.id === appointmentId ? { ...item, status: newStatus } : item
          )
        );

        setSelectedAppointment((prev) =>
          prev && prev.id === appointmentId ? { ...prev, status: newStatus } : prev
        );
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("Failed to update appointment status.");
    }
  };

  const deleteAppointment = async (appointmentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this appointment?"
    );

    if (!confirmDelete) return;

    try {
      const res = await axios.delete(`${API_URL}/appointments/${appointmentId}`);

      if (res.data.success) {
        setAppointments((prev) => prev.filter((item) => item.id !== appointmentId));
        setSelectedAppointment(null);
        await refreshData();
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete appointment.");
    }
  };

  const filteredAppointments = appointments.filter((item) => {
    const status = item.status || "Confirmed";

    if (filter === "All") return true;
    if (filter === "Active") return activeStatuses.includes(status);
    return status === filter;
  });

  const counts = {
    all: appointments.length,
    active: appointments.filter((item) =>
      activeStatuses.includes(item.status || "Confirmed")
    ).length,
    completed: appointments.filter((item) => item.status === "Completed").length,
    cancelled: appointments.filter((item) => item.status === "Cancelled").length,
    noShow: appointments.filter((item) => item.status === "No Show").length,
  };

  const startCall = async () => {
    if (!VAPI_PUBLIC_KEY) {
      alert("Missing VITE_VAPI_PUBLIC_KEY in frontend/.env");
      return;
    }

    if (!VAPI_ASSISTANT_ID) {
      alert("Missing VITE_VAPI_ASSISTANT_ID in frontend/.env");
      return;
    }

    try {
      const VapiModule = await import("@vapi-ai/web");

      const VapiClass =
        VapiModule.default?.default ||
        VapiModule.default ||
        VapiModule.Vapi ||
        VapiModule.VapiClient;

      if (typeof VapiClass !== "function") {
        console.error("Vapi SDK exports:", VapiModule);
        alert("Vapi SDK class not found. Check browser console.");
        return;
      }

      const vapi = new VapiClass(VAPI_PUBLIC_KEY);
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        setIsCalling(true);
        setCallStatus("AI Call In Progress...");
      });

      vapi.on("call-end", () => {
        setIsCalling(false);
        setCallStatus("AI Receptionist Online");
        refreshData();
      });

      vapi.on("error", (e) => {
        console.error("Vapi Error:", e);
        setIsCalling(false);
        setCallStatus("Call Failed");
      });

      await vapi.start(VAPI_ASSISTANT_ID);
    } catch (error) {
      console.error("Failed to start Vapi call:", error);
      alert("Failed to start Vapi call. Check browser console.");
    }
  };

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/10 bg-[#0b1728]/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-400/15 flex items-center justify-center">
            <Stethoscope className="text-emerald-300" />
          </div>

          <div>
            <h1 className="text-xl font-bold">MediVoice</h1>
            <p className="text-xs text-slate-400">AI Healthcare Voice Platform</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setPage("portal")}
            className={`px-4 py-2 rounded-xl text-sm ${
              page === "portal"
                ? "bg-emerald-400 text-slate-950"
                : "bg-white/5 text-slate-300"
            }`}
          >
            Patient Portal
          </button>

          <button
            onClick={() => setPage("dashboard")}
            className={`px-4 py-2 rounded-xl text-sm ${
              page === "dashboard"
                ? "bg-emerald-400 text-slate-950"
                : "bg-white/5 text-slate-300"
            }`}
          >
            Admin Dashboard
          </button>
        </div>
      </div>

      {page === "portal" ? (
        <PatientPortal
          startCall={startCall}
          endCall={endCall}
          isCalling={isCalling}
          callStatus={callStatus}
        />
      ) : (
        <Dashboard
          appointments={appointments}
          filteredAppointments={filteredAppointments}
          selectedAppointment={selectedAppointment}
          setSelectedAppointment={setSelectedAppointment}
          updateAppointmentStatus={updateAppointmentStatus}
          deleteAppointment={deleteAppointment}
          filter={filter}
          setFilter={setFilter}
          counts={counts}
          refreshData={refreshData}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
        />
      )}
    </div>
  );
}

function PatientPortal({ startCall, endCall, isCalling, callStatus }) {
  return (
    <main className="px-6 md:px-10 py-10">
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-emerald-300 font-medium mb-3">
            AI-Powered Voice Healthcare Receptionist
          </p>

          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Book appointments naturally through voice conversation.
          </h2>

          <p className="text-slate-400 mt-6 text-lg max-w-2xl">
            Talk with our AI healthcare receptionist in real time. The assistant
            handles appointment booking, smart scheduling, duplicate prevention,
            and live clinic updates automatically.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            {!isCalling ? (
              <button
                onClick={startCall}
                className="flex items-center gap-3 bg-emerald-400 text-slate-950 px-8 py-5 rounded-2xl font-bold text-lg hover:bg-emerald-300 transition shadow-2xl"
              >
                <Mic />
                Start AI Voice Call
              </button>
            ) : (
              <button
                onClick={endCall}
                className="flex items-center gap-3 bg-red-500 text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-red-400 transition shadow-2xl"
              >
                <PhoneOff />
                End Call
              </button>
            )}

            <a
              href={`tel:${VAPI_PHONE_NUMBER.replaceAll(" ", "")}`}
              className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-5 rounded-2xl text-slate-200"
            >
              <PhoneCall className="text-emerald-300" />
              {VAPI_PHONE_NUMBER}
            </a>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <span
              className={`h-3 w-3 rounded-full ${
                isCalling ? "bg-red-400 animate-pulse" : "bg-emerald-400"
              }`}
            ></span>

            <p className="text-slate-300">{callStatus}</p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MiniCard
              title="Real-Time Voice AI"
              text="Natural human-like appointment conversations"
            />
            <MiniCard
              title="Smart Scheduling"
              text="Duplicate prevention and slot validation"
            />
            <MiniCard
              title="Live Operations"
              text="Dashboard updates instantly after bookings"
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-emerald-400/10 blur-3xl rounded-full"></div>

          <div className="relative bg-[#0b1728] border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-10">
              <div>
                <p className="text-emerald-300 font-medium">AI Receptionist</p>
                <h3 className="text-3xl font-bold mt-2">Live Voice Assistant</h3>
              </div>

              <div className="h-16 w-16 rounded-3xl bg-emerald-400/15 flex items-center justify-center">
                <Mic className="text-emerald-300" size={30} />
              </div>
            </div>

            <div className="flex justify-center py-10">
              <div className="relative">
                <div
                  className={`absolute inset-0 rounded-full ${
                    isCalling ? "animate-ping bg-emerald-400/30" : "bg-emerald-400/10"
                  }`}
                ></div>

                <div
                  className={`relative h-40 w-40 rounded-full flex items-center justify-center ${
                    isCalling
                      ? "bg-emerald-400"
                      : "bg-emerald-400/20 border border-emerald-400/20"
                  }`}
                >
                  <Mic
                    size={50}
                    className={isCalling ? "text-slate-950" : "text-emerald-300"}
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <Feature text="Voice appointment booking" />
              <Feature text="Real-time AI receptionist conversation" />
              <Feature text="Automatic transcript logging" />
              <Feature text="Smart slot availability validation" />
              <Feature text="AI-powered scheduling workflow" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Dashboard({
  appointments,
  filteredAppointments,
  selectedAppointment,
  setSelectedAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  filter,
  setFilter,
  counts,
  refreshData,
  isRefreshing,
  lastUpdated,
}) {
  return (
    <main className="p-6 md:p-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
        <div>
          <p className="text-emerald-300 text-sm font-medium">
            Healthcare Voice Automation
          </p>

          <h2 className="text-3xl md:text-4xl font-bold mt-2">
            Appointment Operations Dashboard
          </h2>

          <p className="text-slate-400 mt-2">
            Monitor active bookings, completed visits, cancellations, and clinic activity.
          </p>

          {lastUpdated && (
            <p className="text-xs text-slate-500 mt-2">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>

        <button
          onClick={refreshData}
          className="flex items-center justify-center gap-2 bg-emerald-400 text-slate-950 px-5 py-3 rounded-xl font-semibold hover:bg-emerald-300 transition"
        >
          <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={<CalendarCheck />}
          title="All Appointments"
          value={counts.all}
          active={filter === "All"}
          onClick={() => setFilter("All")}
        />

        <StatCard
          icon={<PhoneCall />}
          title="Active"
          value={counts.active}
          active={filter === "Active"}
          onClick={() => setFilter("Active")}
        />

        <StatCard
          icon={<Users />}
          title="Completed"
          value={counts.completed}
          active={filter === "Completed"}
          onClick={() => setFilter("Completed")}
        />

        <StatCard
          icon={<Activity />}
          title="Cancelled / No Show"
          value={counts.cancelled + counts.noShow}
          active={filter === "Cancelled"}
          onClick={() => setFilter("Cancelled")}
        />
      </section>

      <div className="flex flex-wrap gap-3 mb-6">
        {["Active", "Completed", "Cancelled", "No Show", "All"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              filter === item
                ? "bg-emerald-400 text-slate-950"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-[#0b1728] border border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold">Appointments</h3>
              <p className="text-sm text-slate-400">
                Showing: {filter} appointments
              </p>
            </div>

            <ShieldCheck className="text-emerald-300" />
          </div>

          <div className="overflow-x-auto max-h-[560px] overflow-y-auto pr-2">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-[#0b1728]">
                <tr className="text-slate-400 text-sm border-b border-white/10">
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Doctor</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAppointments.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedAppointment(item)}
                    className={`border-b border-white/5 cursor-pointer hover:bg-white/5 transition ${
                      selectedAppointment?.id === item.id ? "bg-white/5" : ""
                    }`}
                  >
                    <td className="py-4 font-medium">{item.patient_name}</td>
                    <td className="py-4 text-slate-300">{item.doctor_type}</td>
                    <td className="py-4 text-slate-300">{item.appointment_date}</td>
                    <td className="py-4 text-slate-300">{item.appointment_time}</td>
                    <td className="py-4">
                      <StatusBadge status={item.status || "Confirmed"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredAppointments.length === 0 && (
              <p className="text-slate-400 text-center py-10">
                No {filter.toLowerCase()} appointments found.
              </p>
            )}
          </div>
        </div>

        <div className="bg-[#0b1728] border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold">Patient Appointment Details</h3>
              <p className="text-sm text-slate-400">
                Select a row to manage appointment
              </p>
            </div>

            <LayoutDashboard className="text-emerald-300" />
          </div>

          {selectedAppointment ? (
            <div className="space-y-4">
              <DetailItem label="Patient Name" value={selectedAppointment.patient_name} />
              <DetailItem label="Doctor Type" value={selectedAppointment.doctor_type} />
              <DetailItem
                label="Appointment Date"
                value={selectedAppointment.appointment_date}
              />
              <DetailItem
                label="Appointment Time"
                value={selectedAppointment.appointment_time}
              />

              <div className="mt-6 p-5 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-sm text-slate-400 font-semibold">Status</p>
                <div className="mt-2">
                  <StatusBadge status={selectedAppointment.status || "Confirmed"} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <StatusButton
                  label="Checked In"
                  onClick={() =>
                    updateAppointmentStatus(selectedAppointment.id, "Checked In")
                  }
                />
                <StatusButton
                  label="In Consultation"
                  onClick={() =>
                    updateAppointmentStatus(selectedAppointment.id, "In Consultation")
                  }
                />
                <StatusButton
                  label="Completed"
                  onClick={() =>
                    updateAppointmentStatus(selectedAppointment.id, "Completed")
                  }
                />
                <StatusButton
                  label="Cancelled"
                  onClick={() =>
                    updateAppointmentStatus(selectedAppointment.id, "Cancelled")
                  }
                />
                <StatusButton
                  label="No Show"
                  onClick={() =>
                    updateAppointmentStatus(selectedAppointment.id, "No Show")
                  }
                />
                <button
                  onClick={() => deleteAppointment(selectedAppointment.id)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-300 font-semibold hover:bg-red-500 hover:text-white transition"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-400">
                Select a patient appointment from the table.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatusButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-3 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 font-semibold hover:bg-emerald-400 hover:text-slate-950 transition"
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Confirmed: "bg-emerald-400/15 text-emerald-300",
    "Checked In": "bg-blue-400/15 text-blue-300",
    "In Consultation": "bg-yellow-400/15 text-yellow-300",
    Completed: "bg-purple-400/15 text-purple-300",
    Cancelled: "bg-red-400/15 text-red-300",
    "No Show": "bg-gray-400/15 text-gray-300",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        styles[status] || styles.Confirmed
      }`}
    >
      {status}
    </span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function Feature({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>
      <p className="text-slate-300">{text}</p>
    </div>
  );
}

function MiniCard({ title, text }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-slate-400 mt-1">{text}</p>
    </div>
  );
}

function StatCard({ icon, title, value, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-[#0b1728] border rounded-3xl p-5 transition hover:bg-white/5 ${
        active ? "border-emerald-400/60" : "border-white/10"
      }`}
    >
      <div className="h-11 w-11 rounded-2xl bg-emerald-400/15 flex items-center justify-center text-emerald-300 mb-4">
        {icon}
      </div>

      <p className="text-slate-400 text-sm">{title}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </button>
  );
}

export default App;