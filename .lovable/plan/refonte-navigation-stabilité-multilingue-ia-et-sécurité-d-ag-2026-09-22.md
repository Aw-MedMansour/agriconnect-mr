# Refonte navigation, stabilité, multilingue, IA et sécurité d’AgriConnect

## Objectif
Moderniser l’expérience AgriConnect sans reconstruire l’application, sans perdre de données réelles et sans supprimer de fonctionnalité existante. Les changements s’appuient sur l’architecture actuelle : application TanStack Start, interface React modulaire, Lovable Cloud pour les données et l’authentification, dictionnaire FR/EN/AR existant, icônes Lucide et outils IA déjà protégés côté serveur.

## Travaux prévus

### 1. Navigation et accès aux fonctions
- Simplifier l’en-tête en conservant le logo et l’identité à gauche, puis placer uniquement la messagerie et son compteur à droite.
- Remplacer la navigation horizontale supérieure par une barre inférieure fixe : **Accueil, Recherche, Publication, Notifications, Profil**.
- Afficher clairement l’état actif, prévoir de grandes zones tactiles, le bas sécurisé des iPhone et l’espace nécessaire sous les contenus.
- Masquer doucement la barre lors d’un défilement vers le bas et la réafficher dès le défilement vers le haut, avec un écouteur léger et correctement nettoyé.
- Conserver Marketplace Produits, Marketplace Services, Réseau, IA et Acteurs & Réputation dans une navigation de catégories intégrée à l’accueil, afin qu’aucune fonction ne disparaisse.
- Faire remonter chaque nouveau module en haut lors de son ouverture et fermer les panneaux incompatibles.

### 2. Recherche, publication, notifications et profil
- Transformer Recherche en vue/panneau global stable, sans modifier le filtrage existant des produits, services et membres.
- Réutiliser la fenêtre de publication existante depuis le bouton central de la barre inférieure.
- Réutiliser les notifications et le profil existants, avec compteurs, états actifs et connexion demandée lorsque nécessaire.
- Éviter toute duplication de la messagerie dans la barre inférieure.

### 3. Avatars et icônes
- Conserver Lucide comme bibliothèque unique d’icônes.
- Renforcer le composant Avatar pour gérer chargement, image valide, erreur réseau et repli automatique vers les initiales colorées.
- Remplacer les images externes générées comme avatars de secours par ce composant dans l’annuaire et vérifier tous ses usages.

### 4. Scroll, fenêtres et stabilité
- Ajouter un verrouillage partagé du défilement pour connexion, inscription, publication, contact, profil, médias, messagerie plein écran et outils IA.
- Conserver la position de la page puis la restaurer exactement à la fermeture, sans saut de largeur sur ordinateur.
- Garder le défilement interne des fenêtres, empêcher le débordement horizontal et stabiliser les hauteurs au clavier mobile.
- Corriger les positions et niveaux d’affichage des panneaux après réduction de l’en-tête.

### 5. Internationalisation complète
- Compléter le dictionnaire central FR/EN/AR et remplacer les derniers libellés, placeholders, erreurs, confirmations, aides, statuts et labels accessibles codés directement dans les composants.
- Traduire les catégories de données par libellé d’interface sans modifier leurs identifiants stockés.
- Ajouter un choix de langue au premier accès seulement ; mémoriser le choix et continuer à permettre son changement depuis le profil.
- Éviter l’écriture automatique d’une langue par défaut avant que le premier choix ait été effectué.
- Maintenir automatiquement la langue et la direction droite-à-gauche du document.

### 6. Espace Intelligence artificielle
- Afficher à l’entrée uniquement une présentation équilibrée des trois outils : Plant AI, Analyse IA et Matching IA ; aucun outil ne sera ouvert automatiquement.
- Ouvrir chaque outil dans un écran complet avec retour, titre, contenu, erreur et chargement.
- Conserver l’en-tête et la zone de saisie de Plant AI stables ; seule la conversation défile, et le clavier mobile ne masque pas le champ.
- Envoyer la langue active au serveur Plant AI et à l’analyse de plante afin que les réponses suivent FR, EN ou AR.
- Conserver les composants de conversation existants ; aucun appel IA réel ne sera lancé pendant les tests afin de protéger les crédits réservés.

### 7. Données de démonstration
- Supprimer le repli vers `MOCK_ACTORS` dans Acteurs & Réputation : l’annuaire affichera uniquement les profils réels renvoyés par la base.
- Ne supprimer aucune ligne de compte réelle dans la base.
- Conserver les données de démonstration des autres sections hors de cette demande.

### 8. Sécurité et robustesse
- Valider les textes, fichiers, types et tailles avant écriture ou envoi ; supprimer les replis vers des fichiers locaux non persistants après un échec d’upload.
- Vérifier que les opérations sensibles reposent sur l’utilisateur authentifié et les règles serveur, jamais seulement sur l’état local.
- Examiner les avertissements de sécurité existants concernant les fonctions privilégiées et les profils/contenus publics avant toute correction, afin de ne pas casser la messagerie, les compteurs ou l’annuaire.
- Corriger les problèmes applicables ; conserver ouverts les avertissements nécessitant une décision métier sur les données réellement publiques.
- Vérifier les dépendances signalées et appliquer uniquement une mise à niveau compatible avec l’architecture si elle existe.

### 9. Performance et qualité
- Charger les outils IA et les grandes fenêtres à la demande lorsque cela n’affecte pas leur comportement.
- Éviter les écouteurs multiples, les synchronisations répétées inutiles et les remontages provoquant une perte d’état.
- Corriger les erreurs console/runtime rencontrées et préserver toutes les fonctions de messagerie, publication, interactions, profil et notifications.

## Vérification finale
- Tester les parcours publics puis connectés : navigation, recherche, publication, notifications, profil, messagerie et suppression propriétaire.
- Tester chaque module principal et confirmer son ouverture en haut de page.
- Tester les fenêtres et le verrouillage du fond.
- Tester FR, EN et AR, y compris le premier choix, la persistance et le sens RTL.
- Tester l’accueil IA, les trois ouvertures plein écran, le retour et Plant AI sans envoyer de demande au modèle.
- Tester sans débordement ni chevauchement aux formats 360×800, 414×896, 844×390, tablette portrait/paysage, 1280×1800 et grand écran.
- Exécuter les vérifications complètes du projet et relire la feuille de route avant livraison.

## Contraintes de crédits
Le solde quotidien disponible est actuellement de **1,30 crédit sur 5**. La réserve payante ne sera pas utilisée et aucun test ne déclenchera Plant AI ou l’analyse photo. Si l’exécution ne peut pas continuer sans entamer la réserve, le travail sera arrêté avant ce seuil et le blocage sera signalé clairement.
