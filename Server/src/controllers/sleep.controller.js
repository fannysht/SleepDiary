import pool from "../../config/db.js";
import pg from "pg";

pg.types.setTypeParser(1082, (val) => val); // date
pg.types.setTypeParser(1114, (val) => val); // timestamp sans zone
pg.types.setTypeParser(1184, (val) => val); // timestamp avec zone

// Transforme les données Garmin de format objet JSON vers format flat
const flattenGarminData = (entry) => {
  if (!entry.garmin_data) {
    return entry;
  }

  const garminData = entry.garmin_data;

  return {
    ...entry,
    garmin_total_sleep: garminData.total_sleep_time,
    garmin_deep_sleep: garminData.deep_sleep_time,
    garmin_light_sleep: garminData.light_sleep_time,
    garmin_rem_sleep: garminData.rem_sleep_time,
    garmin_awake_time: garminData.awake_time,
    garmin_sleep_score: garminData.sleep_score,
    garmin_hrv: garminData.hrv_avg,
    garmin_resting_hr: garminData.resting_heart_rate,
    garmin_respiration: garminData.respiration_avg,
    garmin_stress: garminData.stress_avg,
    garmin_bb_start: garminData.body_battery_start,
    garmin_bb_end: garminData.body_battery_end,
    garmin_data: garminData,
  };
};

// Obtenir toutes les entrées avec un filtrage de date facultatif
export const getEntries = async (req, res) => {
  try {
    const { sleep_period_start, sleep_period_end } = req.query;
    const userId = req.user.userId;

    let query = `
      SELECT 
        se.*,
        gsd.total_sleep_time,
        gsd.deep_sleep_time,
        gsd.light_sleep_time,
        gsd.rem_sleep_time,
        gsd.awake_time,
        gsd.sleep_score,
        gsd.hrv_avg,
        gsd.resting_heart_rate,
        gsd.respiration_avg,
        gsd.stress_avg,
        gsd.body_battery_start,
        gsd.body_battery_end,
        CASE 
          WHEN gsd.id IS NOT NULL THEN
            json_build_object(
              'id', gsd.id,
              'total_sleep_time', gsd.total_sleep_time,
              'deep_sleep_time', gsd.deep_sleep_time,
              'light_sleep_time', gsd.light_sleep_time,
              'rem_sleep_time', gsd.rem_sleep_time,
              'awake_time', gsd.awake_time,
              'sleep_score', gsd.sleep_score,
              'hrv_avg', gsd.hrv_avg,
              'resting_heart_rate', gsd.resting_heart_rate,
              'respiration_avg', gsd.respiration_avg,
              'stress_avg', gsd.stress_avg,
              'body_battery_start', gsd.body_battery_start,
              'body_battery_end', gsd.body_battery_end,
              'created_at', gsd.created_at,
              'updated_at', gsd.updated_at
            )
          ELSE NULL
        END as garmin_data
      FROM sleep_entries se
      LEFT JOIN garmin_sleep_data gsd ON se.id = gsd.sleep_entry_id
      WHERE se.userid = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (sleep_period_start && sleep_period_end) {
      query += ` AND se.date BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(sleep_period_start, sleep_period_end);
      paramIndex += 2;
    } else if (sleep_period_start) {
      query += ` AND se.date >= $${paramIndex}`;
      params.push(sleep_period_start);
      paramIndex++;
    } else if (sleep_period_end) {
      query += ` AND se.date <= $${paramIndex}`;
      params.push(sleep_period_end);
      paramIndex++;
    }

    query += " ORDER BY se.date DESC";

    const result = await pool.query(query, params);

    // Aplatir les données Garmin pour chaque entrée
    const entriesWithFlatGarmin = result.rows.map((entry) => {
      const flattened = { ...entry };

      flattened.garmin_total_sleep = entry.total_sleep_time;
      flattened.garmin_deep_sleep = entry.deep_sleep_time;
      flattened.garmin_light_sleep = entry.light_sleep_time;
      flattened.garmin_rem_sleep = entry.rem_sleep_time;
      flattened.garmin_awake_time = entry.awake_time;
      flattened.garmin_sleep_score = entry.sleep_score;
      flattened.garmin_hrv = entry.hrv_avg;
      flattened.garmin_resting_hr = entry.resting_heart_rate;
      flattened.garmin_respiration = entry.respiration_avg;
      flattened.garmin_stress = entry.stress_avg;
      flattened.garmin_bb_start = entry.body_battery_start;
      flattened.garmin_bb_end = entry.body_battery_end;

      delete flattened.total_sleep_time;
      delete flattened.deep_sleep_time;
      delete flattened.light_sleep_time;
      delete flattened.rem_sleep_time;
      delete flattened.awake_time;
      delete flattened.sleep_score;
      delete flattened.hrv_avg;
      delete flattened.resting_heart_rate;
      delete flattened.respiration_avg;
      delete flattened.stress_avg;
      delete flattened.body_battery_start;
      delete flattened.body_battery_end;

      return flattened;
    });

    res.json(entriesWithFlatGarmin);
  } catch (err) {
    console.error("❌ Error fetching entries:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Obtenir une seule entrée par ID
export const getEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const query = `
      SELECT 
        se.*,
        gsd.total_sleep_time,
        gsd.deep_sleep_time,
        gsd.light_sleep_time,
        gsd.rem_sleep_time,
        gsd.awake_time,
        gsd.sleep_score,
        gsd.hrv_avg,
        gsd.resting_heart_rate,
        gsd.respiration_avg,
        gsd.stress_avg,
        gsd.body_battery_start,
        gsd.body_battery_end,
        CASE 
          WHEN gsd.id IS NOT NULL THEN
            json_build_object(
              'id', gsd.id,
              'total_sleep_time', gsd.total_sleep_time,
              'deep_sleep_time', gsd.deep_sleep_time,
              'light_sleep_time', gsd.light_sleep_time,
              'rem_sleep_time', gsd.rem_sleep_time,
              'awake_time', gsd.awake_time,
              'sleep_score', gsd.sleep_score,
              'hrv_avg', gsd.hrv_avg,
              'resting_heart_rate', gsd.resting_heart_rate,
              'respiration_avg', gsd.respiration_avg,
              'stress_avg', gsd.stress_avg,
              'body_battery_start', gsd.body_battery_start,
              'body_battery_end', gsd.body_battery_end
            )
          ELSE NULL
        END as garmin_data
      FROM sleep_entries se
      LEFT JOIN garmin_sleep_data gsd ON se.id = gsd.sleep_entry_id
      WHERE se.id = $1 AND se.userid = $2
    `;

    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const entry = flattenGarminData(result.rows[0]);
    res.json(entry);
  } catch (err) {
    console.error("Error fetching entry:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Obtenir une seule entrée par date
export const getEntryByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.userId;

    const query = `
      SELECT 
        se.*,
        gsd.total_sleep_time,
        gsd.deep_sleep_time,
        gsd.light_sleep_time,
        gsd.rem_sleep_time,
        gsd.awake_time,
        gsd.sleep_score,
        gsd.hrv_avg,
        gsd.resting_heart_rate,
        gsd.respiration_avg,
        gsd.stress_avg,
        gsd.body_battery_start,
        gsd.body_battery_end,
        CASE 
          WHEN gsd.id IS NOT NULL THEN
            json_build_object(
              'id', gsd.id,
              'total_sleep_time', gsd.total_sleep_time,
              'deep_sleep_time', gsd.deep_sleep_time,
              'light_sleep_time', gsd.light_sleep_time,
              'rem_sleep_time', gsd.rem_sleep_time,
              'awake_time', gsd.awake_time,
              'sleep_score', gsd.sleep_score,
              'hrv_avg', gsd.hrv_avg,
              'resting_heart_rate', gsd.resting_heart_rate,
              'respiration_avg', gsd.respiration_avg,
              'stress_avg', gsd.stress_avg,
              'body_battery_start', gsd.body_battery_start,
              'body_battery_end', gsd.body_battery_end
            )
          ELSE NULL
        END as garmin_data
      FROM sleep_entries se
      LEFT JOIN garmin_sleep_data gsd ON se.id = gsd.sleep_entry_id
      WHERE se.date = $1 AND se.userid = $2
    `;

    const result = await pool.query(query, [date, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const entry = flattenGarminData(result.rows[0]);
    res.json(entry);
  } catch (err) {
    console.error("Error fetching entry:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Créer une nouvelle entrée de sommeil
export const createEntry = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      date,
      wake_time,
      lights_off_time,
      sleep_period_start,
      sleep_period_end,
      night_awakenings,
      fatigue_level,
      sleepiness_level,
      involuntary_nap,
      involuntary_nap_duration,
      voluntary_nap,
      voluntary_nap_duration,
      sleep_quality,
      wake_quality,
      medication,
      medication_details,
      notes,
      action_log,
      entry_type,
      alarm_set,
      first_alarm_time,
      garmin_data,
    } = req.body;

    const userId = req.user.userId;

    const result = await client.query(
      `INSERT INTO sleep_entries (
        userid, date, wake_time, lights_off_time, sleep_period_start, sleep_period_end,
        night_awakenings, fatigue_level, sleepiness_level,
        involuntary_nap, involuntary_nap_duration, voluntary_nap, voluntary_nap_duration,
        sleep_quality, wake_quality, medication, medication_details, notes, action_log,
        entry_type, alarm_set, first_alarm_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        userId,
        date,
        wake_time,
        lights_off_time,
        sleep_period_start,
        sleep_period_end,
        night_awakenings,
        fatigue_level,
        sleepiness_level,
        involuntary_nap,
        involuntary_nap_duration,
        voluntary_nap,
        voluntary_nap_duration,
        sleep_quality,
        wake_quality,
        medication,
        medication_details,
        notes,
        action_log ? JSON.stringify(action_log) : "[]",
        entry_type || "main_sleep",
        alarm_set || false,
        alarm_set ? first_alarm_time : null,
      ],
    );

    const newEntry = result.rows[0];

    if (
      garmin_data &&
      Object.values(garmin_data).some(
        (v) => v !== null && v !== "" && v !== undefined,
      )
    ) {
      const garminResult = await client.query(
        `INSERT INTO garmin_sleep_data (
          sleep_entry_id,
          total_sleep_time, deep_sleep_time, light_sleep_time, rem_sleep_time,
          awake_time, sleep_score, hrv_avg,
          resting_heart_rate, respiration_avg, stress_avg,
          body_battery_start, body_battery_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          newEntry.id,
          garmin_data.total_sleep_time || null,
          garmin_data.deep_sleep_time || null,
          garmin_data.light_sleep_time || null,
          garmin_data.rem_sleep_time || null,
          garmin_data.awake_time || null,
          garmin_data.sleep_score || null,
          garmin_data.hrv_avg || null,
          garmin_data.resting_heart_rate || null,
          garmin_data.respiration_avg || null,
          garmin_data.stress_avg || null,
          garmin_data.body_battery_start || null,
          garmin_data.body_battery_end || null,
        ],
      );

      newEntry.garmin_data = garminResult.rows[0];
    }

    await client.query("COMMIT");

    const flatEntry = flattenGarminData(newEntry);

    res.status(201).json(flatEntry);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating entry:", err);

    if (err.code === "23505") {
      return res.status(409).json({
        error: "Une entrée de sommeil principal existe déjà pour cette date",
        message:
          "Vous ne pouvez avoir qu'un seul sommeil principal par jour. Utilisez le type 'sieste' pour les entrées supplémentaires.",
      });
    }

    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  } finally {
    client.release();
  }
};

// Mettre à jour l'entrée de sommeil
export const updateEntry = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { id } = req.params;
    const userId = req.user.userId;
    const {
      date,
      wake_time,
      lights_off_time,
      sleep_period_start,
      sleep_period_end,
      night_awakenings,
      fatigue_level,
      sleepiness_level,
      involuntary_nap,
      involuntary_nap_duration,
      voluntary_nap,
      voluntary_nap_duration,
      sleep_quality,
      wake_quality,
      medication,
      medication_details,
      notes,
      entry_type,
      alarm_set,
      first_alarm_time,
      garmin_data,
    } = req.body;

    // Vérifier que l'entrée appartient à l'utilisateur
    const checkOwnership = await client.query(
      "SELECT userid FROM sleep_entries WHERE id = $1",
      [id],
    );

    if (checkOwnership.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Entry not found" });
    }

    if (checkOwnership.rows[0].userid !== userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Mettre à jour l'entrée principale
    const result = await client.query(
      `UPDATE sleep_entries SET
        date = $1, wake_time = $2, lights_off_time = $3, sleep_period_start = $4,
        sleep_period_end = $5, night_awakenings = $6, fatigue_level = $7,
        sleepiness_level = $8, involuntary_nap = $9, involuntary_nap_duration = $10,
        voluntary_nap = $11, voluntary_nap_duration = $12, sleep_quality = $13,
        wake_quality = $14, medication = $15, medication_details = $16, notes = $17,
        entry_type = $18, alarm_set = $19, first_alarm_time = $20
      WHERE id = $21
      RETURNING *`,
      [
        date,
        wake_time,
        lights_off_time,
        sleep_period_start,
        sleep_period_end,
        night_awakenings,
        fatigue_level,
        sleepiness_level,
        involuntary_nap,
        involuntary_nap_duration,
        voluntary_nap,
        voluntary_nap_duration,
        sleep_quality,
        wake_quality,
        medication,
        medication_details,
        notes,
        entry_type,
        alarm_set || false,
        alarm_set ? first_alarm_time : null,
        id,
      ],
    );

    const updatedEntry = result.rows[0];

    // Gérer les données Garmin
    if (garmin_data) {
      const hasGarminData = Object.values(garmin_data).some(
        (v) => v !== null && v !== "" && v !== undefined,
      );

      if (hasGarminData) {
        // Vérifier si des données Garmin existent déjà
        const garminCheckQuery =
          "SELECT id FROM garmin_sleep_data WHERE sleep_entry_id = $1";
        const garminCheck = await client.query(garminCheckQuery, [id]);

        if (garminCheck.rows.length > 0) {
          const garminUpdateResult = await client.query(
            `UPDATE garmin_sleep_data SET
              total_sleep_time = $1,
              deep_sleep_time = $2,
              light_sleep_time = $3,
              rem_sleep_time = $4,
              awake_time = $5,
              sleep_score = $6,
              hrv_avg = $7,
              resting_heart_rate = $8,
              respiration_avg = $9,
              stress_avg = $10,
              body_battery_start = $11,
              body_battery_end = $12
            WHERE sleep_entry_id = $13
            RETURNING *`,
            [
              garmin_data.total_sleep_time || null,
              garmin_data.deep_sleep_time || null,
              garmin_data.light_sleep_time || null,
              garmin_data.rem_sleep_time || null,
              garmin_data.awake_time || null,
              garmin_data.sleep_score || null,
              garmin_data.hrv_avg || null,
              garmin_data.resting_heart_rate || null,
              garmin_data.respiration_avg || null,
              garmin_data.stress_avg || null,
              garmin_data.body_battery_start || null,
              garmin_data.body_battery_end || null,
              id,
            ],
          );
          updatedEntry.garmin_data = garminUpdateResult.rows[0];
        } else {
          const garminInsertResult = await client.query(
            `INSERT INTO garmin_sleep_data (
              sleep_entry_id,
              total_sleep_time, deep_sleep_time, light_sleep_time, rem_sleep_time,
              awake_time, sleep_score, hrv_avg,
              resting_heart_rate, respiration_avg, stress_avg,
              body_battery_start, body_battery_end
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
            [
              id,
              garmin_data.total_sleep_time || null,
              garmin_data.deep_sleep_time || null,
              garmin_data.light_sleep_time || null,
              garmin_data.rem_sleep_time || null,
              garmin_data.awake_time || null,
              garmin_data.sleep_score || null,
              garmin_data.hrv_avg || null,
              garmin_data.resting_heart_rate || null,
              garmin_data.respiration_avg || null,
              garmin_data.stress_avg || null,
              garmin_data.body_battery_start || null,
              garmin_data.body_battery_end || null,
            ],
          );
          updatedEntry.garmin_data = garminInsertResult.rows[0];
        }
      } else {
        await client.query(
          "DELETE FROM garmin_sleep_data WHERE sleep_entry_id = $1",
          [id],
        );
        updatedEntry.garmin_data = null;
      }
    }

    await client.query("COMMIT");

    const flatEntry = flattenGarminData(updatedEntry);

    res.json(flatEntry);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating entry:", err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  } finally {
    client.release();
  }
};

// Supprimer l'entrée de sommeil
export const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      "DELETE FROM sleep_entries WHERE id = $1 AND userid = $2 RETURNING *",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ message: "Entry deleted successfully", entry: result.rows[0] });
  } catch (err) {
    console.error("❌ Error deleting entry:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mise à jour du status de l'user
export const updateStatus = async (req, res) => {
  const { status } = req.body;
  const userId = req.user.userId;

  const validStatuses = ["AWAKE", "IN_BED", "SLEEPING", "NAP_ONGOING"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: "Invalid status",
      validStatuses,
    });
  }

  try {
    await pool.query(
      "UPDATE users SET current_status = $1, last_status_update = CURRENT_TIMESTAMP WHERE id = $2",
      [status, userId],
    );

    res.json({ success: true, current_status: status });
  } catch (error) {
    console.error("❌ Error updating status:", error);
    res.status(500).json({ error: error.message });
  }
};

// Recuperer le status actuel de l'user
export const getCurrentStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      "SELECT current_status, last_status_update FROM users WHERE id = $1",
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      current_status: result.rows[0].current_status,
      last_update: result.rows[0].last_status_update,
    });
  } catch (error) {
    console.error("❌ Error getting status:", error);
    res.status(500).json({ error: error.message });
  }
};