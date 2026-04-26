import { useEffect } from "react";
import PageHeader from "../components/PageHeader";
import { useAppContext } from "../store/AppContext";

function AdminPage() {
  const { adminOverview, refreshAdminOverview } = useAppContext();

  useEffect(() => {
    refreshAdminOverview();
  }, []);

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Administration"
        title="Admin panel"
        subtitle="Monitor user growth, verification status, risk distribution, and recent account activity."
      />

      <section className="stats-grid">
        <article className="stat-card accent-red">
          <span>Total Users</span>
          <strong>{adminOverview?.stats.totalUsers || 0}</strong>
          <p>All registered accounts.</p>
        </article>
        <article className="stat-card accent-gold">
          <span>Verified Users</span>
          <strong>{adminOverview?.stats.verifiedUsers || 0}</strong>
          <p>Email-confirmed accounts.</p>
        </article>
        <article className="stat-card accent-green">
          <span>Total Predictions</span>
          <strong>{adminOverview?.stats.totalPredictions || 0}</strong>
          <p>Saved diagnostic records.</p>
        </article>
        <article className="stat-card accent-blue">
          <span>Appointments</span>
          <strong>{adminOverview?.stats.totalAppointments || 0}</strong>
          <p>Care follow-ups booked.</p>
        </article>
      </section>

      <section className="dashboard-columns">
        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Recent Users</p>
              <h3>Account activity</h3>
            </div>
          </div>
          <div className="feed-list">
            {adminOverview?.users?.map((user) => (
              <article className="feed-card" key={user.id}>
                <div className="feed-top">
                  <h4>{user.name}</h4>
                  <span>{user.role}</span>
                </div>
                <p>{user.email}</p>
                <small>
                  {user.isVerified ? "Verified" : "Pending verification"} • {new Date(user.joinedAt).toLocaleString()}
                </small>
              </article>
            ))}
          </div>
        </article>

        <article className="feature-panel">
          <div className="panel-head">
            <div>
              <p className="mini-tag">Risk Summary</p>
              <h3>Population chart</h3>
            </div>
          </div>
          <div className="risk-chart-list">
            {adminOverview?.riskChart?.length ? (
              adminOverview.riskChart.map((item) => (
                <div className="trend-row" key={item.label}>
                  <div className="trend-row-top">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: `${Math.min(100, item.value * 22)}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="muted-copy">No prediction data available yet.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

export default AdminPage;
