// Page de connexion
import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";
import StarryBackground from "../../components/StarryBackground";
import "../../styles/Account/login.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ email: "", password: "" });

  // Validité du form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim() || !formData.password) {
      newErrors.email = "Email ou mot de passe incorrect";
    }
    return newErrors;
  };

  // Gestion de la soumission du form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const response = await authAPI.login(formData);
        const data = response.data;

        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        navigate("/Home");
      } catch (error) {
        console.error("Erreur de connexion :", error);

        if (error.response) {
          const { status, data } = error.response;

          if (status === 429) {
            setErrors({
              submit:
                data.message ||
                "Trop de tentatives. Veuillez réessayer plus tard.",
            });
          } else if (status === 401) {
            setErrors({
              submit: "Email ou mot de passe incorrect",
            });
          } else {
            setErrors({
              submit: data.message || "Une erreur est survenue",
            });
          }
        } else if (error.request) {
          setErrors({
            submit:
              "Impossible de contacter le serveur. Vérifiez votre connexion.",
          });
        } else {
          setErrors({
            submit: "Une erreur inattendue s'est produite",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="login-page min-vh-100 d-flex align-items-center justify-content-center position-relative">
      <StarryBackground />
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100 py-5">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
            <div className="card login-card shadow-lg">
              <div className="card-body p-4 p-md-5">
                {/* Header */}
                <div className="text-center mb-4 mb-md-5">
                  <h1 className="display-5 fw-bold text-primary-dark mb-2">
                    Bienvenue
                  </h1>
                  <p className="text-muted-custom mb-0">
                    Connectez-vous pour continuer
                  </p>
                </div>
                {errors.submit && (
                  <div className="error-banner">
                    <AlertCircle size={18} />
                    <div>
                      <p>{errors.submit}</p>
                    </div>
                  </div>
                )}
                {/* Form */}
                <form onSubmit={handleSubmit}>
                  {/* Email */}
                  <div className="mb-4">
                    <label
                      htmlFor="email"
                      className="form-label text-primary-dark fw-semibold"
                    >
                      Email
                    </label>
                    <div className="input-group input-group-custom">
                      <span className="input-group-text bg-transparent border-end-0">
                        <Mail size={20} className="text-svg-50" />
                      </span>
                      <input
                        type="email"
                        className="form-control form-control-custom border-start-0 ps-2"
                        id="email"
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        aria-describedby="emailError"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="form-label text-primary-dark fw-semibold"
                    >
                      Mot de passe
                    </label>
                    <div className="input-group input-group-custom">
                      <span className="input-group-text bg-transparent border-end-0">
                        <Lock size={20} className="text-svg-50" />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control form-control-custom border-start-0 border-end-0 ps-2"
                        id="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        aria-describedby="passwordError"
                      />
                      <button
                        type="button"
                        className="btn btn-toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                    {errors.email && (
                      <div
                        className="alert alert-danger d-flex align-items-center mt-3 py-2 px-3"
                        role="alert"
                        id="emailError"
                      >
                        <AlertCircle size={16} className="flex-shrink-0 me-2" />
                        <small>{errors.email}</small>
                      </div>
                    )}
                  </div>

                  {/* Remember & Forgot */}
                  <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="rememberMe"
                      />
                      <label
                        className="form-check-label text-primary-dark"
                        htmlFor="rememberMe"
                      >
                        Se souvenir
                      </label>
                    </div>
                    <a
                      href="/changePassword"
                      className="text-primary-dark text-decoration-none forgot-link"
                    >
                      Mot de passe oublié ?
                    </a>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary-custom w-100 d-flex align-items-center justify-content-center gap-2 py-3"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      >
                        <span className="visually-hidden">Chargement...</span>
                      </div>
                    ) : (
                      <>
                        <span>Se connecter</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="divider-custom my-4">
                  <hr className="flex-grow-1" />
                  <hr className="flex-grow-1" />
                </div>

                {/* Signup Lien */}
                <p className="text-center text-primary-dark mb-0">
                  <a
                    href="/createAccount"
                    className="text-primary-dark text-decoration-none signup-link"
                  >
                    Pas encore de compte ?{" "}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
