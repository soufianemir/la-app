# Data sources & niveaux de confiance

Dernière vérification documentaire : 2026-08-09.

## Politique de source

Chaque donnée doit être accompagnée d'un type de preuve :

- `OFFICIAL` : source publique officielle ou jeu de données officiel.
- `OBSERVED` : observation directe via webcam/capteur couvrant la zone.
- `MODELLED` : modèle météo/océan.
- `ESTIMATED` : calcul interne multi-signaux.
- `UNKNOWN` : aucune donnée suffisamment fiable.

L'ordre ci-dessus ne représente pas un classement absolu de qualité : une donnée officielle annuelle peut être moins fraîche qu'une observation directe récente. Le produit doit afficher à la fois **provenance** et **fraîcheur**.

## Sources actuellement utilisées ou référencées

### Qualité des sites de baignade

- Type : `OFFICIAL`.
- Dataset : Qualité des sites de baignade (QSB), data.gouv.fr.
- URL dataset : https://www.data.gouv.fr/datasets/qualite-des-sites-de-baignade-1
- Le dataset décrit notamment `nom_site`, coordonnées, type d'eau, statut des données et `qualite`.
- Fréquence annoncée : annuelle.
- Dernière mise à jour vérifiée le 2026-08-09 : 9 juillet 2026.
- Règle produit : ne jamais présenter le classement comme une mesure de pollution en temps réel.

### Qualité des eaux de Cannes / surveillance sanitaire

- Type : `OFFICIAL`.
- Source : Ville de Cannes.
- URL : https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/plages/qualite-des-eaux-de-baignade.html
- La Ville publie des contrôles saisonniers et des informations relatives notamment à Ostreopsis.
- Règle produit : distinguer classement de baignade, prélèvements sanitaires et statut instantané.

### Webcams Cannes

- Type : `OBSERVED` pour l'image, seulement lorsque la zone couverte correspond à la plage affichée.
- Source : Ville de Cannes / flux vidéo associé.
- URL : https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/webcams-et-stations-meteo-a-cannes.html
- Trois webcams officielles sont publiées : Boulevard du Midi, Quai Laubeuf et Palm Beach.
- Règle produit : aucune règle de « caméra la plus proche ». Une webcam ne mesure que son champ réellement visible.

### Météo

- Type : `MODELLED`.
- Provider actuel : Open-Meteo.
- Usage actuel : température, précipitation, vent et rafales.
- Règle produit : afficher comme modèle/conditions estimées, pas comme capteur local officiel.

### Mer

- Type : `MODELLED`.
- Provider actuel : Open-Meteo Marine.
- Usage actuel : température de surface, vagues et courant.
- Règle produit : ne pas augmenter artificiellement la précision affichée au-delà des données du provider.

### Parkings Cannes

- Type : `OFFICIAL` pour le catalogue/localisation/capacité lorsqu'ils sont rattachés à une fiche officielle.
- Source principale : Ville de Cannes / CANNES Parking.
- URL : https://www.cannes.com/fr/cadre-de-vie/stationnement-ou-se-garer-a-cannes/stationnez-dans-les-parkings.html
- La Ville indique 23 parkings en ouvrage et en surface totalisant plus de 7 000 places, avec une liste des parkings municipaux et gérés par CANNES Parking.
- Règle produit : `capacity` n'est jamais synonyme de `available`.
- État actuel : aucun flux fiable de places libres des parkings Cannes n'est intégré au produit.

### Stationnement voirie / Flowbird

- Type : `OFFICIAL` pour les règles et le renvoi vers le service.
- Source : Ville de Cannes.
- URL : https://www.cannes.com/fr/cadre-de-vie/stationnement-ou-se-garer-a-cannes/stationnez-sur-la-voie-publique.html
- Règle produit : ne pas déduire l'occupation réelle de la voirie à partir de la seule existence de Flowbird.

### Services de proximité

- Type : `COMMUNITY_DATA` / donnée ouverte contributive.
- Source technique actuelle : OpenStreetMap via Overpass.
- Usage : toilettes, douches, points d'eau, parkings hors catalogues dédiés.
- Règle produit : afficher que la complétude peut être variable.

## Fraîcheur minimale à exposer dans le futur contrat de données

Chaque objet dynamique doit tendre vers :

```text
value
status
source
observedAt | modelTime | publishedAt
retrievedAt
confidence
scope
notes
```

## Données explicitement non disponibles aujourd'hui

- occupation live fiable des parkings de Cannes ;
- drapeau de baignade actuel par plage via API ;
- présence live fiable de méduses par plage ;
- comptage SERENITY public exploitable par API ;
- historique communautaire partagé ;
- comptage exact de personnes sur les plages.

La règle produit est de montrer `On ne sait pas` plutôt que de produire une fausse information.
