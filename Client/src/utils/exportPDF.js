import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function formatDate(dateStr) {
  if (!dateStr) return "–";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function calcDuration(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

function formatNapDuration(duration) {
  if (!duration) return "–";
  if (duration >= 60) {
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    return `${h}h${m.toString().padStart(2, "0")}`;
  }
  return `${duration} min`;
}

function val(v, suffix = "") {
  if (v === null || v === undefined || v === "") return "–";
  return `${v}${suffix}`;
}

const COLORS = {
  prussianBlue: [0, 50, 98],
  navyBlue: [0, 53, 107],
  strongBlue: [46, 80, 144],
  azureBlue: [0, 112, 187],
  lightSteel: [158, 185, 212],
  textDark: [26, 26, 46],
  textMuted: [100, 116, 139],
  bgLight: [248, 250, 252],
  white: [255, 255, 255],
  border: [226, 232, 240],
  rowAlt: [240, 246, 252],
  napRow: [230, 240, 255],
};

export function exportSleepDiaryPDF(entries, userName = "") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Filter & sort main sleep entries
  const mainEntries = entries
    .filter((e) => e.entry_type === "main_sleep")
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const exportDate = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Calcul des stats
  const calcStats = (entries) => {
    const valid = mainEntries.filter(
      (e) => e.sleep_period_start && e.sleep_period_end,
    );

    const durationsWithNaps = valid.map((e) => {
      const [sh, sm] = e.sleep_period_start.split(":").map(Number);
      const [eh, em] = e.sleep_period_end.split(":").map(Number);
      let m = eh * 60 + em - (sh * 60 + sm);
      if (m < 0) m += 1440;

      const napsMins = entries
        .filter(
          (n) =>
            n.date === e.date &&
            (n.entry_type === "voluntary_nap" ||
              n.entry_type === "involuntary_nap"),
        )
        .reduce(
          (sum, nap) =>
            sum +
            (nap.voluntary_nap_duration || nap.involuntary_nap_duration || 0),
          0,
        );

      return (m + napsMins) / 60;
    });

    const avgDur = durationsWithNaps.length
      ? durationsWithNaps.reduce((a, b) => a + b, 0) / durationsWithNaps.length
      : null;

    const qualEntries = mainEntries.filter((e) => e.sleep_quality != null);
    const avgQual = qualEntries.length
      ? qualEntries.reduce((s, e) => s + e.sleep_quality, 0) /
        qualEntries.length
      : null;

    const entriesWithPhases = mainEntries.filter(
      (e) =>
        e.garmin_deep_sleep != null ||
        e.garmin_light_sleep != null ||
        e.garmin_rem_sleep != null,
    );

    let avgDeepPercent = null;
    let avgLightPercent = null;
    let avgRemPercent = null;

    if (entriesWithPhases.length > 0) {
      const phases = entriesWithPhases
        .map((e) => {
          const deep = e.garmin_deep_sleep || 0;
          const light = e.garmin_light_sleep || 0;
          const rem = e.garmin_rem_sleep || 0;
          const total = deep + light + rem;
          if (total === 0) return null;
          return {
            deep: (deep / total) * 100,
            light: (light / total) * 100,
            rem: (rem / total) * 100,
          };
        })
        .filter((p) => p !== null);

      if (phases.length > 0) {
        avgDeepPercent =
          phases.reduce((sum, p) => sum + p.deep, 0) / phases.length;
        avgLightPercent =
          phases.reduce((sum, p) => sum + p.light, 0) / phases.length;
        avgRemPercent =
          phases.reduce((sum, p) => sum + p.rem, 0) / phases.length;
      }
    }

    return {
      totalNights: mainEntries.length,
      avgDuration: avgDur,
      avgQuality: avgQual,
      avgDeepPercent,
      avgLightPercent,
      avgRemPercent,
    };
  };

  const stats = calcStats(entries);

  const tableRows = [];

  mainEntries.forEach((e, i) => {
    // Phases Garmin
    let phasesText = "–";
    if (
      e.garmin_deep_sleep != null ||
      e.garmin_light_sleep != null ||
      e.garmin_rem_sleep != null
    ) {
      const deep = e.garmin_deep_sleep || 0;
      const light = e.garmin_light_sleep || 0;
      const rem = e.garmin_rem_sleep || 0;
      const total = deep + light + rem;
      if (total > 0) {
        phasesText = `L:${((light / total) * 100).toFixed(0)}% P:${((deep / total) * 100).toFixed(0)}% R:${((rem / total) * 100).toFixed(0)}%`;
      }
    }

    // Ligne main sleep
    tableRows.push({
      type: "main",
      data: [
        (i + 1).toString(),
        formatDate(e.date),
        val(e.lights_off_time),
        val(e.sleep_period_start),
        val(e.sleep_period_end),
        calcDuration(e.sleep_period_start, e.sleep_period_end) ?? "–",
        e.alarm_set && e.first_alarm_time ? val(e.first_alarm_time) : "–",
        val(e.wake_time),
        phasesText,
        val(e.night_awakenings),
        e.sleep_quality != null ? `${e.sleep_quality}/10` : "–",
        val(e.notes).length > 40
          ? val(e.notes).slice(0, 38) + "…"
          : val(e.notes),
      ],
    });

    // Siestes du même jour
    const naps = entries.filter(
      (n) =>
        n.date === e.date &&
        (n.entry_type === "voluntary_nap" ||
          n.entry_type === "involuntary_nap"),
    );

    naps.forEach((nap) => {
      const napLabel =
        nap.entry_type === "voluntary_nap" ? "Sieste" : "Involontaire";
      const duration =
        nap.voluntary_nap_duration || nap.involuntary_nap_duration;

      tableRows.push({
        type: "nap",
        data: [
          "",
          "",
          napLabel,
          val(nap.sleep_period_start),
          val(nap.sleep_period_end || nap.wake_time),
          formatNapDuration(duration),
          "–",
          "–",
          "–",
          "–",
          "–",
          val(nap.notes).length > 40
            ? val(nap.notes).slice(0, 38) + "…"
            : val(nap.notes),
        ],
      });
    });
  });

  const columns = [
    { header: "#", dataKey: "num" },
    { header: "Date", dataKey: "date" },
    { header: "Lumières\néteintes", dataKey: "lights" },
    { header: "Début\nsommeil", dataKey: "start" },
    { header: "Fin\nsommeil", dataKey: "end" },
    { header: "Durée\ntotale", dataKey: "dur" },
    { header: "Heure de\nl'alarme", dataKey: "alarm" },
    { header: "Heure de\nlever", dataKey: "wake" },
    { header: "Phases\nsommeil", dataKey: "phases" },
    { header: "Réveils\nnocturnes", dataKey: "awk" },
    { header: "Qualité\n(/10)", dataKey: "qual" },
    { header: "Notes", dataKey: "notes" },
  ];

  // Construction du PDF
  const headerH = 22;
  const statsStartY = headerH + 3;
  const statsH = 25;
  const tableStartY = statsStartY + statsH;

  autoTable(doc, {
    head: [columns.map((c) => c.header)],
    body: tableRows.map((r) => r.data),
    startY: tableStartY,
    margin: { top: tableStartY + 2, bottom: 12, left: margin, right: margin },

    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      textColor: COLORS.textDark,
      lineColor: COLORS.border,
      lineWidth: 0.2,
      overflow: "linebreak",
      valign: "middle",
    },

    headStyles: {
      fillColor: COLORS.navyBlue,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },

    alternateRowStyles: {
      fillColor: COLORS.rowAlt,
    },

    bodyStyles: {
      halign: "center",
    },

    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 26, halign: "left" },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18, fontStyle: "bold", textColor: COLORS.strongBlue },
      6: { cellWidth: 18 },
      7: { cellWidth: 18 },
      8: { cellWidth: 26, fontSize: 7 },
      9: { cellWidth: 19 },
      10: { cellWidth: 16, fontStyle: "bold" },
      11: { cellWidth: "auto", halign: "left" },
    },

    didParseCell(data) {
      if (data.section === "body") {
        const row = tableRows[data.row.index];

        // Coloration des lignes siestes
        if (row?.type === "nap") {
          data.cell.styles.fillColor = COLORS.napRow;
          data.cell.styles.textColor = COLORS.strongBlue;
          data.cell.styles.fontStyle = "italic";
          data.cell.styles.fontSize = 7.5;
        }

        if (data.column.index === 10 && row?.type === "main") {
          const score = parseInt(data.cell.raw);
          if (!isNaN(score)) {
            if (score <= 4) data.cell.styles.textColor = [180, 60, 60];
            else if (score <= 6) data.cell.styles.textColor = [160, 110, 0];
            else data.cell.styles.textColor = [40, 120, 70];
          }
        }
      }
    },

    didDrawPage(data) {
      const isFirstPage = data.pageNumber === 1;
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      // Header
      doc.setFillColor(...COLORS.prussianBlue);
      doc.rect(0, 0, W, 22, "F");
      doc.setFillColor(...COLORS.azureBlue);
      doc.rect(0, 20, W, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...COLORS.white);
      doc.text("AGENDA DU SOMMEIL", margin, 13);

      if (userName) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.white);
        doc.text(` ${userName}`, W - margin, 9, { align: "right" });
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.lightSteel);
      doc.text(`Exporté le ${exportDate}`, W - margin, 16, { align: "right" });

      // Footer
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.3);
      doc.line(margin, H - 6, W - margin, H - 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(
        "Ce document est généré automatiquement à partir de l'Agenda du Sommeil créé par Fanny :)",
        margin,
        H - 3,
      );
      doc.text(`Page ${data.pageNumber}`, W - margin, H - 3, {
        align: "right",
      });

      // Bloc stats (première page uniquement)
      if (isFirstPage) {
        const sy = statsStartY;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...COLORS.navyBlue);
        doc.text("RÉSUMÉ DE LA PÉRIODE", margin, sy + 1);

        const boxY = sy + 4;
        const boxH = 13;
        const colW = (W - margin * 2) / 4;

        const statsData = [
          { label: "Nuits enregistrées", value: `${stats.totalNights}` },
          {
            label: "Durée moy. sommeil",
            value:
              stats.avgDuration != null
                ? `${Math.floor(stats.avgDuration)}h${Math.round(
                    (stats.avgDuration % 1) * 60,
                  )
                    .toString()
                    .padStart(2, "0")}`
                : "–",
          },
          {
            label: "Qualité moyenne",
            value:
              stats.avgQuality != null
                ? `${stats.avgQuality.toFixed(1)} / 10`
                : "–",
          },
        ];

        statsData.forEach((s, i) => {
          const x = margin + i * colW;
          doc.setFillColor(...COLORS.bgLight);
          doc.roundedRect(x, boxY, colW - 3, boxH, 2, 2, "F");
          doc.setFillColor(...COLORS.strongBlue);
          doc.rect(x, boxY, colW - 3, 1.5, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(...COLORS.prussianBlue);
          doc.text(s.value, x + (colW - 3) / 2, boxY + 6.5, {
            align: "center",
          });
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...COLORS.textMuted);
          doc.text(s.label, x + (colW - 3) / 2, boxY + 11, {
            align: "center",
          });
        });
      }
    },
  });

  // Sauvegarde
  const filename = userName
    ? `agenda-sommeil-${userName.toLowerCase().replace(/\s+/g, "-")}.pdf`
    : `agenda-sommeil-${new Date().toISOString().split("T")[0]}.pdf`;

  doc.save(filename);
}
