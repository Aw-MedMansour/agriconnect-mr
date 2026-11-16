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

**React 19**, **TanStack Start v1** (rendu serveur + fonctions serveur), **Vite**, **Tailwind CSS v4**, **Bun**, et une base **PostgreSQL 18.7** auto-hébergée via **Drizzle ORM** et le pilote **Postgres.js**. Aucune dépendance d'exécution à un service de données externe : comptes, sessions, données et médias sont gérés par le serveur de l'application.

```text
Navigateur (React) ──fonctions serveur / API──▶ Serveur Node 22 (TanStack Start)
                                                 ├─ Sessions (cookie HttpOnly) + Argon2id
                                                 ├─ Règles d'accès (src/server/services)
                                                 ├─ PostgreSQL 18.7 (Drizzle, volume pgdata)
                                                 └─ Médias (volume /app/data/media, URL signées)
```

```text
src/
  routes/                  Pages, /api/health, /api/ready, /api/media/*
  agriconnect/             Interface (App.jsx, composants, i18n, utils/authClient.js, utils/dbSync.js)
  lib/                     Fonctions serveur : auth, données, Plant AI, analyse photo
  server/
    db/schema.ts           Schéma unique de la base (source de vérité)
    db/client.server.ts    Pool Postgres.js + Drizzle
    auth/                  Argon2id, jetons de session
    services/              Authentification, règles d'accès (ex-politiques de la base)
    media/                 Validation, stockage et URL signées des médias
db/migrations/             Migrations SQL versionnées (Drizzle Kit) + db/RECOVERY.md
scripts/                   Migrations, sauvegarde/restauration, import de l'ancienne base, outils admin
tests/                     Tests d'intégration (PostgreSQL 18 réel)
```

`drizzle/` et `supabase/` contiennent l'**historique de l'ancienne base hébergée** ; ils ne sont pas utilisés par l'application auto-hébergée et ne doivent pas être rejoués sur la nouvelle base.

## Démarrer en local

Prérequis : Bun 1.2+, Node 22, PostgreSQL 18 (ou Docker).

```bash
bun install
docker run -d --name agri-pg -e POSTGRES_PASSWORD=dev -p 127.0.0.1:5432:5432 postgres:18.7-alpine3.24
export DATABASE_URL=postgres://postgres:dev@127.0.0.1:5432/postgres
export SESSION_SECRET=$(openssl rand -base64 48) MEDIA_SIGNING_SECRET=$(openssl rand -base64 48) MEDIA_DIR=./data/media
bun run db:migrate
bun run dev
```

| Commande | Usage |
| --- | --- |
| `bun run db:generate --name <nom>` | Générer une migration après modification de `src/server/db/schema.ts`. |
| `bun run db:migrate` / `db:migrate:dry` | Appliquer / lister les migrations en attente. |
| `bun run db:check` | Contrôler les migrations (notes de reprise, SQL destructif, cohérence). |
| `bun run test` | Tests d'intégration (`TEST_DATABASE_URL` vers un PostgreSQL 18 jetable). |
| `bun run typecheck` / `lint` | Vérification des types / ESLint. |
| `DEPLOY_TARGET=node bun run build` | Compilation serveur Node (utilisée par Docker). |

## Configuration

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `DATABASE_URL` | oui | Connexion PostgreSQL (réseau Docker interne). |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | oui (Docker) | Initialisation du conteneur PostgreSQL. |
| `SESSION_SECRET` | oui, 32+ caractères | Clé de hachage des jetons de session. |
| `MEDIA_SIGNING_SECRET` | oui, 32+ caractères | Signature des URL de médias. |
| `MEDIA_DIR` | non (`/app/data/media`) | Dossier du volume média. |
| `LOVABLE_API_KEY` | pour l'IA | Plant AI et analyse photo. |
| `BACKUP_INTERVAL_HOURS`, `BACKUP_RETENTION_DAYS` | non (24, 14) | Planification et rétention des sauvegardes. |

Tous ces secrets sont **serveur uniquement** (aucun préfixe `VITE_`). L'application refuse de démarrer si une variable obligatoire manque. Ne jamais committer `.env.production`.

## Données et migrations

- Le navigateur n'accède jamais à la base : toutes les lectures/écritures passent par `src/lib/data.functions.ts`, qui identifie le membre **uniquement** par sa session serveur.
- Flux obligatoire d'une évolution : *modifier le schéma → `db:generate` → relire le SQL → ajouter la section dans `db/RECOVERY.md` → tester (`bun run test`) → committer schéma + migration ensemble → déployer → migration appliquée par le service `migrate` → vérification de santé*.
- Ne jamais modifier une migration déjà appliquée (le lanceur le détecte et s'arrête). Jamais de `drizzle-kit push` en production.
- Le SQL destructif (DROP, TRUNCATE, changement de type, renommage, DELETE sans WHERE) est refusé sauf marqueur `-- migrate:allow-destructive` ajouté après revue et sauvegarde vérifiée ; suivre la stratégie *expand-and-contract*.
- Médias : JPEG, PNG, WebP, MP4, WebM, **25 Mo maximum**, type vérifié sur le contenu réel du fichier, nom aléatoire, stockés sur le volume `media`.

## Sécurité et confidentialité

- Mots de passe hachés en **Argon2id** ; sessions stockées en base (seul un hachage du jeton est conservé), cookie `HttpOnly`, `SameSite=Lax`, `Secure` en production, expiration 30 jours glissants, rotation à chaque connexion, révocation à la déconnexion.
- Protection CSRF (origine vérifiée sur les fonctions serveur et l'envoi de médias) ; limites : 10 essais de connexion / 15 min par adresse, 30 / 15 min par IP, 10 inscriptions / heure par IP, 30 notifications / minute par membre.
- Règles d'accès recréées côté serveur et couvertes par des tests : un membre ne modifie que son profil et ses publications ; les autres membres ne peuvent changer que les interactions (j'aime, commentaires, partages, vues) ; conversations réservées aux participants ; notifications lisibles et modifiables (statut de lecture seulement) par leur destinataire ; annuaire limité aux champs publics, coordonnées retirées ; suppression de contenu par l'auteur ou un administrateur (`scripts/grant-admin.ts`).

## Internationalisation et référencement

- Langues de l'interface : **français, anglais, arabe** ; l'arabe active l'affichage de droite à gauche. Les chaînes traduites sont regroupées dans `src/agriconnect/i18n.jsx`. Tout nouvel écran doit y ajouter ses libellés dans les langues prises en charge ; la traduction des nouveaux textes **n'est pas automatique**.
- Les métadonnées propres à chaque page, les liens canoniques et certaines données structurées sont définis dans les pages sous `src/routes/`.
- `public/sitemap.xml`, `public/robots.txt` et `public/llms.txt` facilitent la découverte des pages. Le domaine canonique est `https://agriconnect-mr.com/` ; la variante `www` dépend de la configuration de redirection du domaine.
- La présence de ces fichiers n'assure pas une position particulière dans les résultats de recherche. L'indexation et les performances doivent être contrôlées dans les outils du moteur de recherche.

## Déploiement et maintenance

Déploiement Docker / Coolify, sauvegardes, restauration, import de l'ancienne base et reprise après incident : voir **[DEPLOYMENT.md](DEPLOYMENT.md)** (anglais) et **[DEPLOYMENT-AR.md](DEPLOYMENT-AR.md)** (arabe). La CI (`.github/workflows/ci.yml`) applique toutes les migrations sur un PostgreSQL 18 temporaire, puis lance types, lint, tests, compilation et validation Docker Compose.

## Limites connues

- **Matching IA :** les candidats proviennent actuellement des données de démonstration ; les scores et distances sont simulés. La confirmation d'envoi dans cette interface n'est pas une preuve de transmission réelle à des prestataires.
- **Contenu de repli :** une liste affichée lorsque la base est vide peut être de démonstration (voir [Données et migrations](#données-et-migrations)).
- **Traductions :** les nouvelles chaînes doivent être ajoutées manuellement dans les trois langues ; certains textes historiques peuvent rester en français.
- **Analyse photo :** résultat indicatif, non substituable à une expertise agronomique sur place.
- **Dépôt distant :** l'ancien dépôt React/Vite ne contient pas encore nécessairement cette version. Le README de la branche distante doit être vérifié séparément avant d'y suivre des instructions d'installation.

## Contact

**Agrosky** · Nouakchott, Mauritanie · [agrosky00@gmail.com](mailto:agrosky00@gmail.com)

Informations réglementaires : [Mentions légales](https://agriconnect-mr.com/mentions-legales) · [Conditions d'utilisation](https://agriconnect-mr.com/conditions) · [Politique d'utilisation](https://agriconnect-mr.com/politique-d-utilisation)
