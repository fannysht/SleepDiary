import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../../config/db.js";
import { v4 as uuidv4 } from "uuid";
import { generateOTP } from "../utils/otpGenerator.js";
import sendOTPEmail from "../utils/emailService.js";

const JWT_SECRET = process.env.JWT_SECRET;
const generateId = () => uuidv4();

// Contrôleur pour la connexion
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    // Recherche de l'utilisateur dans la base
    const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (userQuery.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    const user = userQuery.rows[0];

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.passworduser);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // Mise à jour de la date de dernière connexion
    await pool.query(
      "UPDATE users SET lastlogin = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id],
    );

    // Génération du token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // Retour des données
    res.json({
      success: true,
      message: "Connexion réussie",
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          birthDate: user.birth_date,
          lastLogin: user.last_login,
        },
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion",
    });
  }
};

// Contrôleur pour l'inscription
export const register = async (req, res) => {
  const { firstName, lastName, email, password, birthDate } = req.body;

  try {
    // Validation des champs
    if (!firstName || !lastName || !email || !password || !birthDate) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format d'email invalide",
      });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères",
      });
    }

    // Vérification si l'email existe déjà
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    // Hashage du mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = generateId();
    const now = new Date();

    // Insertion de l'utilisateur
    const newUser = await pool.query(
      `INSERT INTO users ( id, firstname, lastname, email, passworduser, birthdate, createdat, updatedat) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, firstname, lastname, email, passworduser, birthdate, createdat, updatedat`,
      [userId, firstName, lastName, email, passwordHash, birthDate, now, now],
    );

    const user = newUser.rows[0];

    // Génération du token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      message: "Compte créé avec succès",
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          birthDate: user.birth_date,
        },
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de l'inscription",
    });
  }
};

// Contrôleur pour vérifier le token
export const verifyToken = async (req, res) => {
  try {
    const userQuery = await pool.query(
      "SELECT id, first_name, last_name, email, birth_date FROM users WHERE id = $1",
      [req.user.userId],
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    const user = userQuery.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          birthDate: user.birth_date,
        },
      },
    });
  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

// Controlleur pour la deconnexion
export const logout = async (req, res) => {
  try {
    // Note: localStorage doesn't exist in Node.js server-side
    // This should be handled on the client-side
    res.json({
      success: true,
      message: "Déconnexion réussie",
    });
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

// Récupérer l'utilisateur connecté
export const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await pool.query(
      `SELECT 
      *
      FROM users 
      WHERE id = $1`,
      [userId],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    const user = userResult.rows[0];

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("❌ Erreur getMe:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

// Mot de passe oublié
export const forgotPassword = async (req, res) => {
  const client = await pool.connect();
  const { email } = req.body;

  try {
    const code = generateOTP();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    const result = await client.query(
      "UPDATE users SET reset_password_code = $1, reset_password_expires = $2, otp_attempts = 0 WHERE email = $3",
      [code, expires, email],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Envoi de l'email
    await sendOTPEmail(email, code);

    res.status(200).json({ status: "success", message: "Code envoyé !" });
  } catch (error) {
    console.error("Erreur Email:", error);
    res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
  } finally {
    client.release();
  }
};

// Verification du code otp
export const verifyCode = async (req, res) => {
  const client = await pool.connect();
  const { email, code } = req.body;

  try {
    const userRes = await client.query(
      "SELECT id, reset_password_code, reset_password_expires, otp_attempts FROM users WHERE email = $1",
      [email],
    );

    if (userRes.rowCount === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const user = userRes.rows[0];

    // Vérifier si le compte est bloqué (trop de tentatives)
    if (user.otp_attempts >= 3) {
      return res.status(403).json({
        message: "Trop de tentatives. Veuillez redemander un nouveau code.",
      });
    }

    // Vérifier si le code a expiré
    if (new Date() > new Date(user.reset_password_expires)) {
      return res
        .status(400)
        .json({ message: "Code expiré (15 min écoulées)." });
    }

    // Vérifier si le code est correct
    if (user.reset_password_code !== code) {
      await client.query(
        "UPDATE users SET otp_attempts = otp_attempts + 1 WHERE email = $1",
        [email],
      );

      const remaining = 3 - (user.otp_attempts + 1);
      return res.status(400).json({
        message: `Code incorrect. Il vous reste ${remaining} essai(s).`,
      });
    }

    await client.query("UPDATE users SET otp_attempts = 0 WHERE email = $1", [
      email,
    ]);

    res.status(200).json({ status: "success", message: "Code valide" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  } finally {
    client.release();
  }
};

// Modification du mot de passe
export const updatePassword = async (req, res) => {
  const client = await pool.connect();

  const { email, code, newPassword } = req.body;
  try {
    // On vérifie le code et l'expiration
    const userRes = await client.query(
      "SELECT id FROM users WHERE email = $1 AND reset_password_code = $2 AND reset_password_expires > NOW()",
      [email, code],
    );

    if (userRes.rowCount === 0) {
      return res
        .status(400)
        .json({ message: "Session expirée. Veuillez recommencer." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await client.query(
      `UPDATE users 
       SET passworduser = $1, 
           reset_password_code = NULL, 
           reset_password_expires = NULL, 
           otp_attempts = 0 
       WHERE email = $2`,
      [hashedPassword, email],
    );

    res
      .status(200)
      .json({ status: "success", message: "Mot de passe mis à jour !" });
  } catch (error) {
    console.error("Erreur password:", error);

    res.status(500).json({
      message: "Erreur lors de la mise à jour.",
      error: error.message,
    });
  } finally {
    client.release();
  }
};