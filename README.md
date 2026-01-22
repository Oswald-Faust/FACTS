# FACTS - Application de Fact-Checking d'Élite 🔍

![FACTS Logo](./assets/icon.png)

**FACTS** est une application mobile premium de fact-checking alimentée par l'IA Gemini Pro 3. Elle permet de vérifier instantanément la véracité d'affirmations textuelles ou d'images grâce à l'analyse forensique et la recherche Google en temps réel.

## ✨ Fonctionnalités

### 🎯 Vérification de Texte

- Analyse d'affirmations, citations, chiffres
- Recherche Google en temps réel via Grounding
- Verdict clair avec score de confiance

### 🖼️ Analyse Forensique d'Images

- Détection d'images générées par IA (Midjourney, DALL-E, etc.)
- Détection de manipulations (Photoshop, deepfakes)
- Analyse des artefacts visuels

### 📊 Verdicts Transparents

- **VRAI** - Information confirmée
- **FAUX** - Information incorrecte
- **TROMPEUR** - Contexte trompeur
- **NUANCÉ** - Vérité complexe
- **IMAGE IA** - Générée par intelligence artificielle
- **MANIPULÉE** - Image modifiée

### 🔗 Sources Vérifiables

- Liens cliquables vers les sources
- Score de confiance par source
- Métadonnées de publication

### 📜 Historique

- Sauvegarde automatique des vérifications
- Filtrage par type de verdict
- Accès rapide aux vérifications passées

## 🎨 Design

L'application suit les principes de design iOS Apple avec :

- **Glassmorphism** - Effets de verre premium
- **Micro-animations** - Transitions fluides avec Reanimated
- **Haptics** - Retour tactile précis
- **Mode sombre/clair** - Support automatique

## 🛠️ Stack Technique

- **Frontend**: React Native avec Expo SDK 52
- **Animations**: React Native Reanimated 3
- **IA**: Google Gemini Pro 3 avec Google Search Grounding
- **Stockage**: AsyncStorage pour la persistance locale
- **Styling**: StyleSheet natif avec système de design personnalisé

## 📁 Architecture

```
src/
├── components/          # Composants réutilisables
│   ├── GlassCard.tsx   # Carte avec effet glassmorphism
│   ├── GradientButton.tsx # Bouton animé avec gradient
│   ├── VerdictBadge.tsx # Badge de verdict animé
│   └── SourceCard.tsx  # Carte de source cliquable
├── screens/            # Écrans de l'application
│   ├── OnboardingScreen.tsx
│   ├── HomeScreen.tsx
│   ├── ResultScreen.tsx
│   └── HistoryScreen.tsx
├── services/           # Services et API
│   ├── gemini.ts       # Veritas Engine (Gemini API)
│   └── storage.ts      # Stockage local
├── contexts/           # État global
│   └── AppContext.tsx
├── constants/          # Configuration
│   ├── theme.ts        # Système de design iOS
│   └── onboarding.ts   # Contenu onboarding
└── types/              # Types TypeScript
    └── index.ts
```

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI
- Simulateur iOS ou Android

### Démarrage

```bash
# Cloner le projet
cd FACTS

# Installer les dépendances
npm install

# Lancer l'application
npm start

# Ouvrir sur iOS
npm run ios

# Ouvrir sur Android
npm run android
```

## 🔑 Configuration API

L'application utilise l'API Google Gemini. La clé est configurée dans :

- `src/services/gemini.ts`

## 📱 Écrans

### 1. Onboarding

3 slides premium expliquant les fonctionnalités :

- Analyse Forensique
- Vérification Temps Réel
- Verdicts Transparents

### 2. Accueil

- Champ de texte intelligent
- Boutons d'upload d'image (galerie/caméra)
- Historique récent

### 3. Résultat

- Badge de verdict animé
- Score de confiance avec jauge
- Résumé journalistique
- Analyse forensique (pour les images)
- Sources cliquables

### 4. Historique

- Liste filtrable des vérifications
- Accès rapide aux détails

## 🔨 Build Production

```bash
# iOS
npm run build:ios

# Android
npm run build:android

# Les deux
npm run build:all
```

## 📤 Publication

```bash
# App Store
npm run submit:ios

# Google Play
npm run submit:android
```

## 🧪 API Gemini - Veritas Engine

Le moteur Veritas utilise Gemini Pro 3 avec :

- **System Instruction** spécialisée fact-checking
- **Google Search Grounding** pour sources temps réel
- **Analyse visuelle** pour images

### Format de réponse

```json
{
  "verdict": "TRUE|FALSE|MISLEADING|NUANCED|AI_GENERATED",
  "confidenceScore": 85,
  "summary": "Résumé court",
  "analysis": "Analyse détaillée",
  "sources": [...],
  "visualAnalysis": {
    "isAIGenerated": false,
    "isManipulated": false,
    "artifacts": []
  }
}
```

## 📄 Licence

MIT License - Projet privé

---

**FACTS** - Vérité. Transparence. Confiance. 🛡️
