# La plage youpiii — Product baseline

Dernière vérification : 2026-08-09.

## Question produit

La plage youpiii doit répondre d'abord à une question simple : **quelle plage de Cannes vaut le coup maintenant ?**

La réponse doit être compréhensible en quelques secondes et reposer uniquement sur des informations dont la provenance et la limite sont connues.

## Périmètre actuel

- Zone produit prioritaire : Cannes.
- Expérience : web mobile / PWA.
- Recherche par adresse ou géolocalisation.
- Liste de plages proches.
- Fiche plage avec météo, mer, qualité de l'eau, affluence, sécurité et stationnement.
- Affluence affichée sous forme de catégories simples, jamais comme un nombre de personnes inventé.

## Règle de vérité

Toute information visible dans le produit doit avoir un statut explicite :

- `OFFICIAL` : donnée issue d'une source publique officielle.
- `OBSERVED` : observation directe d'un capteur ou d'une webcam couvrant réellement la zone.
- `MODELLED` : valeur fournie par un modèle météo/mer.
- `ESTIMATED` : estimation calculée par l'application à partir de plusieurs signaux.
- `UNKNOWN` : information non disponible ou insuffisamment fiable.
- `LEGACY` : comportement hérité encore présent mais non retenu comme cible produit.

Une donnée `UNKNOWN` ne doit jamais être transformée en valeur positive par défaut.

## North Star

Le produit doit permettre à l'utilisateur de décider rapidement entre plusieurs plages en répondant à quatre questions :

1. Les conditions météo et de mer sont-elles bonnes ?
2. La baignade présente-t-elle une information officielle ou une règle importante ?
3. Quel est le niveau d'affluence et comment a-t-il été obtenu ?
4. L'accès et le stationnement sont-ils simples ?

## Principes non négociables

- Ne pas inventer de temps réel.
- Ne pas confondre capacité d'un parking et places libres.
- Ne pas appliquer une webcam à une plage qu'elle ne filme pas.
- Ne pas présenter une estimation comme une observation.
- Afficher la source, l'heure/fraîcheur et le niveau de confiance lorsque c'est pertinent.
- Conserver un état `On ne sait pas` lorsqu'il manque suffisamment de données.
- Le score global doit rester explicable par ses composantes.

## Hors périmètre immédiat

Jusqu'à stabilisation de l'architecture :

- extension à d'autres villes ;
- comptes utilisateurs ;
- réseau social / communauté ;
- publicité ;
- prédiction avancée ;
- nouvelles sources expérimentales ;
- nouvelle génération d'écrans V17/V18 sous forme de patchs successifs.

Ces sujets restent dans le backlog et ne doivent pas entrer dans `main` avant la fin du lot de stabilisation.