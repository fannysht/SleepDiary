// Protection des routes, accès securisé avec authent

import React, { useEffect, useState } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { Loader } from "lucide-react";
import api, { isAuthenticated } from "../services/api";

export default function ProtectedRoute({ children }) {
  const [isValid, setIsValid] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      // Vérifier si un token existe
      if (!isAuthenticated()) {
        setIsValid(false);
        setIsLoading(false);
        return;
      }

      try {
        // Vérifier la validité du token auprès du serveur
        const response = await api.get("/auth/me");

        if (response.data.success) {
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (error) {
        console.error("Erreur vérification auth:", error);
        setIsValid(false);

        // Nettoyer le localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [location.pathname]);

  // Affichage du loader pendant la vérification
  if (isLoading) {
    return (
      <div className="auth-loading-container">
        <Loader className="loading-spinner" size={40} />
        <p>Vérification de l'authentification...</p>
      </div>
    );
  }

  // Rediriger vers login si non authentifié
  if (!isValid) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}
