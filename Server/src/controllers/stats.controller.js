import pool from "../../config/db.js";

// Récuperer les stats
export const getStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_entries,
        ROUND(AVG(sleep_quality)::numeric, 1) as avg_sleep_quality,
        ROUND(AVG(wake_quality)::numeric, 1) as avg_wake_quality,
        ROUND(AVG(fatigue_level)::numeric, 1) as avg_fatigue,
        ROUND(AVG(sleepiness_level)::numeric, 1) as avg_sleepiness,
        ROUND(AVG(sleepiness_level)::numeric, 1) AS avg_sleepiness,
        justify_interval(
        AVG(sleep_period_end - first_alarm_time)
        ) AS avg_diff_time
        FROM sleep_entries
        `;

    const params = [];

    if (start_date && end_date) {
      query += " WHERE date BETWEEN $1 AND $2";
      params.push(start_date, end_date);
    }

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Récuperer les stats Garmin
export const getGarminStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_entries_with_garmin,
        ROUND(AVG(gsd.sleep_score), 2) as avg_sleep_score,
        ROUND(AVG(gsd.total_sleep_time), 2) as avg_total_sleep,
        ROUND(AVG(gsd.deep_sleep_time), 2) as avg_deep_sleep,
        ROUND(AVG(gsd.light_sleep_time), 2) as avg_light_sleep,
        ROUND(AVG(gsd.rem_sleep_time), 2) as avg_rem_sleep,
        ROUND(AVG(gsd.hrv_avg), 2) as avg_hrv,
        ROUND(AVG(gsd.resting_heart_rate), 2) as avg_resting_hr,
        ROUND(AVG(gsd.body_battery_end - gsd.body_battery_start), 2) as avg_battery_gain,
        ROUND(AVG(gsd.stress_avg), 2) as avg_stress
      FROM sleep_entries se
      INNER JOIN garmin_sleep_data gsd ON se.id = gsd.sleep_entry_id
      WHERE se.userid = $1
    `;

    const values = [userId];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND se.date >= $${paramIndex}`;
      values.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND se.date <= $${paramIndex}`;
      values.push(end_date);
    }

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error fetching Garmin stats:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};