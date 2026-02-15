// Page de changement de mot de passe

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, Send, CheckCircle, ShieldCheck } from "lucide-react";
import StarryBackground from "../../components/StarryBackground";
import { authAPI } from "../../services/api";
import "../../styles/Account/changePwd.css";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Demander l'envoi du code otp
  const handleSubmit = async () => {
    if (!email) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await authAPI.forgotPassword(email);
      if (response.data.status === "success") {
        setIsSubmitted(true);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Une erreur est survenue");
      console.error("Erreur envoi :", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verification du code otp
  const handleVerifyOTP = async () => {
    if (otp.length !== 5) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await authAPI.verifyCode(email, otp);
      if (response.data.status === "success") {
        navigate("/reset-password", { state: { email, code: otp } });
      }
    } catch (error) {
      setError(error.response?.data?.message || "Code invalide");
    } finally {
      setIsLoading(false);
    }
  };

  // Validation du formulaire lors du clique sur 'Enter'
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      isSubmitted ? handleVerifyOTP() : handleSubmit();
    }
  };

  // Retour à la page précedente
  const handleBackToLogin = () => {
    navigate(-1);
  };

  return (
    <div className="forgot-password-page min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden">
      <StarryBackground />

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
            <div className="card forgot-card shadow-lg border-0">
              <div className="card-body p-4 p-md-5">
                {/* Bouton retour */}
                <button
                  className="btn btn-back d-inline-flex align-items-center gap-2 mb-4 p-0"
                  onClick={handleBackToLogin}
                >
                  <ArrowLeft size={16} />
                  <span>Retour</span>
                </button>

                {/* Message d'erreur */}
                {error && (
                  <div
                    className="alert alert-danger d-flex align-items-center mb-4"
                    role="alert"
                  >
                    <div>{error}</div>
                  </div>
                )}

                {!isSubmitted ? (
                  <>
                    {/* Header */}
                    <div className="text-center mb-4">
                      <h2 className="h2 fw-bold text-primary-dark mb-3">
                        Mot de passe oublié ?
                      </h2>
                      <p className="text-muted-custom mb-0">
                        Pas de problème. Entrez votre adresse email et nous vous
                        enverrons un code de récupération.
                      </p>
                    </div>

                    {/* Formulaire email */}
                    <div className="mb-4">
                      <label
                        htmlFor="email"
                        className="form-label fw-semibold text-primary-dark"
                      >
                        Email
                      </label>
                      <div className="input-group input-group-custom">
                        <span className="input-group-text">
                          <Mail size={20} />
                        </span>
                        <input
                          type="email"
                          id="email"
                          className="form-control form-control-custom"
                          placeholder="votre@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyPress={handleKeyPress}
                        />
                      </div>
                    </div>

                    {/* Bouton d'envoi */}
                    <button
                      className="btn btn-primary-custom w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                      onClick={handleSubmit}
                      disabled={isLoading || !email}
                    >
                      {isLoading ? (
                        <div
                          className="spinner-border spinner-border-sm text-light"
                          role="status"
                        >
                          <span className="visually-hidden">Chargement...</span>
                        </div>
                      ) : (
                        <>
                          <span>Envoyer le code</span>
                          <Send size={20} />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {/* En-tête succès */}
                    <div className="text-center mb-4">
                      <div className="d-flex justify-content-center mb-3">
                        <div className="success-icon-container">
                          <CheckCircle size={32} />
                        </div>
                      </div>
                      <h2 className="h2 fw-bold text-primary-dark mb-3">
                        Code envoyé !
                      </h2>
                      <p className="text-muted-custom mb-2">
                        Un code de validation a été envoyé à
                      </p>
                      <p className="fw-bold text-primary email-sent">{email}</p>
                    </div>

                    {/* Champ OTP */}
                    <div className="mb-4">
                      <label className="form-label fw-semibold text-primary-dark text-center d-block">
                        Entrez le code à 5 chiffres
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg text-center fs-3 letter-spacing-wide"
                        placeholder="· · · · ·"
                        maxLength={5}
                        inputMode="numeric"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ""))
                        }
                        onKeyPress={handleKeyPress}
                        autoFocus
                        style={{
                          backgroundColor: "#f8fafc",
                          border: "2px solid #e2e8f0",
                          borderRadius: "0.5rem",
                          letterSpacing: "0.5em",
                          padding: "1rem",
                        }}
                      />
                      <p className="text-muted-custom text-center mt-2 small">
                        Valide pendant 15 minutes.
                      </p>
                    </div>

                    {/* Bouton de validation */}
                    <button
                      className="btn btn-primary-custom w-100 py-3 d-flex align-items-center justify-content-center gap-2 mb-3"
                      onClick={handleVerifyOTP}
                      disabled={isLoading || otp.length !== 5}
                    >
                      {isLoading ? (
                        <div
                          className="spinner-border spinner-border-sm text-light"
                          role="status"
                        >
                          <span className="visually-hidden">Chargement...</span>
                        </div>
                      ) : (
                        <>
                          <span>Valider le code</span>
                          <ShieldCheck size={20} />
                        </>
                      )}
                    </button>

                    {/* Info réessayer */}
                    <div className="alert alert-info-custom d-flex align-items-center justify-content-center">
                      <p className="mb-0 small">
                        Email non reçu ?{" "}
                        <a
                          href="#"
                          className="text-decoration-none fw-semibold"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsSubmitted(false);
                            setOtp("");
                          }}
                        >
                          Réessayer
                        </a>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
