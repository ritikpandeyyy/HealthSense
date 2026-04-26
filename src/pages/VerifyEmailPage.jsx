import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";

function VerifyEmailPage() {
  const { currentUser, isReady, verifyEmail, resendVerification } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isReady && currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleVerify = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await verifyEmail({ email, otp });
    setMessage(result.message);
    if (result.ok) {
      navigate("/dashboard");
    }
    setIsSubmitting(false);
  };

  const handleResend = async () => {
    const result = await resendVerification(email);
    setMessage(result.message);
  };

  return (
    <div className="auth-card">
      <p className="card-tag">Verify Email</p>
      <h2>Enter your OTP</h2>
      <p className="auth-copy">
        Use the 6-digit code sent to your email to activate the account.
      </p>

      <form className="auth-form" onSubmit={handleVerify}>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          OTP
          <input type="text" maxLength="6" value={otp} onChange={(event) => setOtp(event.target.value)} required />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify Account"}
        </button>
      </form>

      <div className="auth-link-row">
        <button className="text-button" type="button" onClick={handleResend}>
          Resend OTP
        </button>
        <Link to="/login">Back to login</Link>
      </div>
      {message ? <p className="status-line">{message}</p> : null}
    </div>
  );
}

export default VerifyEmailPage;
