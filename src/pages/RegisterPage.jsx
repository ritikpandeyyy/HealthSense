import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";

function RegisterPage() {
  const { currentUser, isReady, register } = useAppContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isReady && currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await register(form);
    setMessage(result.message);
    if (result.ok) {
      navigate("/verify-email", { state: { email: result.email || form.email } });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-card">
      <p className="card-tag">Create Account</p>
      <h2>Register your health workspace</h2>
      <p className="auth-copy">
        Create a secure account and verify it with an OTP sent to your email address.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Full Name
          <input name="name" type="text" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      {message ? <p className="status-line">{message}</p> : null}
      <p className="form-switch">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
