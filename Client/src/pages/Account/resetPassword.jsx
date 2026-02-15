// Page de réinitialisation du mot de passe

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { authAPI } from "../../services/api";
import StarryBackground from "../../components/StarryBackground";
import "../../styles/Account/resetPassword.css";

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Recuperation des infos de l'étape précédente
  const { email, code } = location.state || {};

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Validation de la conformité du mot de passe
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setError("Les mots de passe ne correspondent pas.");
    }
    if (passwordData.newPassword.length < 8) {
      return setError("Le mot de passe doit faire au moins 8 caractères.");
    }

    setIsLoading(true);
    setError("");

    try {
      const newPassword = passwordData.newPassword;
      const response = await authAPI.updatePassword(email, code, newPassword);

      if (response.data.status === "success") {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  // Validation du formulaire lors du clique sur 'Enter'
  const handleKeyPress = (e) => {
    if (
      e.key === "Enter" &&
      passwordData.newPassword &&
      passwordData.confirmPassword
    ) {
      handlePasswordChange();
    }
  };

  // Gestion de l'accès
  if (!email || !code) {
    return (
      <div className="reset-password-page min-vh-100 d-flex align-items-center justify-content-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="alert alert-danger text-center">
                <AlertCircle size={24} className="mb-2" />
                <p className="mb-0">Accès non autorisé.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden">
      <StarryBackground />

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
            <div className="card reset-card shadow-lg border-0">
              <div className="card-body p-4 p-md-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="d-flex justify-content-center mb-3">
                    <div className="icon-container-primary">
                      <Lock size={32} />
                    </div>
                  </div>
                  <h2 className="h2 fw-bold text-primary-dark mb-3">
                    Nouveau mot de passe
                  </h2>
                  <p className="text-muted-custom mb-0">
                    Choisissez un mot de passe robuste pour sécuriser votre
                    compte.
                  </p>
                </div>

                {/* Message d'erreur */}
                {error && (
                  <div
                    className="alert alert-danger d-flex align-items-start gap-2 mb-4"
                    role="alert"
                  >
                    <AlertCircle size={18} className="flex-shrink-0 mt-1" />
                    <div>{error}</div>
                  </div>
                )}

                {/* Formulaire */}
                <div className="mb-4">
                  {/* Nouveau mot de passe */}
                  <div className="mb-3">
                    <label
                      htmlFor="newPassword"
                      className="form-label fw-semibold text-primary-dark"
                    >
                      Nouveau mot de passe
                    </label>
                    <div className="input-group input-group-password">
                      <span className="input-group-text bg-transparent border-end-0">
                        <Lock size={18} />
                      </span>
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        id="newPassword"
                        className="form-control form-control-password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="input-group-text bg-transparent border-start-0 btn-toggle-password"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            new: !showPasswords.new,
                          })
                        }
                      >
                        {showPasswords.new ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmer le mot de passe */}
                  <div className="mb-3">
                    <label
                      htmlFor="confirmPassword"
                      className="form-label fw-semibold text-primary-dark"
                    >
                      Confirmer le mot de passe
                    </label>
                    <div className="input-group input-group-password">
                      <span className="input-group-text bg-transparent border-end-0">
                        <Lock size={18} />
                      </span>
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        id="confirmPassword"
                        className="form-control form-control-password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        onKeyPress={handleKeyPress}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="input-group-text bg-transparent border-start-0 btn-toggle-password"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            confirm: !showPasswords.confirm,
                          })
                        }
                      >
                        {showPasswords.confirm ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="alert alert-info-custom mb-4">
                    <p className="mb-2 fw-semibold small">
                      <CheckCircle size={16} className="me-1" />
                      Le mot de passe doit contenir :
                    </p>
                    <ul className="mb-0 small ps-4">
                      <li>Au moins 8 caractères</li>
                      <li>Une majuscule et un chiffre</li>
                    </ul>
                  </div>

                  {/* Bouton de validation */}
                  <button
                    className="btn btn-primary-custom w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                    onClick={handlePasswordChange}
                    disabled={
                      isLoading ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
                  >
                    {isLoading ? (
                      <div
                        className="spinner-border spinner-border-sm text-light"
                        role="status"
                      >
                        <span className="visually-hidden">Chargement...</span>
                      </div>
                    ) : (
                      "Réinitialiser le mot de passe"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
