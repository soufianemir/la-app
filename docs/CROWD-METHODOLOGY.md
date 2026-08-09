# Méthodologie affluence

Dernière vérification : 2026-08-09.

## Objectif

Afficher une information simple et honnête :

- `Tranquille`
- `Ça va`
- `Beaucoup de monde`
- `Saturée`
- `On ne sait pas`

Le produit ne doit pas afficher un nombre de personnes s'il ne dispose pas d'un vrai comptage permettant de le justifier.

## 1. Observation directe par webcam

Le code actuel référence trois webcams Cannes :

- Boulevard du Midi ;
- Quai Laubeuf ;
- Palm Beach.

La Ville de Cannes confirme la publication de trois webcams en direct correspondant à ces trois secteurs.

### Règle de couverture

Une webcam ne peut être utilisée comme observation de la plage que si le mapping entre la plage et le champ de la caméra est explicite.

Interdit : rattacher automatiquement « la caméra la plus proche » à une autre plage.

### Classification actuelle

Pour certaines caméras déclarées analysables, l'application récupère un snapshot récent puis calcule des caractéristiques simples de l'image (luminosité, contraste, densité de contours dans une zone d'intérêt).

Cette logique :

- ne fait pas de reconnaissance faciale ;
- ne compte pas les personnes ;
- produit uniquement une catégorie d'affluence ;
- est encore expérimentale et doit être calibrée/testée avant d'être considérée comme robuste.

Palm Beach reste une webcam visible mais n'est pas considérée comme validée pour la classification automatique.

## 2. Estimation indirecte sans webcam exploitable

Lorsque la plage n'est pas directement observée, l'application peut produire une `ESTIMATED` à partir de signaux comme :

- heure de la journée ;
- jour semaine/week-end ;
- saison/vacances ;
- météo ;
- mer ;
- événements cannois explicitement connus ;
- capacité structurelle de parkings proches.

La capacité de parking ne représente jamais l'occupation réelle et ne doit rester qu'un signal faible.

## 3. Confiance

La confiance doit dépendre de :

- nature de la donnée (`OBSERVED` vs `ESTIMATED`) ;
- fraîcheur ;
- couverture géographique ;
- qualité du signal ;
- nombre de signaux disponibles.

Une estimation indirecte ne doit jamais recevoir le même niveau de confiance qu'une observation directe réellement validée.

## 4. Prévision

La prévision +2 h actuelle est un prototype heuristique. Elle doit rester marquée `ESTIMATED` tant qu'elle n'est pas :

1. comparée à des observations ultérieures ;
2. backtestée sur un historique suffisant ;
3. calibrée par plage/secteur ;
4. accompagnée d'un indicateur d'erreur.

## 5. Tendance

L'historique actuel est local au navigateur. La tendance n'est donc pas un historique global de la plage.

Avant backend communautaire, le wording doit éviter toute formulation pouvant laisser croire à une mesure collective.

## 6. Contrat UI cible

Chaque affluence doit exposer :

```text
niveau: Tranquille | Ça va | Beaucoup de monde | Saturée | On ne sait pas
mode: OBSERVED | ESTIMATED | UNKNOWN
source: ...
updatedAt: ...
confidence: LOW | MEDIUM | HIGH
scope: zone réellement concernée
why: signaux / méthode
```

## Règle de sécurité produit

En cas de panne, données trop anciennes, mauvaise image, mapping caméra incertain ou quantité insuffisante de signaux : retourner `UNKNOWN`.
