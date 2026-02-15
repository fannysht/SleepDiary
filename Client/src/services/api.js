import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Configuration de l'instance Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// INTERCEPTEURS

// Ajoute le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Gère les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si l'erreur est une 401, le token est invalide ou expiré
    if (error.response && error.response.status === 401) {
      console.warn("🔒 Token invalide ou expiré, déconnexion...");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

// Vérifie si l'utilisateur est authentifié
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  return !!token;
};

export const authAPI = {
  // Connexion utilisateur
  login: (credentials) => api.post("/auth/login", credentials),

  // Inscription d'un nouvel utilisateur
  register: (userData) => api.post("/auth/register", userData),

  // Vérifier la validité du token
  verify: () => api.get("/auth/verify"),

  // Récupérer les informations du profil
  getMe: () => api.get("/auth/me"),

  // Déconnexion
  logout: () => api.post("/auth/logout"),

  // Vérification de l'OTP
  verifyCode: (email, code) => api.post("/auth/verify-code", { email, code }),

  // Envoie de l'email pour le changement de mot de passe
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),

  // Changement de mot de passe
  updatePassword: (email, code, newPassword) =>
    api.post("/auth/password", { email, code, newPassword }),
};

export const sleepAPI = {
  // Récupérer le statut actuel de l'utilisateur
  getCurrentStatus: () => api.get("/sleep/status"),

  // Mettre à jour le statut de l'utilisateur
  updateStatus: (status) => api.put("/sleep/status", { status }),

  // Récupérer toutes les entrées de sommeil
  getEntries: (startDate, endDate) => {
    const params = {};
    if (startDate) params.sleep_period_start = startDate;
    if (endDate) params.sleep_period_end = endDate;
    return api.get("/sleep", { params });
  },

  // Récupérer une entrée par ID
  getEntry: (id) => api.get(`/sleep/${id}`),

  // Récupérer l'entrée d'une date spécifique
  getEntryByDate: (date) => api.get(`/sleep/date/${date}`),

  // Créer une nouvelle entrée de sommeil
  createEntry: (data) => api.post("/sleep", data),

  // Mettre à jour une entrée existante
  updateEntry: (id, data) => api.put(`/sleep/${id}`, data),

  // Supprimer une entrée
  deleteEntry: (id) => api.delete(`/sleep/${id}`),
};

export const statsAPI = {
  // Récupérer les statistiques générales de sommeil
  getStats: (startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return api.get("/stats", { params });
  },

  // Récupérer les statistiques Garmin globales
  getGarminStats: (startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return api.get("/stats/garmin", { params });
  },
};

export default api;
