import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../store/AppContext";

function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, isReady } = useAppContext();
  const location = useLocation();

  if (!isReady) {
    return <div className="boot-screen">Loading workspace...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && currentUser.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
