// Formulaire de création d'entrée du sommeil
import React, { useState, useEffect } from "react";
import {
  Form,
  Row,
  Col,
  Button,
  Card,
  Collapse,
  Badge,
  Modal,
} from "react-bootstrap";
import {
  FiClock,
  FiMoon,
  FiSun,
  FiActivity,
  FiCoffee,
  FiFileText,
  FiChevronDown,
  FiChevronUp,
  FiZap,
  FiBattery,
  FiCloud,
  FiWind,
  FiTrash2,
  FiBell,
  FiWatch,
} from "react-icons/fi";
import { FaPills } from "react-icons/fa";

const SleepForm = ({
  onSubmit,
  initialData = null,
  onCancel,
  onDelete,
  entries = [],
}) => {
  const [formData, setFormData] = useState({
    date: "",
    wake_time: "",
    lights_off_time: "",
    sleep_period_start: "",
    sleep_period_end: "",
    night_awakenings: 0,
    fatigue_level: 5,
    sleepiness_level: 5,
    involuntary_nap: false,
    involuntary_nap_duration: "",
    voluntary_nap: false,
    voluntary_nap_duration: "",
    sleep_quality: 5,
    wake_quality: 5,
    medication: false,
    medication_details: "",
    notes: "",
    alarm_set: false,
    first_alarm_time: "",
  });

  // Données Garmin
  const [garminData, setGarminData] = useState({
    total_sleep_time: "",
    deep_sleep_time: "",
    light_sleep_time: "",
    rem_sleep_time: "",
    awake_time: "",
    sleep_score: "",
    hrv_avg: "",
    resting_heart_rate: "",
    respiration_avg: "",
    stress_avg: "",
    body_battery_start: "",
    body_battery_end: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [sectionsOpen, setSectionsOpen] = useState({
    times: true,
    alarm: false,
    levels: false,
    naps: false,
    medication: false,
    garmin: false,
    notes: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date?.split("T")[0] || "",
        involuntary_nap_duration: initialData.involuntary_nap_duration || "",
        voluntary_nap_duration: initialData.voluntary_nap_duration || "",
        alarm_set: initialData.alarm_set || false,
        first_alarm_time: initialData.first_alarm_time || "",
      });

      // Charger les données Garmin si elles existent
      if (initialData.garmin_data) {
        setGarminData({
          total_sleep_time: initialData.garmin_data.total_sleep_time || "",
          deep_sleep_time: initialData.garmin_data.deep_sleep_time || "",
          light_sleep_time: initialData.garmin_data.light_sleep_time || "",
          rem_sleep_time: initialData.garmin_data.rem_sleep_time || "",
          awake_time: initialData.garmin_data.awake_time || "",
          sleep_score: initialData.garmin_data.sleep_score || "",
          hrv_avg: initialData.garmin_data.hrv_avg || "",
          resting_heart_rate: initialData.garmin_data.resting_heart_rate || "",
          respiration_avg: initialData.garmin_data.respiration_avg || "",
          stress_avg: initialData.garmin_data.stress_avg || "",
          body_battery_start: initialData.garmin_data.body_battery_start || "",
          body_battery_end: initialData.garmin_data.body_battery_end || "",
        });
      }

      autoExpandSections(initialData);
    } else {
      const smartDate = getSmartDate();
      setFormData((prev) => ({ ...prev, date: smartDate }));
    }
  }, [initialData]);

  // Formater la date d'aujourd'hui
  const getSmartDate = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const autoExpandSections = (data) => {
    const newSectionsOpen = { ...sectionsOpen };

    if (data.involuntary_nap || data.voluntary_nap) newSectionsOpen.naps = true;
    if (data.medication) newSectionsOpen.medication = true;
    if (data.notes) newSectionsOpen.notes = true;
    if (data.alarm_set) newSectionsOpen.alarm = true;
    if (data.fatigue_level !== 5 || data.sleepiness_level !== 5)
      newSectionsOpen.levels = true;
    if (data.garmin_data && Object.values(data.garmin_data).some((v) => v))
      newSectionsOpen.garmin = true;

    setSectionsOpen(newSectionsOpen);
  };

  const toggleSection = (section) => {
    setSectionsOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? null : parseInt(value),
    }));
  };

  const handleGarminNumberChange = (e) => {
    const { name, value } = e.target;
    setGarminData((prev) => ({
      ...prev,
      [name]: value === "" ? null : parseFloat(value),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Déterminer le type d'entrée
    const getEntryType = () => {
      if (formData.involuntary_nap) return "involuntary_nap";
      if (formData.voluntary_nap) return "voluntary_nap";

      // Vérifier s'il existe déjà une entrée principale pour ce jour
      if (!entries || entries.length === 0) {
        return "main_sleep";
      }

      const hasMainSleep = entries.some(
        (entry) =>
          entry.date === formData.date &&
          entry.entry_type === "main_sleep" &&
          entry.id !== formData.id, // Exclure l'entrée en cours d'édition
      );

      return hasMainSleep ? "voluntary_nap" : "main_sleep";
    };

    const entryType = getEntryType();

    // Vérifier si des données Garmin ont été saisies
    const hasGarminData = Object.values(garminData).some(
      (v) => v !== "" && v !== null,
    );

    // Clean up data avant soumission
    const cleanData = {
      ...formData,
      entry_type: entryType,
      voluntary_nap:
        entryType === "voluntary_nap" ? true : formData.voluntary_nap,
      involuntary_nap:
        entryType === "involuntary_nap" ? true : formData.involuntary_nap,
      involuntary_nap_duration: formData.involuntary_nap
        ? formData.involuntary_nap_duration || null
        : null,
      voluntary_nap_duration:
        formData.voluntary_nap || entryType === "voluntary_nap"
          ? formData.voluntary_nap_duration || null
          : null,
      medication_details: formData.medication
        ? formData.medication_details || null
        : null,
      first_alarm_time: formData.alarm_set
        ? formData.first_alarm_time || null
        : null,
      // Ajouter les données Garmin si elles existent
      garmin_data: hasGarminData ? garminData : null,
    };

    onSubmit(cleanData);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete && initialData) {
      onDelete(initialData.id);
    }
    setShowDeleteModal(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // Récuperation des badges
  const getSectionBadge = (section) => {
    let count = 0;

    switch (section) {
      case "times":
        if (formData.wake_time) count++;
        if (formData.lights_off_time) count++;
        if (formData.sleep_period_start) count++;
        if (formData.sleep_period_end) count++;
        break;
      case "alarm":
        if (formData.alarm_set) count = 1;
        break;
      case "levels":
        if (formData.fatigue_level !== 5) count++;
        if (formData.sleepiness_level !== 5) count++;
        if (formData.sleep_quality !== 5) count++;
        if (formData.wake_quality !== 5) count++;
        break;
      case "naps":
        if (formData.involuntary_nap) count++;
        if (formData.voluntary_nap) count++;
        break;
      case "medication":
        if (formData.medication) count = 1;
        break;
      case "garmin":
        count = Object.values(garminData).filter(
          (v) => v !== "" && v !== null,
        ).length;
        break;
      case "notes":
        if (formData.notes) count = 1;
        break;
    }

    return count > 0 ? (
      <Badge bg="primary" className="ms-2">
        {count}
      </Badge>
    ) : null;
  };

  // Récuperation des icons
  const getSliderIcon = (type, value) => {
    const icons = {
      fatigue: {
        low: <FiZap size={16} color="var(--azure-blue)" />,
        high: <FiBattery size={16} color="var(--text-muted)" />,
      },
      sleepiness: {
        low: <FiSun size={16} color="var(--azure-blue)" />,
        high: <FiMoon size={16} color="var(--navy-blue)" />,
      },
      quality: {
        low: <FiCloud size={16} color="var(--text-muted)" />,
        high: <FiWind size={16} color="var(--azure-blue)" />,
      },
    };

    return icons[type] || {};
  };

  // Gestion du format des heures / minutess
  const formatToHours = (minutes) => {
    if (!minutes || minutes <= 0) return "";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + "min" : ""}` : `${m}min`;
  };

  // Gestion du calcul de durée
  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;

    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);

    const startTotal = startHours * 60 + startMinutes;
    let endTotal = endHours * 60 + endMinutes;

    if (endTotal < startTotal) {
      endTotal += 24 * 60;
    }

    return endTotal - startTotal;
  };

  useEffect(() => {
    const duration = calculateDuration(
      formData.sleep_period_start,
      formData.sleep_period_end,
    );

    setFormData((prev) => ({
      ...prev,
      voluntary_nap_duration: prev.voluntary_nap ? duration : 0,
      involuntary_nap_duration: prev.involuntary_nap ? duration : 0,
    }));
  }, [
    formData.sleep_period_start,
    formData.sleep_period_end,
    formData.voluntary_nap,
    formData.involuntary_nap,
  ]);

  return (
    <>
      <Card className="custom-card fade-in-up">
        <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
          <div>
            <FiMoon className="me-2" />
            {initialData ? "Modifier l'entrée" : "Nouvelle entrée"}
          </div>
          <small>
            {formData.date &&
              new Date(formData.date + "T00:00:00").toLocaleDateString(
                "fr-FR",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
          </small>
        </Card.Header>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            {/* Date - Toujours visible */}
            <Row className="mb-4">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="d-flex align-items-center">
                    <FiClock className="me-2" />
                    <strong>Date *</strong>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Times Section */}
            <div className="mb-3">
              <Button
                onClick={() => toggleSection("times")}
                variant="link"
                className="section-toggle w-100 text-start p-3 d-flex justify-content-between align-items-center"
                style={{ textDecoration: "none" }}
              >
                <div className="d-flex align-items-center">
                  <FiClock
                    size={20}
                    className="me-3"
                    style={{ color: "var(--primary)" }}
                  />
                  <h5 className="mb-0" style={{ color: "var(--primary-dark)" }}>
                    Horaires
                    {getSectionBadge("times")}
                  </h5>
                </div>
                {sectionsOpen.times ? <FiChevronUp /> : <FiChevronDown />}
              </Button>

              <Collapse in={sectionsOpen.times}>
                <div className="p-3 border rounded-bottom">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FiMoon size={14} className="me-2" />
                          Extinction des lumières
                        </Form.Label>
                        <div className="input-group">
                          <Form.Control
                            type="time"
                            name="lights_off_time"
                            value={formData.lights_off_time}
                            onChange={handleChange}
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Début période de sommeil</Form.Label>
                        <Form.Control
                          type="time"
                          name="sleep_period_start"
                          value={formData.sleep_period_start}
                          onChange={handleChange}
                        />
                        <Form.Text className="text-muted">
                          Quand vous pensez vous être endormi
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Fin période de sommeil</Form.Label>
                        <Form.Control
                          type="time"
                          name="sleep_period_end"
                          value={formData.sleep_period_end}
                          onChange={handleChange}
                        />
                        <Form.Text className="text-muted">
                          Dernier réveil du matin
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FiSun size={14} className="me-2" />
                          Heure de lever - Sortir du lit
                        </Form.Label>
                        <div className="input-group">
                          <Form.Control
                            type="time"
                            name="wake_time"
                            value={formData.wake_time}
                            onChange={handleChange}
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group>
                        <Form.Label>Réveils nocturnes</Form.Label>
                        <Form.Control
                          type="number"
                          name="night_awakenings"
                          value={formData.night_awakenings}
                          onChange={handleNumberChange}
                          min="0"
                          placeholder="Nombre de fois réveillé(e)"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Collapse>
            </div>

            {/* Alarm Section */}
            <div className="mb-3">
              <Button
                onClick={() => toggleSection("alarm")}
                variant="link"
                className="section-toggle w-100 text-start p-3 d-flex justify-content-between align-items-center"
                style={{ textDecoration: "none" }}
              >
                <div className="d-flex align-items-center">
                  <FiBell
                    size={20}
                    className="me-3"
                    style={{ color: "var(--primary)" }}
                  />
                  <h5 className="mb-0" style={{ color: "var(--primary-dark)" }}>
                    Réveil
                    {getSectionBadge("alarm")}
                  </h5>
                </div>
                {sectionsOpen.alarm ? <FiChevronUp /> : <FiChevronDown />}
              </Button>

              <Collapse in={sectionsOpen.alarm}>
                <div className="p-3 border rounded-bottom">
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          name="alarm_set"
                          label="Réveil programmé"
                          checked={formData.alarm_set}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Collapse in={formData.alarm_set}>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>
                            <FiBell size={14} className="me-2" />
                            Heure du premier réveil
                          </Form.Label>
                          <Form.Control
                            type="time"
                            name="first_alarm_time"
                            value={formData.first_alarm_time}
                            onChange={handleChange}
                            disabled={!formData.alarm_set}
                          />
                          <Form.Text className="text-muted">
                            Heure à laquelle le premier réveil a sonné
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Collapse>
                  </Row>
                </div>
              </Collapse>
            </div>

            {/* Levels Section */}
            <div className="mb-3">
              <Button
                onClick={() => toggleSection("levels")}
                variant="link"
                className="section-toggle w-100 text-start p-3 d-flex justify-content-between align-items-center"
                style={{ textDecoration: "none" }}
              >
                <div className="d-flex align-items-center">
                  <FiActivity
                    size={20}
                    className="me-3"
                    style={{ color: "var(--primary)" }}
                  />
                  <h5 className="mb-0" style={{ color: "var(--primary-dark)" }}>
                    Niveaux & Qualité
                    {getSectionBadge("levels")}
                  </h5>
                </div>
                {sectionsOpen.levels ? <FiChevronUp /> : <FiChevronDown />}
              </Button>

              <Collapse in={sectionsOpen.levels}>
                <div className="p-3 border rounded-bottom">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label className="d-flex justify-content-between align-items-center">
                          <span className="d-flex align-items-center">
                            {
                              getSliderIcon("fatigue", formData.fatigue_level)
                                .low
                            }
                            <span className="ms-2">Niveau de fatigue</span>
                          </span>
                          <Badge bg="primary" className="slider-value-badge">
                            {formData.fatigue_level}/10
                          </Badge>
                        </Form.Label>
                        <div className="d-flex align-items-center gap-3">
                          <small className="text-muted">Énergique</small>
                          <Form.Range
                            name="fatigue_level"
                            value={formData.fatigue_level}
                            onChange={handleNumberChange}
                            min="0"
                            max="10"
                            className="range-slider flex-grow-1"
                          />
                          <small className="text-muted">Épuisé</small>
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label className="d-flex justify-content-between align-items-center">
                          <span>Qualité du sommeil</span>
                          <Badge bg="primary" className="slider-value-badge">
                            {formData.sleep_quality}/10
                          </Badge>
                        </Form.Label>
                        <div className="d-flex align-items-center gap-3">
                          <small className="text-muted">Mauvaise</small>
                          <Form.Range
                            name="sleep_quality"
                            value={formData.sleep_quality}
                            onChange={handleNumberChange}
                            min="0"
                            max="10"
                            className="range-slider flex-grow-1"
                          />
                          <small className="text-muted">Excellente</small>
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label className="d-flex justify-content-between align-items-center">
                          <span>Qualité de l'éveil</span>
                          <Badge bg="primary" className="slider-value-badge">
                            {formData.wake_quality}/10
                          </Badge>
                        </Form.Label>
                        <div className="d-flex align-items-center gap-3">
                          <small className="text-muted">Difficile</small>
                          <Form.Range
                            name="wake_quality"
                            value={formData.wake_quality}
                            onChange={handleNumberChange}
                            min="0"
                            max="10"
                            className="range-slider flex-grow-1"
                          />
                          <small className="text-muted">En forme</small>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Collapse>
            </div>

            {/* Naps Section */}
            <div className="mb-3">
              <Button
                onClick={() => toggleSection("naps")}
                variant="link"
                className="section-toggle w-100 text-start p-3 d-flex justify-content-between align-items-center"
                style={{ textDecoration: "none" }}
              >
                <div className="d-flex align-items-center">
                  <FiCoffee
                    size={20}
                    className="me-3"
                    style={{ color: "var(--primary)" }}
                  />
                  <h5 className="mb-0" style={{ color: "var(--primary-dark)" }}>
                    Siestes
                    {getSectionBadge("naps")}
                  </h5>
                </div>
                {sectionsOpen.naps ? <FiChevronUp /> : <FiChevronDown />}
              </Button>

              <Collapse in={sectionsOpen.naps}>
                <div className="p-3 border rounded-bottom">
                  <Row>
                    <Col md={6}>
                      <Form.Check
                        type="checkbox"
                        name="involuntary_nap"
                        label="Sieste involontaire"
                        checked={formData.involuntary_nap}
                        onChange={handleChange}
                        disabled={formData.voluntary_nap}
                      />
                      {formData.involuntary_nap && (
                        <div className="d-flex align-items-center gap-2 mt-2">
                          <Form.Control
                            type="number"
                            value={formData.involuntary_nap_duration || ""}
                            readOnly
                            style={{ width: "100px" }}
                          />
                          <span className="text-muted fw-bold">
                            ≈ {formatToHours(formData.involuntary_nap_duration)}
                          </span>
                        </div>
                      )}
                    </Col>

                    <Col md={6}>
                      <Form.Check
                        type="checkbox"
                        name="voluntary_nap"
                        label="Sieste volontaire"
                        checked={formData.voluntary_nap}
                        onChange={handleChange}
                        disabled={formData.involuntary_nap}
                      />
                      {formData.voluntary_nap && (
                        <div className="d-flex align-items-center gap-2 mt-2">
                          <Form.Control
                            type="number"
                            value={formData.voluntary_nap_duration || ""}
                            readOnly
                            style={{ width: "100px" }}
                          />
                          <span className="text-muted fw-bold">
                            ≈ {formatToHours(formData.voluntary_nap_duration)}
                          </span>
                        </div>
                      )}
                    </Col>
                  </Row>
                </div>
              </Collapse>
            </div>

            {/* Garmin Watch Data Section*/}
            <div className="mb-3">
              <Button
                onClick={() => toggleSection("garmin")}
                variant="link"
                className="section-toggle w-100 text-start p-3 d-flex justify-content-between align-items-center"
                style={{ textDecoration: "none" }}
              >
                <div className="d-flex align-items-center">
                  <FiWatch
                    size={20}
                    className="me-3"
                    style={{ color: "var(--primary)" }}
                  />
                  <h5 className="mb-0" style={{ color: "var(--primary-dark)" }}>
                    Données Garmin
                    {getSectionBadge("garmin")}
                  </h5>
                </div>
                {sectionsOpen.garmin ? <FiChevronUp /> : <FiChevronDown />}
              </Button>

              <Collapse in={sectionsOpen.garmin}>
                <div className="p-3 border rounded-bottom">
                  <Row>
                    {/* Durées de sommeil */}
                    <Col md={12}>
                      <h6 className="text-muted mb-3 mt-2">
                        <FiMoon size={16} className="me-2" />
                        Phases de sommeil (minutes)
                      </h6>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Sommeil total</Form.Label>
                        <Form.Control
                          type="number"
                          name="total_sleep_time"
                          value={garminData.total_sleep_time}
                          onChange={handleGarminNumberChange}
                          placeholder="min"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Sommeil profond</Form.Label>
                        <Form.Control
                          type="number"
                          name="deep_sleep_time"
                          value={garminData.deep_sleep_time}
                          onChange={handleGarminNumberChange}
                          placeholder="min"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Sommeil léger</Form.Label>
                        <Form.Control
                          type="number"
                          name="light_sleep_time"
                          value={garminData.light_sleep_time}
                          onChange={handleGarminNumberChange}
                          placeholder="min"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Sommeil REM</Form.Label>
                        <Form.Control
                          type="number"
                          name="rem_sleep_time"
                          value={garminData.rem_sleep_time}
                          onChange={handleGarminNumberChange}
                          placeholder="min"
                        />
                      </Form.Group>
                    </Col>

                    {/* Scores et métriques */}
                    <Col md={12}>
                      <h6 className="text-muted mb-3 mt-2">
                        <FiActivity size={16} className="me-2" />
                        Scores et métriques
                      </h6>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Score de sommeil</Form.Label>
                        <Form.Control
                          type="number"
                          name="sleep_score"
                          value={garminData.sleep_score}
                          onChange={handleGarminNumberChange}
                          placeholder="0-100"
                          min="0"
                          max="100"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Temps éveillé</Form.Label>
                        <Form.Control
                          type="number"
                          name="awake_time"
                          value={garminData.awake_time}
                          onChange={handleGarminNumberChange}
                          placeholder="min"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>HRV moyen</Form.Label>
                        <Form.Control
                          type="number"
                          name="hrv_avg"
                          value={garminData.hrv_avg}
                          onChange={handleGarminNumberChange}
                          placeholder="ms"
                        />
                      </Form.Group>
                    </Col>

                    {/* Métriques physiologiques */}
                    <Col md={12}>
                      <h6 className="text-muted mb-3 mt-2">
                        <FiZap size={16} className="me-2" />
                        Métriques physiologiques
                      </h6>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>FC au repos</Form.Label>
                        <Form.Control
                          type="number"
                          name="resting_heart_rate"
                          value={garminData.resting_heart_rate}
                          onChange={handleGarminNumberChange}
                          placeholder="bpm"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Respiration moy.</Form.Label>
                        <Form.Control
                          type="number"
                          name="respiration_avg"
                          value={garminData.respiration_avg}
                          onChange={handleGarminNumberChange}
                          placeholder="rpm"
                          step="0.1"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Stress moyen</Form.Label>
                        <Form.Control
                          type="number"
                          name="stress_avg"
                          value={garminData.stress_avg}
                          onChange={handleGarminNumberChange}
                          placeholder="0-100"
                          min="0"
                          max="100"
                        />
                      </Form.Group>
                    </Col>

                    {/* Body Battery */}
                    <Col md={12}>
                      <h6 className="text-muted mb-3 mt-2">
                        <FiBattery size={16} className="me-2" />
                        Body Battery
                      </h6>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Au coucher</Form.Label>
                        <Form.Control
                          type="number"
                          name="body_battery_start"
                          value={garminData.body_battery_start}
                          onChange={handleGarminNumberChange}
                          placeholder="0-100"
                          min="0"
                          max="100"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Au réveil</Form.Label>
                        <Form.Control
                          type="number"
                          name="body_battery_end"
                          value={garminData.body_battery_end}
                          onChange={handleGarminNumberChange}
                          placeholder="0-100"
                          min="0"
                          max="100"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              </Collapse>
            </div>

            {/* Medication Section */}
            <div className="mb-3">
              <Button
                onClick={() => toggleSection("medication")}
                variant="link"
                className="section-toggle w-100 text-start p-3 d-flex justify-content-between align-items-center"
                style={{ textDecoration: "none" }}
              >
                <div className="d-flex align-items-center">
                  <FaPills
                    size={20}
                    className="me-3"
                    style={{ color: "var(--primary)" }}
                  />
                  <h5 className="mb-0" style={{ color: "var(--primary-dark)" }}>
                    Médicaments
                    {getSectionBadge("medication")}
                  </h5>
                </div>
                {sectionsOpen.medication ? <FiChevronUp /> : <FiChevronDown />}
              </Button>

              <Collapse in={sectionsOpen.medication}>
                <div className="p-3 border rounded-bottom">
                  <Form.Group>
                    <Form.Check
                      type="checkbox"
                      name="medication"
                      label="Prise de médicament pour le sommeil"
                      checked={formData.medication}
                      onChange={handleChange}
                      className="mb-2"
                    />
                    <Collapse in={formData.medication}>
                      <Form.Control
                        as="textarea"
                        name="medication_details"
                        placeholder="Nom, dosage, heure de prise..."
                        value={formData.medication_details}
                        onChange={handleChange}
                        rows={2}
                      />
                    </Collapse>
                  </Form.Group>
                </div>
              </Collapse>
            </div>

            {/* Notes Section */}
            <div className="mb-4">
              <Button
                onClick={() => toggleSection("notes")}
                variant="link"
                className="section-toggle w-100 text-start p-3 d-flex justify-content-between align-items-center"
                style={{ textDecoration: "none" }}
              >
                <div className="d-flex align-items-center">
                  <FiFileText
                    size={20}
                    className="me-3"
                    style={{ color: "var(--primary)" }}
                  />
                  <h5 className="mb-0" style={{ color: "var(--primary-dark)" }}>
                    Notes
                    {getSectionBadge("notes")}
                  </h5>
                </div>
                {sectionsOpen.notes ? <FiChevronUp /> : <FiChevronDown />}
              </Button>

              <Collapse in={sectionsOpen.notes}>
                <div className="p-3 border rounded-bottom">
                  <Form.Group>
                    <Form.Control
                      as="textarea"
                      name="notes"
                      placeholder="Événements particuliers, stress, rêves, contexte..."
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                    />
                  </Form.Group>
                </div>
              </Collapse>
            </div>

            {/* Buttons */}
            <div className="d-flex gap-2 justify-content-between pt-3 border-top">
              <div>
                {initialData && onDelete && (
                  <Button
                    variant="outline-danger"
                    onClick={handleDeleteClick}
                    className="d-flex align-items-center gap-2"
                  >
                    <FiTrash2 size={16} />
                    Supprimer
                  </Button>
                )}
              </div>
              <div className="d-flex gap-2">
                {onCancel && (
                  <Button
                    variant="outline-secondary"
                    onClick={onCancel}
                    className="btn-outline-custom"
                  >
                    Annuler
                  </Button>
                )}
                <Button type="submit" className="btn-primary-custom">
                  {initialData ? "Mettre à jour" : "Enregistrer"}
                </Button>
              </div>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleDeleteCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center gap-2">
            <FiTrash2 size={20} className="text-danger" />
            Confirmer la suppression
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">
            Êtes-vous sûr de vouloir supprimer cette entrée de sommeil ?
          </p>
          {formData.date && (
            <p className="text-muted mb-0">
              Date :{" "}
              <strong>
                {new Date(formData.date + "T00:00:00").toLocaleDateString(
                  "fr-FR",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              </strong>
            </p>
          )}
          <div className="alert alert-warning mt-3 mb-0">
            <small>⚠️ Cette action est irréversible.</small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleDeleteCancel}>
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Supprimer définitivement
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SleepForm;
