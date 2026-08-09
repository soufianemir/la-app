# Architecture — état actuel et cible

Dernière vérification : 2026-08-09.

## État actuel

La production est une application web mobile principalement statique, déployée sur Vercel, avec une fonction Node pour récupérer des snapshots de webcams.

Chemin de production observé :

```text
Vercel /
  -> home.html
     -> app-v10.js
     -> v11-cannes.js
     -> v12-crowd.js
     -> v14-cannes-only.js
     -> v16-ui.js
```

Les versions successives ne sont pas de simples modules : plusieurs redéfinissent des fonctions globales (`render`, `openDetail`, `cameraMeta`, etc.) et encapsulent la version précédente.

Exemple conceptuel :

```text
render V10
  -> wrapper V11
     -> wrapper V12
        -> wrapper V14
           -> wrapper V16
```

Cette stratégie a permis d'itérer vite mais crée :

- dépendance forte à l'ordre de chargement ;
- effets de bord difficiles à tester ;
- temporisations destinées à repolir l'UI après réponses asynchrones ;
- difficulté à identifier la source de vérité d'une règle métier ;
- risque de régression lors d'une nouvelle couche V17/V18.

## Incohérences techniques prioritaires

1. `vercel.json` sert actuellement `home.html` comme page `/`.
2. `index.html` suit un chemin de scripts différent et référence encore `v13-clarity.js`.
3. Le service worker utilise encore un cache nommé V14 et référence des assets V13/V14.
4. `build.js` ne copie pas les assets V16 et ne reflète donc pas exactement la production actuelle.
5. `package.json` affiche encore la version `0.14.1` alors que la production est devenue V16 par couches.

Ces sujets doivent être corrigés avant la refonte fonctionnelle.

## Architecture cible court terme

Pas de migration framework nécessaire à ce stade. Une architecture Vanilla JS modulaire est suffisante :

```text
src/
  app.js
  domain/
    beaches.js
    scoring.js
    crowd.js
    safety.js
  providers/
    geocoding.js
    water-quality.js
    weather.js
    marine.js
    webcams.js
    parking.js
    nearby-services.js
  data/
    cannes-beaches.js
    cannes-parkings.js
    cannes-rules.js
  ui/
    search.js
    beach-list.js
    beach-card.js
    beach-detail.js
    crowd-panel.js
    safety-panel.js
```

## Principes d'architecture cible

- une fonction métier n'a qu'une implémentation active ;
- aucun module UI ne redéfinit une fonction métier globale ;
- les providers retournent un contrat de donnée explicite ;
- les règles locales Cannes sont dans `data/` ou `domain/`, pas injectées au milieu du HTML ;
- l'UI rend l'état reçu (`OFFICIAL`, `OBSERVED`, `MODELLED`, `ESTIMATED`, `UNKNOWN`) sans le réinterpréter ;
- chaque provider gère son timeout et son état d'erreur ;
- les tests portent sur les fonctions métier sans avoir besoin du DOM.

## Backend actuel

Le produit n'a pas encore de backend applicatif persistant. Une fonction Vercel `api/webcam-snapshot.js` sert de proxy contrôlé pour récupérer des images des webcams référencées.

Aucune base communautaire partagée n'est actuellement présente.
