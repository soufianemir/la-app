# Roadmap de stabilisation — La plage youpiii

## Règle générale

À partir de cette baseline :

- une PR = un objectif clair ;
- pas de changement direct dans `main` hors urgence ;
- pas de nouveau fichier `v17.js`, `v18.js`, etc. ;
- toute nouvelle donnée doit avoir une source, une fraîcheur, un statut et un comportement de panne ;
- toute estimation doit être affichée comme estimation.

## Lot A — reprendre le contrôle

### PR 1 — Product baseline

Objectif : documenter l'état réel du produit, les sources et les limites.

Contenu :

- `PRODUCT.md`
- `FEATURE-MATRIX.md`
- `DATA-SOURCES.md`
- `CROWD-METHODOLOGY.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`

Aucun changement fonctionnel.

### PR 2 — Production / PWA cleanup

Objectif : avoir un seul entrypoint cohérent entre développement, build et Vercel.

À corriger :

- aligner `index.html` et la page réellement servie ;
- supprimer le chemin legacy vers `v13-clarity.js` dans l'entrypoint cible ;
- inclure V16 dans le build ;
- aligner le service worker sur les assets V16 ;
- mettre à jour la version du package ;
- garantir que l'application reste installable et que le cache ne réinjecte pas une ancienne UI.

### PR 3 — Remove version layering

Objectif : transformer V10/V11/V12/V14/V16 en modules uniques sans modifier le rendu fonctionnel.

Pas de nouvelle feature dans cette PR.

### PR 4 — Quality gate

Objectif : mettre en place tests unitaires + parcours E2E + CI.

Tests prioritaires :

- distance ;
- matching qualité baignade ;
- score météo ;
- score mer ;
- score conditions ;
- niveau affluence ;
- niveau de confiance ;
- règles de surveillance ;
- règles animaux ;
- fallback source indisponible.

## Lot B — fiabiliser la donnée

### PR 5 — Data contracts

Unifier les retours providers autour de :

```text
value
status
source
publishedAt/observedAt/modelTime
retrievedAt
confidence
scope
notes
```

### PR 6 — Crowd engine V1

Séparer strictement :

- `OBSERVED`
- `ESTIMATED`
- `UNKNOWN`

Conserver les catégories utilisateur simples sans nombre de personnes inventé.

### PR 7 — Webcam validation

Documenter et tester pour chaque caméra :

- champ visible ;
- plage/secteur autorisé ;
- ROI d'analyse ;
- qualité minimale de l'image ;
- fallback `UNKNOWN`.

### PR 8 — Safety engine

Sortir les règles de sécurité du code UI et les structurer avec source, dates d'effet et périmètre.

### PR 9 — Parking contract

Séparer explicitement :

- localisation ;
- capacité ;
- disponibilité live.

## Lot C — proposition de valeur

### PR 10 — Go Score V1

Construire un score de décision explicable à partir de :

- qualité de baignade ;
- météo ;
- mer ;
- sécurité ;
- affluence ;
- distance ;
- parking lorsque la donnée est réellement disponible.

Le score final doit indiquer ses composantes et sa confiance.

## Parking lot après stabilisation

- filtres famille / calme / sable / accessibilité ;
- signalements communautaires ;
- historique partagé ;
- prédictions d'affluence backtestées ;
- trafic/transport ;
- extension géographique hors Cannes ;
- comptes utilisateurs ;
- monétisation.
