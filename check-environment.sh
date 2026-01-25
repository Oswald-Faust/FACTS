#!/bin/bash

echo "\n🔍 Vérification de la configuration de l'API FACTS..."
echo "==================================================="

# 1. Vérifie le fichier .env (Pour le développement local / simulateur)
echo "\n1️⃣  CONFIGURATION LOCALE (.env)"
if [ -f .env ]; then
  # Extrait la valeur de EXPO_PUBLIC_API_URL
  ENV_URL=$(grep "^EXPO_PUBLIC_API_URL=" .env | cut -d '=' -f2-)
  
  if [ -n "$ENV_URL" ]; then
    echo "   📍 URL détectée : $ENV_URL"
    
    if [[ "$ENV_URL" == *"localhost"* ]] || [[ "$ENV_URL" == *"127.0.0.1"* ]] || [[ "$ENV_URL" == *"192.168"* ]]; then
      echo "   👉 Ton simulateur/app locale utilise le serveur LOCAL."
    else
      echo "   👉 Ton simulateur/app locale utilise le serveur EN LIGNE."
    fi
  else
    echo "   ⚠️  Variable EXPO_PUBLIC_API_URL non trouvée dans .env"
  fi
else
  echo "   ❌ Fichier .env manquant !"
fi

# 2. Vérifie le fichier eas.json (Pour les builds TestFlight / Production)
echo "\n2️⃣  CONFIGURATION TESTFLIGHT / PRODUCTION (eas.json)"
if [ -f eas.json ]; then
  # Cherche l'URL dans la section production via grep simple
  # Note: c'est une recherche basique de texte
  EAS_URL=$(grep -A 5 '"production":' eas.json | grep "EXPO_PUBLIC_API_URL" | head -n 1 | cut -d '"' -f4)
  
  if [ -n "$EAS_URL" ]; then
    echo "   📍 URL configurée pour TestFlight : $EAS_URL"
    
    if [[ "$EAS_URL" == *"localhost"* ]]; then
       echo "   🚨 ATTENTION : La production pointe vers LOCALHOST (ne fonctionnera pas sur téléphone) !"
    else
       echo "   👉 Ton application TestFlight utilise ce serveur EN LIGNE."
    fi
  else
    echo "   ⚠️  Pas d'URL explicite dans eas.json pour la production."
  fi
else
  echo "   ❌ Fichier eas.json manquant !"
fi

echo "\n===================================================\n"
