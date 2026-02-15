import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./styles/theme.css";
import "./styles/navbar.css";

/* // Pages d'erreur
import NotFound from "./components/errors_pages/NotFound";
import ServerError from "./components/errors_pages/ServerError";
import Indispo from "./components/errors_pages/Indispo"; */

import ProtectedRoute from "./components/protectedRoute";
import Layout from "./components/appLayout";

import ScrollToTop from "./components/scrollToTop";
import FormSleep from "./components/sleepForm";
import Stats from "./components/statistics";
import Timeline from "./components/timeline";

import Login from "./pages/Account/login";
import ChangePwd from "./pages/Account/changePassword";
import ResetPassword from "./pages/Account/resetPassword";
import CreateAccount from "./pages/Account/createAccount";
import Home from "./pages/Home/homePage";

export default function App() {
  const siteIndispo = false;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Si le site est indisponible, toutes les routes redirigent vers /indisponible */}
          {siteIndispo && (
            <Route path="*" element={<Navigate to="/indisponible" replace />} />
          )}
          {/* Redirection racine */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {!siteIndispo && (
            <>
              {/* Routes publiques */}
              <Route path="/login" element={<Login />} />
              <Route path="/changePassword" element={<ChangePwd />} />
              <Route path="/createAccount" element={<CreateAccount />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/home" element={<Home />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute user={user}>
                    <Layout user={user} onLogout={handleLogout} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="home" element={<Home />} />
                <Route path="timeline" element={<Timeline />} />
                <Route path="statistiques" element={<Stats />} />
                <Route path="sleep-form" element={<FormSleep />} />

                <Route path="*" element={<Navigate to="/home" replace />} />
              </Route>
            </>
          )}

          {/* Pages d'erreur et indisponibilité */}
          {/* <Route path="/server-error" element={<ServerError />} />
          <Route path="/indisponible" element={<Indispo />} />
          <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </Router>
    </div>
  );
}
