// Historique des entrées de sommeil
import { Card, Row, Col } from "react-bootstrap";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FiMoon,
  FiSun,
  FiClock,
  FiZap,
  FiCoffee,
  FiActivity,
} from "react-icons/fi";
import { BedDouble } from "lucide-react";

const Timeline = ({ entries, onEdit }) => {
  // Gestion de la qualité
  const getQualityClass = (value) => {
    if (value >= 7) return "quality-high";
    if (value >= 4) return "quality-medium";
    return "quality-low";
  };

  // Gestion du format du temps
  const formatTime = (time) => {
    if (!time) return "-";
    return time.substring(0, 5);
  };

  // Gestion du calcul de la durée de sommeil
  const calculateSleepDuration = (start, end) => {
    if (!start || !end) return null;

    const startParts = start.split(":");
    const endParts = end.split(":");

    let startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    let endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    return `${hours}h${minutes > 0 ? minutes.toString().padStart(2, "0") : ""}`;
  };

  // Gestion du type d'entrée
  const getEntryType = (entry) => {
    if (entry.involuntary_nap) return "involuntary_nap";
    if (entry.voluntary_nap) return "voluntary_nap";
    return "main_sleep";
  };

  // Gestion du label en fonction du type d'entrée
  const getEntryTypeLabel = (type) => {
    switch (type) {
      case "main_sleep":
        return "Sommeil principal";
      case "voluntary_nap":
        return "Sieste volontaire";
      case "involuntary_nap":
        return "Sieste involontaire";
      default:
        return "";
    }
  };

  // Gestion de l'icon en fonction du type d'entrée
  const getEntryTypeIcon = (type) => {
    switch (type) {
      case "main_sleep":
        return <BedDouble size={16} />;
      case "voluntary_nap":
        return <FiCoffee size={16} />;
      case "involuntary_nap":
        return <FiZap size={16} />;
      default:
        return null;
    }
  };

  // Gestion de la couleur en fonction du type d'entrée
  const getEntryTypeColor = (type) => {
    switch (type) {
      case "main_sleep":
        return "var(--primary)";
      case "voluntary_nap":
        return "#1e40af";
      case "involuntary_nap":
        return "#991b1b";
      default:
        return "var(--text-muted)";
    }
  };

  // Grouper les entrées par jour
  const groupEntriesByDay = (entries) => {
    const grouped = {};

    entries.forEach((entry) => {
      const dateKey = entry.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });

    // Trier les entrées de chaque jour par heure (sommeil principal en premier, puis siestes)
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        const typeOrder = {
          main_sleep: 0,
          voluntary_nap: 1,
          involuntary_nap: 2,
        };
        const typeA = getEntryType(a);
        const typeB = getEntryType(b);

        if (typeA !== typeB) {
          return typeOrder[typeA] - typeOrder[typeB];
        }

        // Si même type, trier par heure
        const timeA = a.sleep_period_start || a.lights_off_time || "00:00";
        const timeB = b.sleep_period_start || b.lights_off_time || "00:00";
        return timeA.localeCompare(timeB);
      });
    });

    return grouped;
  };

  if (!entries || entries.length === 0) {
    return (
      <Card className="custom-card text-center p-5">
        <FiMoon
          size={48}
          color="var(--primary-light)"
          className="mb-3 mx-auto"
        />
        <h5 style={{ color: "var(--text-muted)" }}>Aucune entrée</h5>
        <p className="text-muted">
          Commencez par ajouter votre première entrée de sommeil
        </p>
      </Card>
    );
  }

  const groupedEntries = groupEntriesByDay(entries);
  const sortedDates = Object.keys(groupedEntries).sort((a, b) =>
    b.localeCompare(a),
  );

  return (
    <div className="timeline-container">
      {sortedDates.map((dateKey, dayIndex) => {
        const dayEntries = groupedEntries[dateKey];

        return (
          <div
            key={dateKey}
            className="timeline-day-group fade-in-up"
            style={{ animationDelay: `${dayIndex * 0.1}s` }}
          >
            <div className="timeline-date">
              {format(new Date(dateKey), "EEEE d MMMM yyyy", { locale: fr })}
            </div>

            {dayEntries.map((entry, entryIndex) => {
              const sleepDuration = calculateSleepDuration(
                entry.sleep_period_start,
                entry.sleep_period_end || entry.wake_time,
              );
              const entryType = getEntryType(entry);

              return (
                <div
                  key={entry.id}
                  className="timeline-item"
                  onClick={() => onEdit && onEdit(entry)}
                  role={onEdit ? "button" : undefined}
                  tabIndex={onEdit ? 0 : undefined}
                  style={{
                    marginLeft: entryIndex > 0 ? "20px" : "0",
                    borderLeft:
                      entryIndex > 0
                        ? `3px solid ${getEntryTypeColor(entryType)}`
                        : "none",
                  }}
                >
                  {/* Type d'entrée */}
                  <div
                    className="mb-2 d-flex align-items-center gap-2"
                    style={{
                      color: getEntryTypeColor(entryType),
                      fontWeight: "600",
                    }}
                  >
                    {getEntryTypeIcon(entryType)}
                    <span>{getEntryTypeLabel(entryType)}</span>
                  </div>

                  <Row className="g-3 mb-3">
                    {entryType === "main_sleep" && (
                      <>
                        <Col md={2} sm={6}>
                          <div className="d-flex align-items-center gap-2">
                            <FiClock color="var(--primary)" size={18} />
                            <div>
                              <small className="text-muted d-block">
                                Extinction
                              </small>
                              <strong>
                                {formatTime(entry.lights_off_time)}
                              </strong>
                            </div>
                          </div>
                        </Col>
                        <Col md={2} sm={6}>
                          <div className="d-flex align-items-center gap-2">
                            <FiMoon color="var(--primary)" size={18} />
                            <div>
                              <small className="text-muted d-block">
                                Endormissement
                              </small>
                              <strong>
                                {formatTime(entry.sleep_period_start)}
                              </strong>
                            </div>
                          </div>
                        </Col>
                      </>
                    )}

                    {(entryType === "voluntary_nap" ||
                      entryType === "involuntary_nap") && (
                      <Col md={2} sm={6}>
                        <div className="d-flex align-items-center gap-2">
                          <FiClock
                            color={getEntryTypeColor(entryType)}
                            size={18}
                          />
                          <div>
                            <small className="text-muted d-block">Début</small>
                            <strong>
                              {formatTime(entry.sleep_period_start)}
                            </strong>
                          </div>
                        </div>
                      </Col>
                    )}

                    <Col md={2} sm={6}>
                      <div className="d-flex align-items-center gap-2">
                        <FiClock color="var(--strong-blue)" size={18} />
                        <div>
                          <small className="text-muted d-block">Durée</small>
                          <strong>
                            {entryType === "voluntary_nap" &&
                            entry.voluntary_nap_duration
                              ? `${entry.voluntary_nap_duration}min`
                              : entryType === "involuntary_nap" &&
                                  entry.involuntary_nap_duration
                                ? `${entry.involuntary_nap_duration}min`
                                : sleepDuration || "-"}
                          </strong>
                        </div>
                      </div>
                    </Col>

                    <Col md={2} sm={6}>
                      <div className="d-flex align-items-center gap-2">
                        <FiSun color="var(--accent)" size={18} />
                        <div>
                          <small className="text-muted d-block">Fin</small>
                          <strong>
                            {formatTime(
                              entry.sleep_period_end || entry.wake_time,
                            )}
                          </strong>
                        </div>
                      </div>
                    </Col>

                    <Col md={2} sm={6}>
                      <div className="d-flex align-items-center gap-2">
                        <FiActivity color="var(--steel-blue)" size={18} />
                        <div>
                          <small className="text-muted d-block">Réveils</small>
                          <strong>{entry.night_awakenings || 0}</strong>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* Badges de qualité */}
                  <div className="mb-2">
                    {entry.sleep_quality > 0 && (
                      <span
                        className={`timeline-badge ${getQualityClass(entry.sleep_quality)}`}
                      >
                        Sommeil: {entry.sleep_quality}/10
                      </span>
                    )}
                    {entry.wake_quality > 0 && (
                      <span
                        className={`timeline-badge ${getQualityClass(entry.wake_quality)}`}
                      >
                        Éveil: {entry.wake_quality}/10
                      </span>
                    )}
                    {entry.fatigue_level > 6 && (
                      <span
                        className="timeline-badge"
                        style={{ background: "#fef3c7", color: "#92400e" }}
                      >
                        <FiZap size={12} /> Fatigue: {entry.fatigue_level}/10
                      </span>
                    )}
                    {entry.medication && (
                      <span
                        className="timeline-badge"
                        style={{ background: "#e9d5ff", color: "#6b21a8" }}
                      >
                        💊 Médicament
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {entry.notes && (
                    <div className="mt-2">
                      <small className="text-muted">
                        <em>{entry.notes}</em>
                      </small>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
