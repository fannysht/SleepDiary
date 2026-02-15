import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyToken = (req, res, next) => {
  try {
    // Récupération du token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token d'authentification manquant",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Format du token invalide",
      });
    }

    // Vérification et décodage du token
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expiré",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du token",
    });
  }
};

export const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé",
      });
    }

    next();
  };
};