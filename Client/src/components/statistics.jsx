import React, { useState, useEffect } from "react";
import { Row, Col, Card } from "react-bootstrap";
import { statsAPI } from "../services/api";
import { FiMoon, FiSun, FiZap } from "react-icons/fi";
import { LiaHourglassHalfSolid } from "react-icons/lia";

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chargement des stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await statsAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Chargement
  if (loading) {
    return (
      <div className="text-center p-5 loading-pulse">
        <FiMoon size={48} color="var(--primary-light)" />
        <p className="mt-3 text-muted">Chargement des statistiques...</p>
      </div>
    );
  }

  // Gestion du format de la durée
  const formatDuration = (duration) => {
    if (!duration) return "-";

    const minutes = duration.minutes ?? 0;
    const hours = duration.hours ?? 0;

    if (hours > 0) {
      return `${hours} h ${minutes} min`;
    }

    return `${minutes} min`;
  };

  if (!stats || stats.total_entries === "0") {
    return null;
  }

  // Items des statistiques
  const statItems = [
    {
      icon: FiMoon,
      label: "Qualité sommeil",
      value: stats.avg_sleep_quality || "-",
      suffix: "/10",
      color: "var(--primary)",
    },
    {
      icon: FiSun,
      label: "Qualité éveil",
      value: stats.avg_wake_quality || "-",
      suffix: "/10",
      color: "var(--accent)",
    },
    {
      icon: FiZap,
      label: "Fatigue moyenne",
      value: stats.avg_fatigue || "-",
      suffix: "/10",
      color: "var(--steel-blue)",
    },
    {
      icon: LiaHourglassHalfSolid,
      label: "Latence au réveil",
      value: formatDuration(stats.avg_diff_time),
      color: "var(--steel-blue)",
    },
  ];

  return (
    <Card className="custom-card mb-4 fade-in-up">
      <Card.Header className="card-header-custom">
        Statistiques ({stats.total_entries} entrées)
      </Card.Header>
      <Card.Body className="p-3">
        <Row className="g-3">
          {statItems.map((item, index) => (
            <Col md={6} lg={3} key={index}>
              <div
                className="stat-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <item.icon size={32} color={item.color} className="mb-2" />
                <div className="stat-value" style={{ color: item.color }}>
                  {item.value}
                  <span style={{ fontSize: "1.2rem", opacity: 0.7 }}>
                    {item.suffix}
                  </span>
                </div>
                <div className="stat-label">{item.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );
};

export default Statistics;
