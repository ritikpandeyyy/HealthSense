import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppContext } from "../store/AppContext";

function AppLayout() {
  const { currentUser, logout, userHistory } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const latestPrediction = userHistory[0];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-mark">HS</div>
          <p className="sidebar-eyebrow">AI Health Console</p>
          <h1>HealthSense</h1>
          <p className="sidebar-copy">
            Predict disease patterns, guide diet choices, and keep a clean
            history for each user.
          </p>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/predict">Prediction</NavLink>
          <NavLink to="/history">History</NavLink>
          <NavLink to="/appointments">Appointments</NavLink>
          <NavLink to="/assistant">AI Assistant</NavLink>
          {currentUser?.role === "admin" ? <NavLink to="/admin">Admin Panel</NavLink> : null}
        </nav>

        <div className="sidebar-card">
          <p className="sidebar-card-label">Current User</p>
          <strong>{currentUser?.name}</strong>
          <span>{currentUser?.email}</span>
          {latestPrediction ? (
            <p className="sidebar-footnote">
              Latest: {latestPrediction.disease} at {latestPrediction.confidence}% confidence
            </p>
          ) : (
            <p className="sidebar-footnote">No predictions yet for this account.</p>
          )}
        </div>

        <button className="ghost-button" onClick={handleLogout}>
          Log Out
        </button>
      </aside>

      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
