import React, { useState, useMemo } from "react";
import {
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  ComposedChart,
} from "recharts";
import {
  FiMoon,
  FiSun,
  FiTrendingUp,
  FiZap,
  FiActivity,
  FiHeart,
  FiBattery,
  FiTarget,
} from "react-icons/fi";
import "../styles/graphPage.css";
import ExportButton from "./exportButton";

function parseTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

function formatHours(decimal) {
  if (decimal == null || isNaN(decimal)) return "–";
  const h = Math.floor(Math.abs(decimal));
  const m = Math.round((Math.abs(decimal) - h) * 60);
  return `${h}h${m.toString().padStart(2, "0")}`;
}

function minutesToHours(minutes) {
  if (minutes == null || isNaN(minutes)) return null;
  return Math.round((minutes / 60) * 10) / 10;
}

function calcSleepDuration(entry) {
  const start = parseTime(entry.sleep_period_start);
  const end = parseTime(entry.sleep_period_end);
  if (start == null || end == null) return null;
  let duration = end - start;
  if (duration < 0) duration += 24;
  return Math.round(duration * 10) / 10;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

const SleepTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="gp-tooltip">
      <div className="gp-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="gp-tooltip__row" style={{ color: p.color }}>
          <span className="gp-tooltip__name">{p.name}</span>
          <span className="gp-tooltip__value">
            {typeof p.value === "number"
              ? p.name?.includes("Qualité") || p.name?.includes("Score")
                ? `${p.value}/10`
                : formatHours(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const QualityTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="gp-tooltip">
      <div className="gp-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="gp-tooltip__row" style={{ color: p.color }}>
          <span className="gp-tooltip__name">{p.name}</span>
          <span className="gp-tooltip__value">
            {p.name?.includes("Garmin") ? `${p.value}/100` : `${p.value}/10`}
          </span>
        </div>
      ))}
    </div>
  );
};

const LatenceTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="gp-tooltip">
      <div className="gp-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="gp-tooltip__row" style={{ color: p.color }}>
          <span className="gp-tooltip__name">{p.name}</span>
          <span className="gp-tooltip__value">{p.value}min</span>
        </div>
      ))}
    </div>
  );
};

const ReveilTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="gp-tooltip">
      <div className="gp-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="gp-tooltip__row" style={{ color: p.color }}>
          <span className="gp-tooltip__name">{p.name}</span>
          <span className="gp-tooltip__value">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const GarminTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="gp-tooltip">
      <div className="gp-tooltip__label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="gp-tooltip__row" style={{ color: p.color }}>
          <span className="gp-tooltip__name">{p.name}</span>
          <span className="gp-tooltip__value">
            {p.name?.includes("BPM")
              ? `${p.value} bpm`
              : p.name?.includes("HRV")
                ? `${p.value} ms`
                : p.name?.includes("Respiration")
                  ? `${p.value} /min`
                  : p.name?.includes("Battery")
                    ? `${p.value}%`
                    : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const SleepStagesTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);

  return (
    <div className="gp-tooltip">
      <div className="gp-tooltip__label">{label}</div>
      <div className="gp-tooltip__total">Total: {formatHours(total)}</div>
      {payload.map((p, i) => (
        <div key={i} className="gp-tooltip__row" style={{ color: p.color }}>
          <span className="gp-tooltip__name">{p.name}</span>
          <span className="gp-tooltip__value">{formatHours(p.value)}</span>
          <span className="gp-tooltip__percent">
            ({total > 0 ? Math.round((p.value / total) * 100) : 0}%)
          </span>
        </div>
      ))}
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, sub, accent, badge }) => (
  <div className="gp-kpi" style={{ "--kpi-accent": accent }}>
    <div className="gp-kpi__icon">
      <Icon size={18} />
    </div>
    <div className="gp-kpi__body">
      <div className="gp-kpi__value">
        {value}
        {badge && <span className="gp-kpi__badge">{badge}</span>}
      </div>
      <div className="gp-kpi__label">{label}</div>
      {sub && <div className="gp-kpi__sub">{sub}</div>}
    </div>
  </div>
);

const ChartCard = ({ title, subtitle, children, badge }) => (
  <div className="gp-chart-card">
    <div className="gp-chart-card__header">
      <div>
        <h3 className="gp-chart-card__title">
          {title}
          {badge && <span className="gp-chart-card__badge">{badge}</span>}
        </h3>
        {subtitle && <p className="gp-chart-card__sub">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const PERIODS = ["7j", "30j", "90j", "Tout"];

export default function GraphPage({ entries = [], userName = "" }) {
  const [period, setPeriod] = useState("30j");

  const filtered = useMemo(() => {
    const mainEntries = entries.filter((e) => e.entry_type === "main_sleep");
    const sorted = [...mainEntries].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    if (period === "Tout") return sorted;
    const days = period === "7j" ? 7 : period === "30j" ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return sorted.filter((e) => new Date(e.date) >= cutoff);
  }, [entries, period]);

  const hasGarminData = useMemo(() => {
    return filtered.some(
      (e) =>
        e.garmin_total_sleep != null ||
        e.garmin_sleep_score != null ||
        e.garmin_deep_sleep != null,
    );
  }, [filtered]);

  const chartData = useMemo(
    () =>
      filtered.map((e) => ({
        date: formatDate(e.date),
        duration: calcSleepDuration(e),
        quality: e.sleep_quality ?? null,
        latency: e.sleep_latency ?? null,
        awakenings: e.night_awakenings ?? null,
        garminDuration: minutesToHours(e.garmin_total_sleep),
        garminDeep: minutesToHours(e.garmin_deep_sleep),
        garminLight: minutesToHours(e.garmin_light_sleep),
        garminRem: minutesToHours(e.garmin_rem_sleep),
        garminAwake: minutesToHours(e.garmin_awake_time),
        garminScore: e.garmin_sleep_score ?? null,
        garminHRV: e.garmin_hrv ?? null,
        garminHR: e.garmin_resting_hr ?? null,
        garminRespiration: e.garmin_respiration ?? null,
        garminStress: e.garmin_stress ?? null,
        garminBBStart: e.garmin_bb_start ?? null,
        garminBBEnd: e.garmin_bb_end ?? null,
        garminBBGain:
          e.garmin_bb_end != null && e.garmin_bb_start != null
            ? e.garmin_bb_end - e.garmin_bb_start
            : null,
      })),
    [filtered],
  );

  const kpis = useMemo(() => {
    const valid = chartData.filter((d) => d.duration != null);
    const avgDuration =
      valid.length > 0
        ? valid.reduce((s, d) => s + d.duration, 0) / valid.length
        : null;

    const qualValid = chartData.filter((d) => d.quality != null);
    const avgQuality =
      qualValid.length > 0
        ? qualValid.reduce((s, d) => s + d.quality, 0) / qualValid.length
        : null;

    const latValid = chartData.filter((d) => d.latency != null);
    const avgLatency =
      latValid.length > 0
        ? latValid.reduce((s, d) => s + d.latency, 0) / latValid.length
        : null;

    const awk = chartData.filter((d) => d.awakenings != null);
    const avgAwk =
      awk.length > 0
        ? awk.reduce((s, d) => s + d.awakenings, 0) / awk.length
        : null;

    const garminScoreValid = chartData.filter((d) => d.garminScore != null);
    const avgGarminScore =
      garminScoreValid.length > 0
        ? garminScoreValid.reduce((s, d) => s + d.garminScore, 0) /
          garminScoreValid.length
        : null;

    const garminHRVValid = chartData.filter((d) => d.garminHRV != null);
    const avgGarminHRV =
      garminHRVValid.length > 0
        ? garminHRVValid.reduce((s, d) => s + d.garminHRV, 0) /
          garminHRVValid.length
        : null;

    const garminHRValid = chartData.filter((d) => d.garminHR != null);
    const avgGarminHR =
      garminHRValid.length > 0
        ? garminHRValid.reduce((s, d) => s + d.garminHR, 0) /
          garminHRValid.length
        : null;

    const garminBBGainValid = chartData.filter((d) => d.garminBBGain != null);
    const avgGarminBBGain =
      garminBBGainValid.length > 0
        ? garminBBGainValid.reduce((s, d) => s + d.garminBBGain, 0) /
          garminBBGainValid.length
        : null;

    return {
      avgDuration,
      avgQuality,
      avgLatency,
      avgAwk,
      avgGarminScore,
      avgGarminHRV,
      avgGarminHR,
      avgGarminBBGain,
      count: filtered.length,
    };
  }, [chartData, filtered]);

  const trend = useMemo(() => {
    const valid = chartData.filter((d) => d.duration != null);
    if (valid.length < 4) return null;
    const mid = Math.floor(valid.length / 2);
    const first = valid.slice(0, mid).reduce((s, d) => s + d.duration, 0) / mid;
    const second =
      valid.slice(mid).reduce((s, d) => s + d.duration, 0) /
      (valid.length - mid);
    return Math.round((second - first) * 10) / 10;
  }, [chartData]);

  const axisStyle = {
    fill: "var(--text-muted)",
    fontSize: 11,
    fontFamily: "var(--font-body)",
  };

  return (
    <div className="gp-root">
      <div className="gp-header">
        <div className="gp-header__left">
          <span className="gp-eyebrow">Analyse du sommeil</span>
          <h1 className="gp-title">
            <FiMoon className="gp-title__icon" />
            Graphiques
            {hasGarminData && (
              <span className="gp-title__badge">
                <FiActivity size={14} /> Garmin
              </span>
            )}
          </h1>
          <p className="gp-subtitle">
            {kpis.count} nuit{kpis.count > 1 ? "s" : ""} analysée
            {kpis.count > 1 ? "s" : ""}
          </p>
        </div>

        <div className="gp-header__right">
          <div className="gp-period-selector">
            {PERIODS.map((p) => (
              <button
                key={p}
                className={`gp-period-btn ${period === p ? "gp-period-btn--active" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <ExportButton entries={entries} userName={userName} />
        </div>
      </div>

      {kpis.count === 0 && (
        <div className="gp-empty">
          <FiMoon size={48} className="gp-empty__icon" />
          <p className="gp-empty__text">Aucune donnée pour cette période</p>
          <p className="gp-empty__sub">
            Ajoutez des entrées de sommeil pour voir vos graphiques
          </p>
        </div>
      )}

      {kpis.count > 0 && (
        <>
          <div className="gp-kpi-grid">
            <KpiCard
              icon={FiMoon}
              label="Durée moyenne"
              value={kpis.avgDuration != null ? formatHours(kpis.avgDuration) : "–"}
              sub="par nuit"
              accent="var(--prussian-blue)"
            />
            <KpiCard
              icon={FiZap}
              label="Qualité moyenne"
              value={
                kpis.avgQuality != null ? `${kpis.avgQuality.toFixed(1)}/10` : "–"
              }
              sub="score subjectif"
              accent="var(--azure-blue)"
            />
            {hasGarminData && (
              <>
                <KpiCard
                  icon={FiTarget}
                  label="Score Garmin"
                  value={
                    kpis.avgGarminScore != null
                      ? `${Math.round(kpis.avgGarminScore)}/100`
                      : "–"
                  }
                  sub="score objectif"
                  accent="var(--strong-blue)"
                  badge="Garmin"
                />
                <KpiCard
                  icon={FiHeart}
                  label="HRV moyenne"
                  value={
                    kpis.avgGarminHRV != null
                      ? `${Math.round(kpis.avgGarminHRV)} ms`
                      : "–"
                  }
                  sub="variabilité cardiaque"
                  accent="var(--steel-blue)"
                  badge="Garmin"
                />
              </>
            )}
            {!hasGarminData && (
              <>
                <KpiCard
                  icon={FiSun}
                  label="Latence moyenne"
                  value={
                    kpis.avgLatency != null
                      ? `${Math.round(kpis.avgLatency)} min`
                      : "–"
                  }
                  sub="avant endormissement"
                  accent="var(--steel-blue)"
                />
                <KpiCard
                  icon={FiTrendingUp}
                  label="Tendance durée"
                  value={
                    trend != null
                      ? `${trend > 0 ? "+" : ""}${formatHours(Math.abs(trend))}`
                      : "–"
                  }
                  sub={
                    trend != null
                      ? trend >= 0
                        ? "▲ en amélioration"
                        : "▼ en baisse"
                      : "données insuffisantes"
                  }
                  accent={
                    trend != null && trend < 0
                      ? "var(--air-blue)"
                      : "var(--strong-blue)"
                  }
                />
              </>
            )}
          </div>

          {hasGarminData && (
            <div className="gp-kpi-grid gp-kpi-grid--secondary">
              <KpiCard
                icon={FiHeart}
                label="FC repos moyenne"
                value={
                  kpis.avgGarminHR != null
                    ? `${Math.round(kpis.avgGarminHR)} bpm`
                    : "–"
                }
                sub="fréquence cardiaque"
                accent="var(--air-blue)"
              />
              <KpiCard
                icon={FiBattery}
                label="Body Battery"
                value={
                  kpis.avgGarminBBGain != null
                    ? `${kpis.avgGarminBBGain > 0 ? "+" : ""}${Math.round(kpis.avgGarminBBGain)}%`
                    : "–"
                }
                sub="gain moyen par nuit"
                accent={
                  kpis.avgGarminBBGain != null && kpis.avgGarminBBGain > 0
                    ? "var(--strong-blue)"
                    : "var(--light-steel)"
                }
              />
              <KpiCard
                icon={FiSun}
                label="Latence moyenne"
                value={
                  kpis.avgLatency != null
                    ? `${Math.round(kpis.avgLatency)} min`
                    : "–"
                }
                sub="avant endormissement"
                accent="var(--steel-blue)"
              />
              <KpiCard
                icon={FiTrendingUp}
                label="Tendance durée"
                value={
                  trend != null
                    ? `${trend > 0 ? "+" : ""}${formatHours(Math.abs(trend))}`
                    : "–"
                }
                sub={
                  trend != null
                    ? trend >= 0
                      ? "▲ en amélioration"
                      : "▼ en baisse"
                    : "données insuffisantes"
                }
                accent={
                  trend != null && trend < 0
                    ? "var(--air-blue)"
                    : "var(--strong-blue)"
                }
              />
            </div>
          )}

          <div className="gp-charts-grid">
            <div className="gp-charts-grid__wide">
              <ChartCard
                title="Durée de sommeil"
                subtitle={
                  hasGarminData
                    ? "Comparaison données subjectives vs Garmin"
                    : "Heures de sommeil par nuit"
                }
                badge={hasGarminData ? "Garmin" : null}
              >
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="durGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--strong-blue)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--strong-blue)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                      <linearGradient
                        id="garminDurGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--azure-blue)"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--azure-blue)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}h`}
                      domain={[0, 12]}
                    />
                    <Tooltip content={<SleepTooltip />} />
                    <Legend
                      wrapperStyle={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-body)",
                        paddingTop: 8,
                      }}
                    />
                    <ReferenceLine
                      y={8}
                      stroke="var(--azure-blue)"
                      strokeDasharray="4 4"
                      strokeOpacity={0.5}
                    />

                    {hasGarminData && (
                      <Area
                        type="monotone"
                        dataKey="garminDuration"
                        name="Durée Garmin"
                        stroke="var(--azure-blue)"
                        strokeWidth={1.5}
                        fill="url(#garminDurGrad)"
                        dot={false}
                        connectNulls
                      />
                    )}

                    <Area
                      type="monotone"
                      dataKey="duration"
                      name="Durée subjective"
                      stroke="var(--strong-blue)"
                      strokeWidth={2.5}
                      fill="url(#durGrad)"
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: "var(--strong-blue)",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {hasGarminData && (
              <div className="gp-charts-grid__wide">
                <ChartCard
                  title="Phases de sommeil"
                  subtitle="Répartition détaillée du sommeil (données Garmin)"
                  badge="Garmin"
                >
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient id="deepGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.9} />
                          <stop
                            offset="100%"
                            stopColor="#1e3a8a"
                            stopOpacity={0.6}
                          />
                        </linearGradient>
                        <linearGradient id="lightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="var(--azure-blue)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--azure-blue)"
                            stopOpacity={0.5}
                          />
                        </linearGradient>
                        <linearGradient id="remGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="var(--strong-blue)"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--strong-blue)"
                            stopOpacity={0.5}
                          />
                        </linearGradient>
                        <linearGradient id="awakeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="var(--air-blue)"
                            stopOpacity={0.6}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--air-blue)"
                            stopOpacity={0.3}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 4"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={axisStyle}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={axisStyle}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}h`}
                      />
                      <Tooltip content={<SleepStagesTooltip />} />
                      <Legend
                        wrapperStyle={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-body)",
                          paddingTop: 8,
                        }}
                      />
                      <Bar
                        dataKey="garminDeep"
                        name="Profond"
                        stackId="sleep"
                        fill="url(#deepGrad)"
                      />
                      <Bar
                        dataKey="garminLight"
                        name="Léger"
                        stackId="sleep"
                        fill="url(#lightGrad)"
                      />
                      <Bar
                        dataKey="garminRem"
                        name="REM"
                        stackId="sleep"
                        fill="url(#remGrad)"
                      />
                      <Bar
                        dataKey="garminAwake"
                        name="Éveillé"
                        stackId="sleep"
                        fill="url(#awakeGrad)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            <ChartCard
              title={
                hasGarminData
                  ? "Qualité subjective vs Garmin"
                  : "Qualité subjective"
              }
              subtitle={
                hasGarminData
                  ? "Comparaison perception vs données objectives"
                  : "Score de 0 à 10 auto-évalué"
              }
              badge={hasGarminData ? "Garmin" : null}
            >
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="qualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--azure-blue)"
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--azure-blue)"
                        stopOpacity={0.25}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 4"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 10]}
                  />
                  {hasGarminData && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                  )}
                  <Tooltip content={<QualityTooltip />} />
                  {hasGarminData && (
                    <Legend
                      wrapperStyle={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-body)",
                        paddingTop: 8,
                      }}
                    />
                  )}
                  <Bar
                    yAxisId="left"
                    dataKey="quality"
                    name="Qualité perçue (/10)"
                    fill="url(#qualGrad)"
                    radius={[5, 5, 0, 0]}
                  />
                  {hasGarminData && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="garminScore"
                      name="Score Garmin (/100)"
                      stroke="var(--strong-blue)"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Latence d'endormissement"
              subtitle="Minutes avant de s'endormir"
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 4"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}m`}
                  />
                  <Tooltip content={<LatenceTooltip />} />
                  <ReferenceLine
                    y={20}
                    stroke="var(--light-steel)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    name="Latence (min)"
                    stroke="var(--air-blue)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: "var(--air-blue)",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Réveils nocturnes"
              subtitle="Nombre d'interruptions par nuit"
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartData}
                  barCategoryGap="40%"
                  margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="awkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--steel-blue)"
                        stopOpacity={0.85}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--steel-blue)"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 4"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={axisStyle}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ReveilTooltip />} />
                  <Bar
                    dataKey="awakenings"
                    name="Réveils"
                    fill="url(#awkGrad)"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {hasGarminData && (
              <>
                <ChartCard
                  title="Métriques cardiovasculaires"
                  subtitle="HRV et fréquence cardiaque au repos"
                  badge="Garmin"
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 8, right: 24, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" />
                      <XAxis
                        dataKey="date"
                        tick={axisStyle}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        yAxisId="left"
                        tick={axisStyle}
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: "HRV (ms)",
                          angle: -90,
                          position: "insideLeft",
                          style: axisStyle,
                        }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={axisStyle}
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: "FC (bpm)",
                          angle: 90,
                          position: "insideRight",
                          style: axisStyle,
                        }}
                      />
                      <Tooltip content={<GarminTooltip />} />
                      <Legend
                        wrapperStyle={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-body)",
                          paddingTop: 8,
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="garminHRV"
                        name="HRV (ms)"
                        stroke="var(--strong-blue)"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="garminHR"
                        name="FC repos (BPM)"
                        stroke="var(--air-blue)"
                        strokeWidth={2}
                        strokeDasharray="5 3"
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Body Battery & Stress"
                  subtitle="Récupération énergétique et niveau de stress"
                  badge="Garmin"
                >
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                    >
                      <defs>
                        <linearGradient id="bbGainGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="var(--strong-blue)"
                            stopOpacity={0.7}
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--strong-blue)"
                            stopOpacity={0.3}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 4"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={axisStyle}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        yAxisId="left"
                        tick={axisStyle}
                        axisLine={false}
                        tickLine={false}
                        domain={[-20, 100]}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={axisStyle}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip content={<GarminTooltip />} />
                      <Legend
                        wrapperStyle={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-body)",
                          paddingTop: 8,
                        }}
                      />
                      <ReferenceLine
                        yAxisId="left"
                        y={0}
                        stroke="var(--border)"
                        strokeDasharray="3 3"
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="garminBBGain"
                        name="Gain Body Battery (%)"
                        fill="url(#bbGainGrad)"
                        radius={[5, 5, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="garminStress"
                        name="Stress moyen"
                        stroke="var(--steel-blue)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartCard>
              </>
            )}

            <div className="gp-charts-grid__wide">
              <ChartCard
                title="Vue combinée — Durée & Qualité"
                subtitle="Corrélation entre durée de sommeil et qualité ressentie"
              >
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 24, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="left"
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}h`}
                      domain={[0, 12]}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={axisStyle}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 10]}
                      tickFormatter={(v) => `${v}/10`}
                    />
                    <Tooltip content={<SleepTooltip />} />
                    <Legend
                      wrapperStyle={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-body)",
                        paddingTop: 8,
                      }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="duration"
                      name="Durée (h)"
                      stroke="var(--strong-blue)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="quality"
                      name="Qualité (/10)"
                      stroke="var(--azure-blue)"
                      strokeWidth={2}
                      strokeDasharray="5 3"
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}