## Refonte navigation, UX/UI, multilingue, IA, stabilité et sécurité
- [x] Auditer architecture, routes, états, authentification, données, traductions et responsive
- [x] Refaire la navigation principale et repositionner la messagerie
- [x] Corriger scroll, modales, avatars et stabilité globale
- [x] Compléter le multilingue et le premier choix de langue
- [x] Finaliser l’accueil IA, le plein écran et Plant AI
- [x] Retirer uniquement les comptes fictifs de l’annuaire
- [x] Confirmer et classer les alertes du scanner de sécurité
- [x] Ajouter une limitation centralisée des notifications (30/minute par membre) et verrouiller le contenu des notifications
- [x] Vérifier performances et comportement multi-écrans

## Langue liée au compte et barres au défilement
- [x] Résoudre l’authentification avant le choix de langue
- [x] Redemander la langue à chaque accès visiteur
- [x] Charger et enregistrer la langue préférée du membre
- [x] Garder la barre principale visible et masquer les outils à la descente
- [x] Masquer entièrement la navigation inférieure à la descente
- [x] Valider les parcours de langue et le défilement sur tous les formats

## Documentation et dépôt GitHub
- [x] Rédiger et vérifier un README détaillé de la version actuelle
- [ ] Synchroniser le dépôt `sidiiiii/Agriconnect` dans son ensemble — bloqué : le compte GitHub connecté n'a pas de droit d'écriture sur ce dépôt ; éviter tout remplacement destructif de son ancienne version

## Icône mobile et signature
- [x] Prévoir les icônes d'écran d'accueil et un manifeste mobile
- [x] Rétablir la signature Agrosky et 3A55 avec son lien dans le site et les pages légales

## Migration vers PostgreSQL 18 auto-hébergé
- [x] Audit des dépendances à l'ancienne base et retrait du client
- [x] Schéma Drizzle complet et première migration
- [x] Authentification native (Argon2id, sessions en base, limites d'essais)
- [x] Règles d'accès recréées côté serveur et testées
- [x] Stockage des médias sur volume avec URL signées
- [x] Lanceur de migrations (verrou, journal, garde-fous) et tests
- [x] Sauvegarde, vérification, restauration testées
- [x] Docker Compose / Coolify avec PostgreSQL 18.7
- [x] Outil d'import de l'ancienne base testé sur données fictives
- [x] CI, README, guides anglais et arabe
- [ ] Construire et lancer les images Docker sur le serveur — bloqué : Docker indisponible dans cet environnement
- [ ] Import réel des anciennes données — attend l'accès à l'ancienne base (chaîne de connexion et clé de stockage)
