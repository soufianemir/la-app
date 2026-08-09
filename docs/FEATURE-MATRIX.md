# Feature matrix — état réel du produit

Dernière vérification : 2026-08-09.

Légende : `LIVE`, `PARTIAL`, `ESTIMATED`, `UNKNOWN`, `LEGACY`, `PLANNED`.

| Domaine | Feature | Statut | Source / implémentation | Limite actuelle |
|---|---|---:|---|---|
| Recherche | Recherche adresse / lieu | LIVE | Géocodage IGN / Géoplateforme | Dépend du service externe |
| Localisation | GPS navigateur | LIVE | `navigator.geolocation` | Autorisation utilisateur nécessaire |
| Plages | Catalogue Cannes | LIVE | Catalogue local + base nationale baignade | Dédoublonnage encore heuristique |
| Distance | Distance plage | LIVE | Calcul géographique local | Distance à vol d'oiseau |
| Eau | Classement qualité baignade | LIVE | Jeu QSB officiel | Classement saisonnier/annuel, pas mesure minute par minute |
| Météo | Température / pluie / vent | LIVE | Open-Meteo | Donnée de modèle |
| Mer | Température / vagues / courant | LIVE | Open-Meteo Marine | Donnée de modèle |
| Score | Conditions plage | PARTIAL | Qualité + météo + mer | Pondérations prototype à formaliser |
| Affluence | Catégorie simple | LIVE | Observation directe ou estimation | Méthodologies différentes selon plage |
| Affluence | Webcam Boulevard du Midi | OBSERVED | Webcam Cannes | Zone exacte à conserver strictement |
| Affluence | Webcam Quai Laubeuf | OBSERVED | Webcam Cannes | Zone exacte à conserver strictement |
| Affluence | Webcam Palm Beach | PARTIAL | Webcam Cannes | Vidéo disponible, classification auto non validée |
| Affluence | Analyse visuelle automatique | PARTIAL | Snapshot webcam + heuristique image | Expérimental, ne compte pas les personnes |
| Affluence | Estimation sans webcam | ESTIMATED | Heure, saison, météo, mer, événements, capacité parking | Ne doit jamais être présentée comme observation |
| Affluence | Prévision +2 h | ESTIMATED | Heuristique multi-signaux | Prototype, non backtesté |
| Affluence | Tendance | PARTIAL | Historique `localStorage` | Historique uniquement sur l'appareil |
| Photos | Photos Cannes | LIVE | Wikimedia Commons | Photos d'illustration, pas forcément récentes |
| Parking | Localisation parkings Cannes | LIVE | Catalogue Cannes | À maintenir avec la source officielle |
| Parking | Capacité totale | LIVE | Fiches / données publiques | Capacité ≠ disponibilité |
| Parking | Places libres Cannes | UNKNOWN | Aucun flux fiable intégré | Ne jamais afficher un taux inventé |
| Sécurité | Qualité eau | LIVE | QSB / Cannes | Voir règle de fraîcheur |
| Sécurité | Surveillance Zamenhof | PARTIAL | Règle dédiée dans V16 | À sortir du code UI vers données structurées |
| Sécurité | Handiplage Bijou | PARTIAL | Règle dédiée dans V16 | À sortir du code UI vers données structurées |
| Sécurité | Drapeau actuel | UNKNOWN | Aucun flux live intégré | Vérification sur place |
| Sécurité | Méduses live | UNKNOWN | Aucun flux fiable intégré | Ne pas déduire absence de méduses |
| Sécurité | Ostreopsis | PARTIAL | Information officielle Cannes | Pas de statut minute par minute intégré |
| Sécurité | Chiens | PARTIAL | Règles Cannes codées dans V16 | Règles à structurer et dater |
| Services | Toilettes / douche / eau | PARTIAL | OpenStreetMap / Overpass | Complétude variable |
| Carte | Carte détail | LEGACY/PARTIAL | Ancienne implémentation Leaflet | À confirmer dans le chemin de prod actuel |
| Partage | Partage natif | LEGACY | Ancienne implémentation `navigator.share` | Non considéré comme feature garantie V16 |
| Signalement | Signalement utilisateur | PLANNED | README historique | Pas de backend communautaire actuel |
| Filtres | Famille / tranquillité / parking | PLANNED | README historique | Non présents dans l'expérience prod actuelle |
| PWA | Manifest installable | LIVE | `manifest.webmanifest` | Entrypoint/service worker à corriger |
| PWA | Offline | PARTIAL | Service worker V14 | Cache non aligné avec la prod V16 |

## Règle de maintenance

Une feature ne peut passer à `LIVE` que si :

1. sa source ou son mécanisme est identifié ;
2. son comportement de panne est connu ;
3. son niveau de fraîcheur est explicite ;
4. son wording ne lui attribue pas une précision supérieure à la réalité ;
5. elle dispose d'au moins un test après mise en place du quality gate.
