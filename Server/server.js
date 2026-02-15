import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import authRoutes from "./src/routes/auth.routes.js";
import sleepRoutes from "./src/routes/sleep.routes.js";
import statsRoutes from "./src/routes/stats.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration CORS - MODIFIÉ ICI
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://zen-sleep-tracker.netlify.app",
  "http://localhost:3000",
  "http://localhost:3001"
].filter(Boolean); 

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger de requêtes (en développement)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
  });
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sleep", sleepRoutes);
app.use("/api/stats", statsRoutes);

// Route de test
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Sleep Tracker API is running",
    timestamp: new Date().toISOString(),
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route non trouvée",
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error("Erreur:", err.stack);
  res.status(500).json({
    success: false,
    message: "Erreur serveur interne",
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || "development"}`);
  console.log(`CORS autorisé pour:`, allowedOrigins);
});

export default app;