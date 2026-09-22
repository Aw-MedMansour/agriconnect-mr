# Langue liée au compte et barres stables au défilement

## Objectif
Garantir le bon choix de langue selon la connexion et rendre les trois niveaux de navigation conformes : en-tête toujours visible, outils masquables, navigation inférieure entièrement masquable.

## Modifications prévues

### 1. Langue pilotée par l’état de connexion
- Vérifier la session réelle avant d’afficher l’application ou le sélecteur, sans flash pendant le chargement.
- Visiteur non connecté : ne plus conserver son choix comme préférence durable ; le sélecteur réapparaîtra à chaque rechargement ou nouvel accès.
- Membre connecté : charger la langue enregistrée dans son profil et ouvrir directement l’application.
- Première connexion sans langue enregistrée : reprendre le choix fait avant la connexion, l’ajouter au profil, puis le réutiliser aux connexions suivantes.
- Tout changement de langue depuis le menu Profil mettra immédiatement à jour la préférence du compte connecté.
- La déconnexion réinitialisera correctement l’état afin que le choix soit demandé lors du prochain accès sans compte.

### 2. Structure supérieure en deux niveaux attachés
- Conserver la barre principale AgriConnect + Messagerie en haut, avec hauteur fixe et visibilité permanente.
- Déplacer les outils/sections juste sous cette barre dans un bloc distinct mais visuellement attaché.
- Masquer complètement le bloc d’outils au défilement descendant et le réafficher au défilement montant.
- Réduire réellement sa hauteur lorsqu’il est masqué afin de ne laisser aucun espace vide et de ne pas créer de barre flottante.

### 3. Navigation inférieure
- Utiliser la même direction de défilement avec un seuil minimal pour éviter le clignotement.
- Faire sortir entièrement la barre inférieure, y compris son fond, son ombre et la zone de sécurité.
- Réafficher l’ensemble avec une transition fluide au défilement montant ou près du haut de page.
- Libérer l’espace inférieur réservé lorsqu’elle est masquée, sans recouvrir les derniers contenus.

### 4. Validation
- Tester visiteur, membre connecté, première connexion, changement de langue et rechargement.
- Tester petits mouvements, défilement rapide, descente et remontée.
- Vérifier mobile, tablette et ordinateur, y compris les zones de sécurité et l’absence de débordement, saut ou chevauchement.
- Vérifier la compilation et les erreurs visibles sans lancer les fonctions IA ni consommer leurs crédits.

## Détails techniques
- La préférence restera dans le profil utilisateur existant, sans nouvelle table ni exposition publique supplémentaire.
- La session d’authentification réelle sera la source de vérité ; le cache local du profil ne décidera plus seul du sélecteur.
- La détection du scroll sera centralisée avec `requestAnimationFrame`, seuil de position et delta minimal.
