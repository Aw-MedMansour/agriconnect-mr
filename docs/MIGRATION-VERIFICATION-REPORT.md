# AgriConnect MR — Rapport de vérification finale

Date UTC : 2026-11-16T22:31:38.386771+00:00

## Décision : RETRAIT INTERDIT

Aucun ancien projet, enregistrement, fichier ou lien non résolu n’a été supprimé ni désactivé pendant cette vérification. La migration réelle n’est pas confirmée. Le précédent bilan validait le code et des essais sur données fictives, pas le transfert de vos données de production.

| Condition | Résultat | Motif |
|---|---|---|
| Base PostgreSQL 18 : nombres et relations préservés | BLOQUÉ / NON VÉRIFIÉ | Aucun accès au PostgreSQL du VPS dans cette session. Aucun nombre cible ni comparaison réelle ne peut être attesté. |
| Médias originaux physiquement transférés et intègres | BLOQUÉ / NON VÉRIFIÉ | Aucun accès aux originaux téléchargés ni au volume réel `/app/data/media/`. Aucun fichier cible n’a été vérifié. |
| Zéro dépendance exécutée aux anciennes URL | VALIDATION GLOBALE BLOQUÉE | Aucun ancien lien ou import actif détecté dans le code applicatif inspecté, mais six annonces source contiennent encore des URL Storage. La base cible, ses réponses et ses requêtes après connexion ne sont pas accessibles. |

## Inventaire réel de l’ancienne base (lecture seule)

| Ensemble source | Nombre |
|---|---:|
| Comptes | 77 |
| Profils privés | 61 |
| Profils publics dérivés | 61 |
| Produits | 8 |
| Services | 8 |
| Publications sociales | 4 |
| Conversations | 31 |
| Notifications | 84 |
| Objets du stockage agroconnect-media | 25 |

Taille totale déclarée par les métadonnées de stockage : **33 201 794 octets**. Les 25 objets ont une taille renseignée. Il s’agit d’un inventaire, non d’une preuve d’intégrité physique.

## Anomalies déjà présentes à la source

- **13 contenus** ont un propriétaire sans compte correspondant dans l’ancienne authentification.
- **9 références de participants** de conversations n’ont pas de compte correspondant. Ce nombre compte les références, pas nécessairement des personnes distinctes.
- **34 notifications** ont un destinataire sans compte correspondant.
- Aucun acteur de notification sans compte correspondant détecté.
- **3 produits et 3 services** contiennent encore des liens `/storage/v1/` dans leur document source ; ce sont six documents, pas nécessairement six fichiers.

Ces anomalies empêchent une affirmation « toutes les relations préservées ». Certaines peuvent concerner d’anciens contenus de démonstration ou des comptes supprimés ; leur origine n’a pas été établie. Aucun compte fictif n’a été créé pour les masquer. Les identifiants des fichiers/relations manquants côté cible sont inconnus sans accès à cette cible.

## Garde-fous et corrections effectués

- Ajout d’un vérificateur en lecture seule : `scripts/supabase-import/verify.ts`, guide `docs/FINAL-MIGRATION-VERIFICATION.md`.
- Le vérificateur bloque le retrait si un accès manque, si les nombres/identifiants/dates diffèrent, si les propriétaires/participants/acteurs/destinataires ne correspondent pas, si les nombres de messages changent, si les fichiers ou leurs empreintes SHA-256 divergent, ou si le contrôle des anciens liens et du trafic fourni échoue.
- Le contrôle physique exige le vrai montage `/app/data/media`, ainsi qu’une copie indépendante des originaux conservant les chemins du bucket.
- L’importateur ne transforme plus silencieusement un propriétaire/acteur absent en relation nulle et ne filtre plus silencieusement les participants manquants : la ligne concernée est signalée et l’original reste intact.
- Les erreurs de lecture de l’ancienne base/du stockage ne sont plus assimilées à des listes vides dans l’importateur.
- Les anciens liens non résolus et l’ancienne base sont conservés. Aucun nouvel import réel n’a été exécuté.
- Des fichiers d’intégration sont régénérés par l’éditeur mais ne sont pas importés par l’application ; ils sont conservés, exclus du contrôle TypeScript applicatif, et distingués des dépendances exécutées. Cela ne signifie pas que toute trace textuelle de l’ancien fournisseur a disparu du dépôt.

## Vérifications réellement exécutées

- Requêtes en lecture seule sur la source : inventaire, nombres, références de comptes et présence de liens Storage.
- Recherche statique dans `src/` et `public/` : zéro ancien lien/import actif trouvé hors intégration générée non utilisée.
- Exécution du vérificateur : **retirement BLOCKED** ; variables manquantes : SOURCE_DATABASE_URL, DATABASE_URL, SOURCE_MEDIA_DIR, MEDIA_DIR, VERIFICATION_HAR.
- **4 tests automatiques réussis** : trois conditions obligatoires, mêmes nombres mais identifiants/dates différents, détection imbriquée des anciennes URL, empreintes physiques modifiées/fichier absent.
- Contrôle de style ciblé : aucune erreur. Dernier état de construction de l’aperçu : `build OK`.

Le vérificateur complet n’a pas été testé de bout en bout contre les deux bases réelles et le volume VPS ; aucune garantie de migration réelle n’est revendiquée. Le parcours connecté du VPS reste non vérifié.

## Suite nécessaire avant toute suppression

1. Fournir un accès sûr au déploiement PostgreSQL 18 cible, sans publier de secrets dans le chat.
2. Récupérer indépendamment les 25 originaux ; pour Lovable Cloud, télécharger via **More → Storage**. L’export officiel de base contient les comptes mais pas ces fichiers.
3. Revoir les relations orphelines, identifier les personnes/contenus concernés et décider explicitement de leur traitement ; conserver les originaux. Ne pas inventer de comptes ni éliminer des données pour obtenir un rapport vert.
4. Importer/réparer les enregistrements et médias réellement manquants après sauvegarde. Ne remplacer chaque ancien lien qu’après validation du fichier local correspondant.
5. Exécuter le vérificateur sur le VPS et fournir un HAR privé, nettoyé des secrets, attestant les parcours connectés et la lecture de tous les médias migrés, conformément au guide.
6. Refaire les trois contrôles sur une source figée pour le basculement ; éviter des écritures dans l’ancienne base entre comparaison finale et bascule.

**Aucune autorisation de retrait ne découle de ce rapport. Les trois conditions restent à confirmer sur le VPS réel.**
