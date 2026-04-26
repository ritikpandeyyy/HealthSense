import { createContext, useContext, useEffect, useState } from "react";

const AppContext = createContext(null);

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({
    ok: false,
    message: "Unexpected server response.",
  }));

  if (!response.ok) {
    return {
      ok: false,
      message: data.message || "Request failed.",
      status: response.status,
      ...data,
    };
  }

  return data;
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [symptomCatalog, setSymptomCatalog] = useState([]);
  const [doctorRecommendation, setDoctorRecommendation] = useState(null);
  const [adminOverview, setAdminOverview] = useState(null);
  const [aiModel, setAiModel] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function bootstrapApp() {
      const [symptomsResponse, meResponse] = await Promise.all([
        apiRequest("/api/symptoms"),
        apiRequest("/api/me"),
      ]);

      if (symptomsResponse.ok) {
        setSymptomCatalog(symptomsResponse.symptoms.map((item) => item.label));
      }

      if (meResponse.ok && meResponse.user) {
        setCurrentUser(meResponse.user);
        await Promise.all([refreshHistory(), refreshAppointments(), refreshRecommendation()]);
        if (meResponse.user.role === "admin") {
          await refreshAdminOverview();
        }
      }

      setIsReady(true);
    }

    bootstrapApp();
  }, []);

  const refreshHistory = async () => {
    const response = await apiRequest("/api/history");
    if (response.ok) {
      setUserHistory(response.history);
    }
    return response;
  };

  const refreshAppointments = async () => {
    const response = await apiRequest("/api/appointments");
    if (response.ok) {
      setAppointments(response.appointments);
    }
    return response;
  };

  const refreshRecommendation = async () => {
    const response = await apiRequest("/api/recommendations");
    if (response.ok) {
      setDoctorRecommendation(response.doctor);
    }
    return response;
  };

  const refreshAdminOverview = async () => {
    const response = await apiRequest("/api/admin/overview");
    if (response.ok) {
      setAdminOverview(response);
    }
    return response;
  };

  const register = async ({ name, email, password }) =>
    apiRequest("/api/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

  const verifyEmail = async ({ email, otp }) => {
    const response = await apiRequest("/api/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });

    if (response.ok) {
      setCurrentUser(response.user);
      await Promise.all([refreshHistory(), refreshAppointments(), refreshRecommendation()]);
      if (response.user.role === "admin") {
        await refreshAdminOverview();
      }
    }

    return response;
  };

  const resendVerification = async (email) =>
    apiRequest("/api/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

  const login = async ({ email, password }) => {
    const response = await apiRequest("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      setCurrentUser(response.user);
      await Promise.all([refreshHistory(), refreshAppointments(), refreshRecommendation()]);
      if (response.user.role === "admin") {
        await refreshAdminOverview();
      } else {
        setAdminOverview(null);
      }
    }

    return response;
  };

  const logout = async () => {
    const response = await apiRequest("/api/logout", { method: "POST" });
    setCurrentUser(null);
    setUserHistory([]);
    setAppointments([]);
    setDoctorRecommendation(null);
    setAdminOverview(null);
    return response;
  };

  const forgotPassword = async (email) =>
    apiRequest("/api/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

  const resetPassword = async ({ email, otp, password }) =>
    apiRequest("/api/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, password }),
    });

  const createPrediction = async (selectedSymptoms) => {
    const response = await apiRequest("/api/predict", {
      method: "POST",
      body: JSON.stringify({ symptoms: selectedSymptoms }),
    });

    if (response.ok) {
      setUserHistory((prev) => [response.prediction, ...prev]);
      setDoctorRecommendation(response.recommendation);
    }

    return response;
  };

  const createAppointment = async (payload) => {
    const response = await apiRequest("/api/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setAppointments((prev) => [...prev, response.appointment].sort((a, b) =>
        a.appointmentDate.localeCompare(b.appointmentDate)
      ));
    }

    return response;
  };

  const askAiAssistant = async (messages) => {
    const response = await apiRequest("/api/ai-chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });

    if (response.ok) {
      setAiModel(response.model);
    }

    return response;
  };

  const value = {
    currentUser,
    userHistory,
    appointments,
    symptomCatalog,
    doctorRecommendation,
    adminOverview,
    aiModel,
    isReady,
    register,
    verifyEmail,
    resendVerification,
    login,
    logout,
    forgotPassword,
    resetPassword,
    createPrediction,
    createAppointment,
    askAiAssistant,
    refreshHistory,
    refreshAppointments,
    refreshRecommendation,
    refreshAdminOverview,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider.");
  }
  return context;
}
