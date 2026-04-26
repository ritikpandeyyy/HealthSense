import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { useAppContext } from "../store/AppContext";

function AppointmentsPage() {
  const { appointments, userHistory, doctorRecommendation, createAppointment, refreshAppointments } = useAppContext();
  const [form, setForm] = useState({
    doctorName: "",
    speciality: "",
    hospital: "",
    city: "",
    appointmentDate: "",
    notes: "",
    predictionId: "",
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    refreshAppointments();
  }, []);

  useEffect(() => {
    if (doctorRecommendation) {
      setForm((prev) => ({
        ...prev,
        doctorName: doctorRecommendation.doctorName,
        speciality: doctorRecommendation.speciality,
        hospital: doctorRecommendation.hospital,
        city: doctorRecommendation.city,
      }));
    }
  }, [doctorRecommendation]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const response = await createAppointment({
      ...form,
      predictionId: form.predictionId ? Number(form.predictionId) : null,
    });
    setMessage(response.message);
    if (response.ok) {
      setForm((prev) => ({ ...prev, appointmentDate: "", notes: "", predictionId: "" }));
    }
    setIsSubmitting(false);
  };

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Care Booking"
        title="Appointments and doctor recommendation"
        subtitle="Book consultations based on the most likely condition and keep a clear follow-up plan."
      />

      <section className="dashboard-columns">
        <form className="feature-panel" onSubmit={handleSubmit}>
          <div className="panel-head">
            <div>
              <p className="mini-tag">Book Appointment</p>
              <h3>Schedule a specialist</h3>
            </div>
          </div>

          <div className="form-grid-two">
            <label>
              Doctor Name
              <input name="doctorName" value={form.doctorName} onChange={handleChange} required />
            </label>
            <label>
              Speciality
              <input name="speciality" value={form.speciality} onChange={handleChange} required />
            </label>
            <label>
              Hospital
              <input name="hospital" value={form.hospital} onChange={handleChange} required />
            </label>
            <label>
              City
              <input name="city" value={form.city} onChange={handleChange} required />
            </label>
            <label>
              Appointment Date
              <input name="appointmentDate" type="datetime-local" value={form.appointmentDate} onChange={handleChange} required />
            </label>
            <label>
              Link Prediction
              <select name="predictionId" value={form.predictionId} onChange={handleChange}>
                <option value="">Optional</option>
                {userHistory.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.disease} - {new Date(entry.createdAt).toLocaleDateString()}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Notes
            <textarea name="notes" value={form.notes} onChange={handleChange} rows="4" />
          </label>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Booking..." : "Book Appointment"}
          </button>
          {message ? <p className="status-line">{message}</p> : null}
        </form>

        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Upcoming Visits</p>
              <h3>Scheduled appointments</h3>
            </div>
          </div>

          <div className="feed-list">
            {appointments.length ? (
              appointments.map((item) => (
                <article className="feed-card" key={item.id}>
                  <div className="feed-top">
                    <h4>{item.doctorName}</h4>
                    <span>{item.status}</span>
                  </div>
                  <p>{item.speciality} at {item.hospital}</p>
                  <small>{item.city} • {new Date(item.appointmentDate).toLocaleString()}</small>
                </article>
              ))
            ) : (
              <p className="muted-copy">No appointments booked yet.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

export default AppointmentsPage;
