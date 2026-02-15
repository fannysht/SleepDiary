// Page de création de compte
import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import "../../styles/Account/createAccount.css";
import StarryBackground from "../../components/StarryBackground";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { fr } from "date-fns/locale";
import { format } from "date-fns";
import { authAPI } from "../../services/api";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Gestion de la validité des données du form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }

    if (!formData.birthDate.trim()) {
      newErrors.birthDate = "La date de naissance est requise";
    } else {
      const date = new Date(formData.birthDate);
      const today = new Date();

      if (isNaN(date.getTime())) {
        newErrors.birthDate = "Date de naissance invalide";
      } else if (date > today) {
        newErrors.birthDate =
          "La date de naissance ne peut pas être dans le futur";
      }
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 8) {
      newErrors.password = "Minimum 8 caractères";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Doit contenir majuscule, minuscule et chiffre";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirmez votre mot de passe";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (!acceptTerms) {
      newErrors.terms = "Vous devez accepter les conditions";
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
        const response = await authAPI.register(formData);

        const data = response.data;

        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        window.location.href = "/";
      } catch (error) {
        console.error("Erreur de création de compte :", error);

        if (error.response) {
          setErrors({
            submit:
              error.response.data.message ||
              "Erreur lors de la création du compte",
          });
        } else {
          setErrors({ submit: "Erreur de connexion au serveur" });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Gestion de la force du mot de passe
  const getPasswordStrength = () => {
    const pwd = formData.password;
    if (!pwd) return { text: "", color: "", width: "0%" };

    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength <= 2)
      return { text: "Faible", color: "#e74c3c", width: "33%" };
    if (strength <= 3) return { text: "Moyen", color: "#f39c12", width: "66%" };
    return { text: "Fort", color: "#27ae60", width: "100%" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="signup-page">
      <StarryBackground />

      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100 py-5">
          <div className="col-12 col-sm-11 col-md-10 col-lg-8 col-xl-7">
            <div className="card signup-card shadow-lg">
              <div className="card-body p-4 p-md-5">
                {/* Boutton de retour */}
                <button
                  className="btn btn-back mb-4"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft size={16} />
                  <span className="ms-2">Retour à la connexion</span>
                </button>

                {/* Header */}
                <div className="text-center mb-4">
                  <h1 className="h2 fw-bold text-primary-dark mb-0">
                    Créer un compte
                  </h1>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label
                        htmlFor="firstName"
                        className="form-label text-primary-dark fw-semibold"
                      >
                        Prénom
                      </label>
                      <div className="input-group input-group-custom">
                        <span className="input-group-text bg-transparent border-end-0">
                          <User size={20} className="text-svg-50" />
                        </span>
                        <input
                          type="text"
                          className={`form-control form-control-custom border-start-0 ps-2 ${
                            errors.firstName ? "is-invalid" : ""
                          }`}
                          id="firstName"
                          placeholder="Jean"
                          value={formData.firstName}
                          onChange={(e) =>
                            handleInputChange("firstName", e.target.value)
                          }
                        />
                      </div>
                      {errors.firstName && (
                        <div className="alert alert-danger d-flex align-items-center mt-2 py-2 px-3">
                          <AlertCircle
                            size={14}
                            className="flex-shrink-0 me-2"
                          />
                          <small>{errors.firstName}</small>
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label
                        htmlFor="lastName"
                        className="form-label text-primary-dark fw-semibold"
                      >
                        Nom
                      </label>
                      <div className="input-group input-group-custom">
                        <span className="input-group-text bg-transparent border-end-0">
                          <User size={20} className="text-svg-50" />
                        </span>
                        <input
                          type="text"
                          className={`form-control form-control-custom border-start-0 ps-2 ${
                            errors.lastName ? "is-invalid" : ""
                          }`}
                          id="lastName"
                          placeholder="Dupont"
                          value={formData.lastName}
                          onChange={(e) =>
                            handleInputChange("lastName", e.target.value)
                          }
                        />
                      </div>
                      {errors.lastName && (
                        <div className="alert alert-danger d-flex align-items-center mt-2 py-2 px-3">
                          <AlertCircle
                            size={14}
                            className="flex-shrink-0 me-2"
                          />
                          <small>{errors.lastName}</small>
                        </div>
                      )}
                    </div>
                  </div>

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
                        className={`form-control form-control-custom border-start-0 ps-2 ${
                          errors.email ? "is-invalid" : ""
                        }`}
                        id="email"
                        placeholder="votre@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                      />
                    </div>
                    {errors.email && (
                      <div className="alert alert-danger d-flex align-items-center mt-2 py-2 px-3">
                        <AlertCircle size={14} className="flex-shrink-0 me-2" />
                        <small>{errors.email}</small>
                      </div>
                    )}
                  </div>

                  {/* Date de naissance */}
                  <div className="mb-4">
                    <label
                      htmlFor="birthDate"
                      className="form-label text-primary-dark fw-semibold"
                    >
                      Date de naissance
                    </label>
                    <div className="input-group input-group-custom">
                      <span className="input-group-text bg-transparent border-end-0">
                        <Calendar size={20} className="text-svg-50" />
                      </span>
                      <DatePicker
                        id="birthDate"
                        selected={
                          formData.birthDate
                            ? new Date(formData.birthDate)
                            : null
                        }
                        onChange={(date) => {
                          const formattedDate = date
                            ? format(date, "yyyy-MM-dd")
                            : "";
                          handleInputChange("birthDate", formattedDate);
                        }}
                        dateFormat="dd/MM/yyyy"
                        locale={fr}
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={100}
                        maxDate={new Date()}
                        placeholderText="JJ/MM/AAAA"
                        className={`form-control form-control-custom border-start-0 ps-2 ${
                          errors.birthDate ? "is-invalid" : ""
                        }`}
                        wrapperClassName="date-picker-wrapper"
                        popperPlacement="bottom-start"
                      />
                    </div>
                    {errors.birthDate && (
                      <div className="alert alert-danger d-flex align-items-center mt-2 py-2 px-3">
                        <AlertCircle size={14} className="flex-shrink-0 me-2" />
                        <small>{errors.birthDate}</small>
                      </div>
                    )}
                  </div>

                  {/* Mot de passe */}
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
                        className={`form-control form-control-custom border-start-0 border-end-0 ps-2 ${
                          errors.password ? "is-invalid" : ""
                        }`}
                        id="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
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
                    {formData.password && (
                      <div className="password-strength mt-2">
                        <div className="progress" style={{ height: "4px" }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: passwordStrength.width,
                              backgroundColor: passwordStrength.color,
                            }}
                            aria-valuenow={parseInt(passwordStrength.width)}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <small
                          className="d-block mt-1 fw-semibold"
                          style={{ color: passwordStrength.color }}
                        >
                          {passwordStrength.text}
                        </small>
                      </div>
                    )}
                    {errors.password && (
                      <div className="alert alert-danger d-flex align-items-center mt-2 py-2 px-3">
                        <AlertCircle size={14} className="flex-shrink-0 me-2" />
                        <small>{errors.password}</small>
                      </div>
                    )}
                  </div>

                  {/* Confirmation Mot de passe */}
                  <div className="mb-4">
                    <label
                      htmlFor="confirmPassword"
                      className="form-label text-primary-dark fw-semibold"
                    >
                      Confirmer le mot de passe
                    </label>
                    <div className="input-group input-group-custom">
                      <span className="input-group-text bg-transparent border-end-0">
                        <Lock size={20} className="text-svg-50" />
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className={`form-control form-control-custom border-start-0 border-end-0 ps-2 ${
                          errors.confirmPassword ? "is-invalid" : ""
                        }`}
                        id="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-toggle-password"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword &&
                      formData.password === formData.confirmPassword && (
                        <div className="alert alert-success d-flex align-items-center mt-2 py-2 px-3">
                          <CheckCircle
                            size={14}
                            className="flex-shrink-0 me-2"
                          />
                          <small>Les mots de passe correspondent</small>
                        </div>
                      )}
                    {errors.confirmPassword && (
                      <div className="alert alert-danger d-flex align-items-center mt-2 py-2 px-3">
                        <AlertCircle size={14} className="flex-shrink-0 me-2" />
                        <small>{errors.confirmPassword}</small>
                      </div>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="mb-4">
                    <div className="form-check-terms">
                      <input
                        className="form-check-input-terms"
                        type="checkbox"
                        id="acceptTerms"
                        checked={acceptTerms}
                        onChange={(e) => {
                          setAcceptTerms(e.target.checked);
                          if (errors.terms) {
                            setErrors((prev) => ({ ...prev, terms: "" }));
                          }
                        }}
                      />
                      <label
                        className="form-check-label text-primary-dark"
                        htmlFor="acceptTerms"
                      >
                        J'accepte les{" "}
                        <a
                          href="#"
                          className="text-primary text-decoration-underline"
                        >
                          conditions d'utilisation
                        </a>{" "}
                        et la{" "}
                        <a
                          href="#"
                          className="text-primary text-decoration-underline"
                        >
                          politique de confidentialité
                        </a>
                      </label>
                    </div>
                    {errors.terms && (
                      <div className="alert alert-danger d-flex align-items-center mt-2 py-2 px-3 ms-4">
                        <AlertCircle size={14} className="flex-shrink-0 me-2" />
                        <small>{errors.terms}</small>
                      </div>
                    )}
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
                        <span>Créer mon compte</span>
                        <CheckCircle size={20} />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="divider-custom my-4">
                  <hr className="flex-grow-1" />
                  <hr className="flex-grow-1" />
                </div>

                {/* Login Lien */}
                <p className="text-center text-primary-dark mb-0">
                  Vous avez déjà un compte ?{" "}
                  <a
                    href="/login"
                    className="text-primary-dark text-decoration-none signup-link"
                  >
                    Se connecter
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
