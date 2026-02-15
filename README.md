# Sleep Diary 🌙

Application de suivi du sommeil avec React et Node.js/Express.

## 📋 Description

Sleep Diary est une application web qui permet de :
- Suivre vos habitudes de sommeil
- Analyser vos cycles de sommeil
- Générer des rapports PDF
- Visualiser des statistiques et graphiques

## 🏗️ Architecture

- **Frontend**: React 19 + Bootstrap + Recharts
- **Backend**: Node.js + Express + PostgreSQL
- **Authentification**: JWT
- **PDF**: jsPDF + jsPDF-AutoTable

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL
- npm ou yarn

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/sleep-diary.git
cd sleep-diary
```

2. **Installer les dépendances**
```bash
# Frontend
cd Client
npm install

# Backend
cd Server
npm install
```

3. **Configurer la base de données**
```bash
# Créer la base de données PostgreSQL
createdb sleep-diary
```

4. **Démarrer l'application**
```bash
# Backend (terminal 1)
cd Server
npm start

# Frontend (terminal 2)
cd Client
npm start
```

L'application sera disponible sur :
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📱 Fonctionnalités

### Utilisateur
- ✅ Inscription et connexion
- ✅ Profil utilisateur
- ✅ Suivi du sommeil quotidien
- ✅ Notes et commentaires
- ✅ Export PDF des données

### Analyse
- 📊 Graphiques de durée de sommeil
- 📈 Statistiques hebdomadaires/mensuelles
- 📉 Tendances et patterns
- 📋 Rapports détaillés

## 🛠️ Scripts Disponibles

### Frontend (Client/)
```bash
npm start          # Mode développement
npm run build      # Build production
npm test           # Tests unitaires
npm run eject      # Éjection (irréversible)
```

### Backend (Server/)
```bash
npm start          # Mode production
npm run dev        # Mode développement avec watch
```

## 🌍 Déploiement

### Production
Le projet est configuré pour le déploiement sur :
- **Frontend**: Netlify
- **Backend**: Vercel ou Heroku
- **Database**: PostgreSQL (Supabase/Railway)

Voir le guide de déploiement complet pour les instructions détaillées.

### Variables d'environnement
```bash
# Backend
NODE_ENV=production
DB_USER=votre_user
DB_HOST=votre_host
DB_NAME=sleep-diary
DB_PASSWORD=votre_password
JWT_SECRET=votre_secret
FRONTEND_URL=https://votre-domaine.netlify.app

# Frontend
REACT_APP_API_URL=https://votre-backend-url.vercel.app
```

## 📁 Structure du Projet

```
sleep-diary/
├── Client/                 # Application React
│   ├── public/            # Fichiers statiques
│   ├── src/               # Code source
│   └── package.json       # Dépendances frontend
├── Server/                # API Node.js
│   ├── src/               # Code source API
│   ├── server.js          # Point d'entrée
│   └── package.json       # Dépendances backend
├── netlify.toml          # Configuration Netlify
├── .gitignore            # Fichiers ignorés
└── README.md             # Ce fichier
```

## 🔧 Technologies

### Frontend
- React 19.2.3
- React Router DOM 7.12.0
- Bootstrap 5.3.8
- Recharts 3.6.0
- Axios 1.13.5
- jsPDF 4.1.0

### Backend
- Node.js
- Express 4.18.2
- PostgreSQL (pg 8.11.3)
- JWT (jsonwebtoken 9.0.3)
- bcrypt 6.0.0
- Nodemailer 8.0.1


**Développé avec ❤️ pour un meilleur sommeil**