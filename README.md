# AgriConnect

**Le réseau professionnel agricole en Mauritanie.** AgriConnect met en relation les producteurs, acheteurs et prestataires agricoles au sein d'une plateforme de publication, d'échange et d'aide à la décision. Projet édité par **Agrosky**, à Nouakchott.

**Accès :** [agriconnect-mr.com](https://agriconnect-mr.com) · [www.agriconnect-mr.com](https://www.agriconnect-mr.com)

> **À propos du dépôt :** ce README décrit le code de la version **TanStack Start** présente dans ce projet. Le dépôt historique [`sidiiiii/Agriconnect`](https://github.com/sidiiiii/Agriconnect) contient encore une ancienne version React/Vite tant que sa synchronisation n'a pas été autorisée. Ses commandes, fichiers et possibilités ne doivent pas être confondus avec ceux décrits ci-dessous.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Parcours et accès](#parcours-et-accès)
- [Architecture technique](#architecture-technique)
- [Démarrer en local](#démarrer-en-local)
- [Configuration](#configuration)
- [Données et migrations](#données-et-migrations)
- [Sécurité et confidentialité](#sécurité-et-confidentialité)
- [Internationalisation et référencement](#internationalisation-et-référencement)
- [Déploiement et maintenance](#déploiement-et-maintenance)
- [Limites connues](#limites-connues)
- [Contact](#contact)

## Fonctionnalités

| Espace | Ce que permet la version actuelle |
| --- | --- |
| **Marketplace Produits** | Consulter et filtrer les annonces de produits agricoles, rechercher, publier avec photos ou vidéos, indiquer une quantité avec unité, contacter le vendeur, demander un transport, interagir avec les annonces et supprimer ses propres publications. |
| **Marketplace Services** | Consulter les offres et demandes, filtrer par métier et par type, publier un service ou un besoin, contacter un prestataire. Les catégories couvrent notamment transport, eau et énergie, terrain, maintenance et conseil. |
| **Réseau social agricole** | Publier du texte et des médias, commenter, aimer, partager ou republier, suivre des profils et gérer ses propres contenus. Des compteurs de vues et d'interactions accompagnent les publications. |
| **Profils et annuaire** | Consulter les profils publics des acteurs, accéder à leur activité et démarrer un échange. Les avatars utilisent des initiales lorsque la photo manque. |
| **Messagerie** | Échanges directs entre membres, liste des conversations, messages non lus et indicateurs de lecture ; actualisation périodique des conversations. |
| **Notifications** | Activité liée aux interactions et aux messages, compteur et marquage comme lu ; actualisation périodique. |
| **Plant AI** | Assistant conversationnel pour les questions agronomiques et l'utilisation d'AgriConnect. |
| **Analyse IA** | Analyse indicative d'une photo de plante : état, symptômes visibles, pistes de maladies, ravageurs ou carences et recommandations. Un diagnostic de terrain reste conseillé. |
| **Matching IA** | Interface de recherche de partenaires par besoin et localisation ; **présentation basée actuellement sur des profils de démonstration et des scores simulés**, pas sur un moteur de correspondance réel ni un envoi garanti. |

Les fonctions interactives qui modifient des données et les deux fonctions IA serveur nécessitent un compte connecté. La disponibilité des réponses IA dépend du service associé et de ses crédits.

## Parcours et accès

1. **Visiteur :** à chaque nouvel accès sans session connectée, l'interface propose le choix entre français, anglais et arabe. Il peut parcourir les espaces publics, avec certaines données de démonstration de repli lorsque la base ne renvoie aucun contenu.
2. **Compte :** connexion ou inscription par courriel et mot de passe dans la fenêtre de profil. L'accès aux données privées dépend des règles d'authentification et des permissions de la base.
3. **Langue du membre :** la préférence est enregistrée dans son profil ; à sa première connexion sans préférence, la langue sélectionnée pour la session est associée au compte. Les connexions suivantes la réutilisent.
4. **Navigation :** la barre principale reste visible. La barre d'outils supérieure et la navigation inférieure se masquent à la descente et reviennent à la remontée, selon la taille de l'écran.

## Architecture technique

Cette version repose sur **React 19**, **TanStack Start v1 / TanStack Router**, **Vite**, **Tailwind CSS v4**, **Bun** et **Lovable Cloud** pour l'authentification, les données et les médias. Les appels d'IA partent de fonctions serveur et non directement du navigateur.

```text
src/
  routes/                 Accueil, pages légales et métadonnées par page
  agriconnect/
    App.jsx               État et orchestration de l'interface principale
    components/            Annonces, réseau, messagerie, IA, profil, navigation…
    i18n.jsx              Traductions et préférence linguistique
    utils/dbSync.js        Lectures, écritures et médias
    data/mockData.js       Contenu de démonstration et catégories
  lib/                    Fonctions serveur pour Plant AI et analyse photo
  integrations/supabase/  Clients et authentification générés
  styles.css              Styles globaux
drizzle/migrations/       Migrations complémentaires, notamment notifications
supabase/migrations/      Historique des migrations initiales de la base
public/                   Favicon, robots.txt, sitemap.xml et llms.txt
```

Les pages de contenu disponibles sont `/`, `/conditions`, `/mentions-legales` et `/politique-d-utilisation`. Les cinq espaces métier sont sélectionnés dans l'application à l'adresse `/` ; ce ne sont pas cinq URL indépendantes. `src/routeTree.gen.ts` est généré automatiquement et ne doit pas être modifié manuellement.

## Démarrer en local

**Prérequis :** Bun, une version récente de Node.js compatible avec Vite, et la configuration d'un environnement cloud du projet à laquelle vous êtes autorisé à accéder. Un clone sans configuration cloud peut afficher l'interface, mais l'authentification, les données ou l'IA ne seront pas entièrement opérationnelles.

```bash
bun install
bun run dev
```

Ouvrir l'adresse affichée par Vite dans le terminal. Autres scripts présents dans `package.json` :

| Commande | Usage |
| --- | --- |
| `bun run build` | Préparer la version de production. |
| `bun run preview` | Prévisualiser la compilation localement. |
| `bun run lint` | Exécuter ESLint. |
| `bun run format` | Reformater les fichiers avec Prettier. |

Le gestionnaire de dépendances de cette version est **Bun** (`bun.lock`) ; ne pas utiliser les instructions `npm` et le `package-lock.json` de l'ancien dépôt pour ce code.

## Configuration

| Variable | Portée | Utilisation |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Client | Adresse du service de données du projet. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client | Clé publiable, soumise aux règles d'accès aux données. |
| `VITE_SUPABASE_PROJECT_ID` | Client | Identifiant public du projet, si fourni par l'environnement. |
| `LOVABLE_API_KEY` | Serveur uniquement | Accès aux fonctions d'IA ; ne jamais l'exposer dans le navigateur. |
| `LOVABLE_DB_MIGRATION_URL` | Outils de migration uniquement | Connexion dédiée aux migrations, si le processus de maintenance l'exige. |

Les variables de configuration sont fournies par l'environnement de développement ou d'hébergement autorisé. **Ne jamais committer un fichier `.env`, des mots de passe, des sessions, des clés privées ou un export de données.** Les variables `VITE_*` sont accessibles au navigateur : elles ne doivent contenir aucun secret. La clé publiable n'est pas une clé d'administration. Vérifier la configuration de l'hébergement avant de déployer hors de l'environnement actuel.

## Données et migrations

- `src/agriconnect/utils/dbSync.js` lit les profils publics, produits, services, publications et conversations ; les notifications sont lues séparément pour le destinataire connecté.
- Les écritures des contenus et de la messagerie s'appuient sur les autorisations de la base. Les compteurs de vues et certaines mises à jour d'interactions utilisent des fonctions de base dédiées.
- Les photos et vidéos sont stockées dans l'espace média du projet. L'interface accepte JPEG, PNG, WebP, MP4 et WebM, dans la limite de **25 Mo par fichier** selon la validation actuelle.
- Les migrations sont réparties entre `supabase/migrations/` et `drizzle/migrations/`. Ne pas rejouer automatiquement les deux historiques sur une base contenant déjà des données : vérifier l'état des migrations et sauvegarder avant toute opération.
- Le contenu de démonstration est défini dans `src/agriconnect/data/mockData.js`. Pour les produits, services et publications, il peut servir de **repli d'affichage** si aucune ligne n'est renvoyée ; son affichage ne prouve pas qu'une annonce existe réellement dans la base.

**Important :** exporter séparément la base de données et les médias lors d'un transfert d'hébergement. Le dépôt de code ne contient ni les comptes ni les messages des utilisateurs.

## Sécurité et confidentialité

- L'authentification est gérée par le service cloud ; les mots de passe ne sont pas enregistrés dans les profils applicatifs.
- Les règles d'accès aux données sont définies dans les migrations. Les profils publics sont limités aux champs destinés à l'annuaire ; les coordonnées personnelles ne doivent pas y être exposées.
- Les fonctions IA vérifient la connexion et valident leurs entrées côté serveur. Elles utilisent une clé serveur, jamais une clé embarquée dans le code client.
- La messagerie et les notifications sont associées aux membres concernés. Certaines écritures de notifications disposent de vérifications et de limites définies dans les migrations.
- Ces protections ne remplacent ni une revue de sécurité régulière ni des sauvegardes. Avant d'ouvrir un nouvel accès aux données, vérifier les droits et les règles pour les visiteurs comme pour les comptes connectés.

## Internationalisation et référencement

- Langues de l'interface : **français, anglais, arabe** ; l'arabe active l'affichage de droite à gauche. Les chaînes traduites sont regroupées dans `src/agriconnect/i18n.jsx`. Tout nouvel écran doit y ajouter ses libellés dans les langues prises en charge ; la traduction des nouveaux textes **n'est pas automatique**.
- Les métadonnées propres à chaque page, les liens canoniques et certaines données structurées sont définis dans les pages sous `src/routes/`.
- `public/sitemap.xml`, `public/robots.txt` et `public/llms.txt` facilitent la découverte des pages. Le domaine canonique est `https://agriconnect-mr.com/` ; la variante `www` dépend de la configuration de redirection du domaine.
- La présence de ces fichiers n'assure pas une position particulière dans les résultats de recherche. L'indexation et les performances doivent être contrôlées dans les outils du moteur de recherche.

## Déploiement et maintenance

Le site public est accessible sur [agriconnect-mr.com](https://agriconnect-mr.com). Une mise en production indépendante exige :

1. un hébergement compatible avec l'application serveur TanStack Start et sa cible d'exécution ;
2. les variables publiques et les secrets serveur configurés **hors du dépôt** ;
3. l'accès à la base, aux règles de sécurité, au stockage média et aux migrations appropriées ;
4. le domaine, le HTTPS et les redirections configurés chez l'hébergeur ;
5. une vérification des parcours de connexion, publication, messagerie, langue, pages légales et IA après déploiement.

**Le dépôt GitHub historique n'est pas automatiquement l'image de ce projet.** Ne pas forcer une synchronisation destructive entre les deux versions sans accord du propriétaire et sans sauvegarde. Pour une synchronisation bidirectionnelle durable, connecter ce projet au dépôt autorisé depuis les réglages GitHub de l'éditeur ; cela exige des droits d'écriture et une stratégie explicite pour conserver ou remplacer l'ancienne version.

## Limites connues

- **Matching IA :** les candidats proviennent actuellement des données de démonstration ; les scores et distances sont simulés. La confirmation d'envoi dans cette interface n'est pas une preuve de transmission réelle à des prestataires.
- **Contenu de repli :** une liste affichée lorsque la base est vide peut être de démonstration (voir [Données et migrations](#données-et-migrations)).
- **Traductions :** les nouvelles chaînes doivent être ajoutées manuellement dans les trois langues ; certains textes historiques peuvent rester en français.
- **Analyse photo :** résultat indicatif, non substituable à une expertise agronomique sur place.
- **Dépôt distant :** l'ancien dépôt React/Vite ne contient pas encore nécessairement cette version. Le README de la branche distante doit être vérifié séparément avant d'y suivre des instructions d'installation.

## Contact

**Agrosky** · Nouakchott, Mauritanie · [agrosky00@gmail.com](mailto:agrosky00@gmail.com)

Informations réglementaires : [Mentions légales](https://agriconnect-mr.com/mentions-legales) · [Conditions d'utilisation](https://agriconnect-mr.com/conditions) · [Politique d'utilisation](https://agriconnect-mr.com/politique-d-utilisation)
