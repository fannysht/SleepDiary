// Home page
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Button, Alert, Badge } from "react-bootstrap";
import {
  FiMoon,
  FiSun,
  FiClock,
  FiEdit3,
  FiBarChart2,
  FiHome,
} from "react-icons/fi";
import { LogOut } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/home.css";

import SleepForm from "../../components/sleepForm";
import Timeline from "../../components/timeline";
import Statistics from "../../components/statistics";
import GraphPage from "../../components/graphPage";
import { sleepAPI, isAuthenticated } from "../../services/api";

export default function Home() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [todayEntry, setTodayEntry] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("AWAKE");

  const [activePage, setActivePage] = useState("home");
  const navigate = useNavigate();

  // Gestion du format de la date
  const getSmartDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getInitialEntryData = (baseData = null) => {
    const smartDate = getSmartDate();
    return {
      date: smartDate,
      lights_off_time: null,
      sleep_period_start: null,
      sleep_period_end: null,
      wake_time: null,
      get_up_time: null,
      sleep_quality: null,
      sleep_latency: null,
      night_awakenings: null,
      awakening_duration: null,
      naps: [],
      notes: "",
      action_log: [],
      entry_type: "main_sleep",
      ...baseData,
    };
  };

  // Log des actions
  const logAction = (entryData, actionType, statusChange = null) => {
    const now = new Date();
    const timestamp = now.toISOString();
    const action = {
      type: actionType,
      timestamp,
      time_display: now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      status_change: statusChange,
    };
    if (!entryData.action_log) entryData.action_log = [];
    entryData.action_log.push(action);
    return entryData;
  };

  const cleanEntryData = (data) => {
    const cleaned = { ...data };
    [
      "lights_off_time",
      "sleep_period_start",
      "sleep_period_end",
      "wake_time",
      "get_up_time",
    ].forEach((f) => {
      if (cleaned[f] === "") cleaned[f] = null;
    });
    [
      "sleep_quality",
      "sleep_latency",
      "night_awakenings",
      "awakening_duration",
    ].forEach((f) => {
      if (cleaned[f] === "" || cleaned[f] === undefined) cleaned[f] = null;
    });
    if (!cleaned.entry_type) cleaned.entry_type = "main_sleep";
    return cleaned;
  };

  const computeRealStatusFromEntries = (entries) => {
    if (!entries || entries.length === 0) return "AWAKE";

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes depuis minuit

    // Convertir "HH:MM" en minutes depuis minuit
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return null;
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    // Trouver les entrées actives (aujourd'hui ou en cours)
    const today = getSmartDate();
    const activeEntries = entries.filter((entry) => {
      if (!entry.date) return false;
      const entryDate = entry.date.split("T")[0];

      // Inclure l'entrée d'aujourd'hui
      if (entryDate === today) return true;

      // Inclure l'entrée d'hier si elle pourrait être en cours
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      if (
        entryDate === yesterdayStr &&
        entry.sleep_period_start &&
        !entry.sleep_period_end
      ) {
        return true;
      }

      return false;
    });

    // Vérifier chaque entrée active pour déterminer le statut
    for (const entry of activeEntries) {
      const sleepStart = timeToMinutes(entry.sleep_period_start);
      const sleepEnd = timeToMinutes(entry.sleep_period_end);
      const wakeTime = timeToMinutes(entry.wake_time);
      const lightsOff = timeToMinutes(entry.lights_off_time);

      // Si l'utilisateur est en période de sommeil actif
      if (sleepStart !== null && sleepEnd === null) {
        // Période de sommeil en cours, pas encore réveillé
        if (entry.entry_type === "voluntary_nap") {
          return "NAP_ONGOING";
        }
        return "SLEEPING";
      }

      // Si lumières éteintes mais pas encore endormi
      if (lightsOff !== null && sleepStart === null) {
        return "IN_BED";
      }

      // Si l'utilisateur s'est réveillé mais n'est pas encore levé
      if (wakeTime !== null && entry.get_up_time === null) {
        // Vérifier si c'est récent (dans les 2 dernières heures)
        const wakeMinutes = timeToMinutes(wakeTime);
        if (wakeMinutes !== null) {
          const timeSinceWake = currentTime - wakeMinutes;
          if (timeSinceWake >= 0 && timeSinceWake < 120) {
            // moins de 2h
            return "IN_BED"; // Encore au lit après réveil
          }
        }
      }
    }

    // Par défaut, l'utilisateur est réveillé
    return "AWAKE";
  };

  // Recuperation du status et des entrées
  const fetchStatusAndEntries = async () => {
    try {
      setLoading(true);
      const statusRes = await sleepAPI.getCurrentStatus();
      const entriesRes = await sleepAPI.getEntries();
      setEntries(entriesRes.data);

      // Calculer le statut réel basé sur les entrées
      const realStatus = computeRealStatusFromEntries(entriesRes.data);

      // Si le statut de la BDD diffère du statut calculé, synchroniser
      if (statusRes.data.current_status !== realStatus) {
        await sleepAPI.updateStatus(realStatus);
        setCurrentStatus(realStatus);
      } else {
        setCurrentStatus(statusRes.data.current_status);
      }

      return entriesRes.data;
    } catch (err) {
      console.error("Erreur fetchStatusAndEntries:", err);
      setError("Erreur lors de la synchronisation");
    } finally {
      setLoading(false);
    }
  };

  // Gestion du changement de status
  const handleStatusChange = async (newStatus) => {
    try {
      await sleepAPI.updateStatus(newStatus);
    } catch (err) {
      console.error("Erreur handleStatusChange:", err);
      setError("Erreur lors de la mise à jour du statut");
      setTimeout(() => setError(null), 3000);
      throw err;
    }
  };

  // Gestion de la déconnexion
  const handleLogout = async () => {
    try {
      // Supprimer les données utilisateur
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Rediriger vers la page login
      navigate("/login");
    } catch (err) {
      console.error("Erreur handleLogout:", err);
      setError("Erreur lors de la deconnexion");
    }
  };

  // Si l'user n'est pas connecté
  useEffect(() => {
    const token = isAuthenticated();
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchStatusAndEntries();
  }, []);

  useEffect(() => {
    if (entries.length > 0) {
      const smartDate = getSmartDate();
      const existing = entries.find((e) => e.date?.startsWith(smartDate));
      setTodayEntry(existing || null);
    }
  }, [entries]);

  // Vérifier périodiquement le statut et le synchroniser
  useEffect(() => {
    const interval = setInterval(() => {
      if (entries.length > 0) {
        const realStatus = computeRealStatusFromEntries(entries);
        if (realStatus !== currentStatus) {
          setCurrentStatus(realStatus);
          handleStatusChange(realStatus).catch((err) => {
            console.error("Erreur sync périodique:", err);
          });
        }
      }
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [entries, currentStatus]);

  // Handlers
  const handleQuickAction = async (action, previousStatus, newStatus) => {
    try {
      const freshEntries = await fetchStatusAndEntries();
      const now = new Date();
      const timeString = now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const smartDate = getSmartDate();

      const todayEntries = freshEntries.filter(
        (e) => e.date?.split("T")[0] === smartDate,
      );
      const existingMainSleep = todayEntries.find(
        (e) => e.entry_type === "main_sleep",
      );

      let entryData;
      let shouldUpdate = false;
      let entryToUpdate = null;

      switch (action) {
        case "lights_off":
        case "start_sleeping":
        case "wake_up":
          if (
            existingMainSleep &&
            !existingMainSleep.sleep_period_end &&
            existingMainSleep.entry_type !== "insomnia_up"
          ) {
            entryData = { ...existingMainSleep };
            shouldUpdate = true;
            entryToUpdate = existingMainSleep;
          } else if (
            existingMainSleep &&
            existingMainSleep.sleep_period_end &&
            existingMainSleep.entry_type !== "insomnia_up"
          ) {
            entryData = getInitialEntryData();
            entryData.entry_type = "voluntary_nap";
            entryData.voluntary_nap = true;
          } else {
            entryData = getInitialEntryData();
            entryData.entry_type = "main_sleep";
          }
          break;
        case "nap_start":
          entryData = getInitialEntryData();
          entryData.entry_type = "voluntary_nap";
          entryData.voluntary_nap = true;
          break;
        case "insomnia_up":
        case "full_entry":
          if (existingMainSleep) {
            entryData = { ...existingMainSleep };
            shouldUpdate = true;
            entryToUpdate = existingMainSleep;
          } else {
            entryData = getInitialEntryData();
            entryData.entry_type = "main_sleep";
          }
          break;
        default:
          entryData = getInitialEntryData();
      }

      switch (action) {
        case "lights_off":
          entryData.lights_off_time = timeString;
          entryData = logAction(
            entryData,
            "lights_off",
            `${previousStatus} -> ${newStatus}`,
          );
          const sleepTime = new Date(now.getTime() + 15 * 60000);
          entryData.sleep_period_start = sleepTime.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          break;
        case "start_sleeping":
          entryData.sleep_period_start = timeString;
          entryData = logAction(
            entryData,
            "start_sleeping",
            `${previousStatus} -> ${newStatus}`,
          );
          break;
        case "wake_up":
          entryData.wake_time = timeString;
          entryData.sleep_period_end = timeString;
          entryData = logAction(
            entryData,
            "wake_up",
            `${previousStatus} -> ${newStatus}`,
          );
          break;
        case "insomnia_up":
          entryData = logAction(
            entryData,
            "insomnia_up",
            `${previousStatus} -> ${newStatus}`,
          );
          setEditingEntry(entryData);
          setShowForm(true);
          return;
        case "nap_start":
          entryData.sleep_period_start = timeString;
          entryData = logAction(
            entryData,
            "nap_start",
            `${previousStatus} -> ${newStatus}`,
          );
          setEditingEntry(entryData);
          setShowForm(true);
          return;
        case "full_entry":
          setEditingEntry(entryData);
          setShowForm(true);
          return;
      }

      const cleanedData = cleanEntryData(entryData);

      if (shouldUpdate && entryToUpdate && entryToUpdate.id) {
        await sleepAPI.updateEntry(entryToUpdate.id, cleanedData);
      } else {
        const { id, created_at, updated_at, ...dataWithoutId } = cleanedData;
        await sleepAPI.createEntry(dataWithoutId);
      }

      const actionLabels = {
        lights_off: "Extinction lumières",
        start_sleeping: "Endormissement",
        wake_up: "Réveil",
      };
      setSuccess(
        `✓ ${actionLabels[action] || "Action"} enregistré${shouldUpdate ? " (mise à jour)" : ""} à ${timeString}`,
      );
      await fetchStatusAndEntries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Erreur handleQuickAction:", err);
      if (err.response?.status === 409) {
        setError("Erreur: Une entrée principale existe déjà.");
      } else {
        setError("Erreur lors de l'enregistrement rapide");
      }
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const isEditing = editingEntry && editingEntry.id;
      if (isEditing) {
        await sleepAPI.updateEntry(editingEntry.id, formData);
        setSuccess("✓ Entrée mise à jour avec succès");
      } else {
        await sleepAPI.createEntry(formData);
        setSuccess("✓ Entrée créée avec succès");
      }
      setShowForm(false);
      setEditingEntry(null);
      await fetchStatusAndEntries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Erreur handleSubmit:", err);
      if (err.response?.status === 409) {
        setError("Une entrée de ce type existe déjà pour cette date");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Erreur lors de l'enregistrement");
      }
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEntry(null);
  };

  const handleDelete = async (id) => {
    try {
      await sleepAPI.deleteEntry(id);
      await fetchStatusAndEntries(); // Synchroniser le statut
      setShowForm(false);
      setEditingEntry(null);
      setSuccess("✓ Entrée supprimée avec succès");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setError("Erreur lors de la suppression");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleNewEntry = () => {
    const smartDate = getSmartDate();
    const existingMainSleep = entries.find(
      (e) => e.date?.startsWith(smartDate) && e.entry_type === "main_sleep",
    );
    if (existingMainSleep) {
      setEditingEntry(getInitialEntryData());
      setSuccess("Création d'une nouvelle entrée");
      setTimeout(() => setSuccess(null), 2000);
    } else {
      const existingEntry = entries.find((e) => e.date?.startsWith(smartDate));
      setEditingEntry(existingEntry ? existingEntry : getInitialEntryData());
      if (existingEntry) {
        setSuccess("Continuation de l'entrée en cours");
        setTimeout(() => setSuccess(null), 2000);
      }
    }
    setShowForm(true);
  };

  const QuickActions = ({ onAction, currentEntry }) => (
    <div className="quick-actions-card fade-in-up mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        {/* Statut visuel */}
        <Badge
          bg={
            currentStatus === "SLEEPING" || currentStatus === "NAP_ONGOING"
              ? "primary"
              : currentStatus === "IN_BED"
                ? "warning"
                : "secondary"
          }
          className="status-badge"
        >
          {currentStatus === "SLEEPING" && "💤 En sommeil"}
          {currentStatus === "NAP_ONGOING" && "😴 Sieste"}
          {currentStatus === "IN_BED" && "🛏️ Au lit"}
          {currentStatus === "AWAKE" && "☀️ Éveillé"}
        </Badge>
      </div>
      <div className="d-flex flex-wrap gap-2">
        {currentStatus === "AWAKE" && (
          <Button
            variant="night"
            onClick={async () => {
              setCurrentStatus("IN_BED");
              handleStatusChange("IN_BED").catch(() =>
                setCurrentStatus("AWAKE"),
              );
              handleQuickAction("lights_off", "AWAKE", "IN_BED");
            }}
          >
            <FiMoon className="me-2" /> J'éteins la lumière
          </Button>
        )}

        {currentStatus === "IN_BED" && (
          <>
            <Button
              variant="success"
              onClick={async () => {
                setCurrentStatus("SLEEPING");
                handleStatusChange("SLEEPING").catch(() =>
                  setCurrentStatus("IN_BED"),
                );
                handleQuickAction("start_sleeping", "IN_BED", "SLEEPING");
              }}
            >
              ✨ Je sens que je m'endors
            </Button>
            <Button
              variant="warning"
              onClick={async () => {
                setCurrentStatus("AWAKE");
                handleStatusChange("AWAKE").catch(() =>
                  setCurrentStatus("IN_BED"),
                );
                handleQuickAction("insomnia_up", "IN_BED", "AWAKE");
              }}
            >
              😫 Je n'y arrive pas (se lever)
            </Button>
          </>
        )}

        {(currentStatus === "SLEEPING" || currentStatus === "NAP_ONGOING") && (
          <Button
            variant="sun"
            onClick={async () => {
              const prevStatus = currentStatus;
              setCurrentStatus("AWAKE");
              handleStatusChange("AWAKE").catch(() =>
                setCurrentStatus(prevStatus),
              );
              handleQuickAction("wake_up", currentStatus, "AWAKE");
            }}
          >
            <FiSun className="me-2" /> Je me lève / Réveil
          </Button>
        )}

        <Button variant="outline-primary" onClick={handleNewEntry}>
          <FiEdit3 className="me-2" /> Entrée complète
        </Button>
      </div>
    </div>
  );

  // Navbar
  const now = new Date();
  const formattedDate = now.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const Navbar = () => (
    <div className="app-navbar">
      <button
        className={`nav-btn ${activePage === "home" ? "nav-btn--active" : ""}`}
        onClick={() => setActivePage("home")}
        title="Accueil"
      >
        <FiHome className="me-1" />
        Accueil
      </button>

      <button
        className={`nav-btn ${activePage === "graph" ? "nav-btn--active" : ""}`}
        onClick={() => setActivePage("graph")}
        title="Graphiques"
      >
        <FiBarChart2 className="me-1" />
        Graphiques
      </button>
      <div className="navbar-date">{formattedDate}</div>
      <LogOut className="navbar-logout" onClick={handleLogout} />
    </div>
  );

  // ── Page Graphiques ──
  if (activePage === "graph") {
    return (
      <div className="app-container">
        <Navbar />
        <GraphPage entries={entries} />
      </div>
    );
  }

  // ── Page Accueil ──
  return (
    <div className="app-container">
      <Navbar />

      <div className="gp-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="gp-header__left">
            <span className="gp-eyebrow">Analyse du sommeil</span>
            <h1 className="gp-title">
              <FiMoon className="gp-title__icon" />
              Agenda du Sommeil
            </h1>
          </div>
        </div>
      </div>

      {error && (
        <Alert
          variant="danger"
          onClose={() => setError(null)}
          dismissible
          className="fade-in-up"
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          onClose={() => setSuccess(null)}
          dismissible
          className="fade-in-up"
        >
          {success}
        </Alert>
      )}

      {!showForm && (
        <QuickActions onAction={handleQuickAction} currentEntry={todayEntry} />
      )}

      <Row className="g-4">
        {showForm && (
          <Col lg={12} className="mb-4">
            <SleepForm
              onSubmit={handleSubmit}
              initialData={editingEntry}
              onCancel={handleCancel}
              onDelete={handleDelete}
              entries={entries}
            />
          </Col>
        )}

        {!showForm && (
          <Col lg={12}>
            <Statistics />
          </Col>
        )}

        {!showForm && (
          <Col lg={12}>
            <div className="custom-card p-4">
              <h3
                className="mb-4"
                style={{
                  color: "var(--primary-dark)",
                  fontFamily: "var(--font-display)",
                }}
              >
                Historique
              </h3>
              {loading ? (
                <div className="text-center p-5 loading-pulse">
                  <FiMoon size={48} color="var(--primary-light)" />
                  <p className="mt-3 text-muted">Chargement des entrées...</p>
                </div>
              ) : (
                <Timeline entries={entries} onEdit={handleEdit} />
              )}
            </div>
          </Col>
        )}
      </Row>
    </div>
  );
}
