# FACTS Backend API

Backend Node.js/Express pour l'application FACTS - Fact-checking premium.

## 🚀 Technologies

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **MongoDB** + **Mongoose** - Base de données
- **JWT** - Authentification
- **Zod** - Validation des données
- **Helmet** - Sécurité HTTP
- **Rate Limiting** - Protection contre les abus

## 📦 Installation

```bash
cd backend
npm install
```

## ⚙️ Configuration

1. Copiez le fichier `.env.example` en `.env`:

```bash
cp .env.example .env
```

2. Configurez les variables d'environnement dans `.env`

## 🏃 Démarrage

### Développement

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## 📚 API Endpoints

### Authentification (`/api/auth`)

| Méthode | Endpoint    | Description              |
| ------- | ----------- | ------------------------ |
| POST    | `/register` | Créer un compte          |
| POST    | `/login`    | Connexion email/password |
| POST    | `/social`   | Connexion Google/Apple   |
| GET     | `/me`       | Profil utilisateur       |
| POST    | `/logout`   | Déconnexion              |

### Fact-Checks (`/api/fact-checks`)

| Méthode | Endpoint         | Description                    |
| ------- | ---------------- | ------------------------------ |
| GET     | `/`              | Liste des fact-checks          |
| GET     | `/:id`           | Détail d'un fact-check         |
| POST    | `/`              | Créer un fact-check            |
| DELETE  | `/:id`           | Supprimer un fact-check        |
| DELETE  | `/`              | Supprimer tous les fact-checks |
| GET     | `/stats/summary` | Statistiques                   |

### Utilisateurs (`/api/users`)

| Méthode | Endpoint           | Description             |
| ------- | ------------------ | ----------------------- |
| GET     | `/profile`         | Profil utilisateur      |
| PATCH   | `/profile`         | Modifier le profil      |
| POST    | `/change-password` | Changer le mot de passe |
| DELETE  | `/account`         | Supprimer le compte     |
| POST    | `/premium/upgrade` | Passer en premium       |

## 🔐 Authentification

Toutes les routes protégées nécessitent un header Authorization:

```
Authorization: Bearer <token>
```

## 📝 Exemples de requêtes

### Inscription

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123", "displayName": "John"}'
```

### Connexion

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret123"}'
```

### Créer un fact-check

```bash
curl -X POST http://localhost:3000/api/fact-checks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "claim": "La Terre est plate",
    "verdict": "FALSE",
    "confidenceScore": 98,
    "summary": "Cette affirmation est fausse",
    "analysis": "Analyse détaillée...",
    "sources": [],
    "processingTimeMs": 1500
  }'
```

## 🧪 Health Check

```bash
curl http://localhost:3000/health
```

## 📁 Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── index.ts
│   ├── models/
│   │   ├── FactCheck.ts
│   │   ├── User.ts
│   │   └── index.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── factChecks.ts
│   │   ├── users.ts
│   │   └── index.ts
│   └── index.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```
