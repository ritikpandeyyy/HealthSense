import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";

function ForgotPasswordPage() {
  const { forgotPassword } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await forgotPassword(email);
    setMessage(result.message);
    if (result.ok) {
      navigate("/reset-password", { state: { email } });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-card">
      <p className="card-tag">Password Help</p>
      <h2>Forgot password</h2>
      <p className="auth-copy">
        We will send a reset OTP to the email address linked with your account.
      </p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset OTP"}
        </button>
      </form>
      {message ? <p className="status-line">{message}</p> : null}
      <p className="form-switch">
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}

export default ForgotPasswordPage;
