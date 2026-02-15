// Bouton d'export en PDF

import React, { useState } from "react";
import { FiDownload, FiLoader } from "react-icons/fi";
import { exportSleepDiaryPDF } from "../utils/exportPDF";
import "../styles/exportButton.css";

export default function ExportButton({ entries, userName = "" }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const handleExport = async () => {
    if (loading) return;
    setLoading(true);
    setDone(false);

    await new Promise((r) => setTimeout(r, 80));

    try {
      exportSleepDiaryPDF(entries, userName);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch (err) {
      console.error("Erreur export PDF :", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`export-btn ${loading ? "export-btn--loading" : ""} ${done ? "export-btn--done" : ""}`}
      onClick={handleExport}
      disabled={loading || entries.length === 0}
      title={
        entries.length === 0
          ? "Aucune donnée à exporter"
          : "Exporter l'agenda du sommeil en PDF"
      }
    >
      <span className="export-btn__icon">
        {loading ? (
          <FiLoader className="export-btn__spin" size={15} />
        ) : (
          <FiDownload size={15} />
        )}
      </span>
      <span className="export-btn__label">
        {loading ? "Génération…" : done ? "✓ PDF prêt" : "Exporter PDF"}
      </span>
    </button>
  );
}
