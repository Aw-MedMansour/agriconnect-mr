# Vérification finale : retrait interdit tant que les trois contrôles ne passent pas

L'ancien projet, ses données et ses fichiers ne doivent être ni supprimés ni désactivés. Les tests sur données fictives ne constituent pas une preuve de migration réelle.

## Exécuter sur le VPS cible

1. Utiliser une connexion **en lecture seule** à l'ancienne base et la connexion au PostgreSQL 18 cible. Les définir dans `SOURCE_DATABASE_URL` et `DATABASE_URL`, sans les publier.
2. Télécharger indépendamment les originaux via **More → Storage**, conserver leur arborescence relative au bucket dans `SOURCE_MEDIA_DIR`. Un dossier recopié depuis les fichiers cibles ne prouve pas la fidélité aux originaux.
3. Exécuter le contrôle dans l'environnement où le vrai volume est monté à `MEDIA_DIR=/app/data/media`. Ne pas utiliser le dossier de test.
4. Enregistrer les lectures réelles après connexion : profils, produits, services, posts, conversations, notifications et affichage de **tous** les médias migrés. Exporter un HAR avec les réponses, retirer cookies, en-têtes Authorization, mots de passe et jetons. Garder ce fichier privé. Après vérification humaine, ajouter à sa racine `verificationCoverage` avec les huit clés suivantes à `true` : `signedIn`, `profiles`, `products`, `services`, `posts`, `conversations`, `notifications`, `allMigratedMedia`. Définir `VERIFICATION_HAR` sur ce fichier. Ces attestations ne remplacent pas le contrôle humain ; ne pas les remplir avant les parcours.
5. Depuis la racine du projet :

```bash
bun scripts/supabase-import/verify.ts --report=migration-verification.json
```

Le script effectue uniquement des lectures dans deux transactions cohérentes. Il compare les nombres, identifiants et dates, les propriétaires, participants, acteurs et destinataires ; il vérifie aussi les nombres de messages. Il compare les octets SHA-256 source/fichier local/métadonnées locales, et inspecte les liens stockés, le code applicatif et les requêtes/réponses fournies.

Une sortie `2`, un accès absent, un fichier manquant, une relation orpheline ou un ancien lien bloque le retrait. Le rapport JSON indique les identifiants/chemins concernés ; le conserver privé. Aucun retrait n'est exécuté automatiquement, même avec une sortie `0`.

## Corriger avant de réessayer

- Importer les données/fichiers manquants sans modifier la source.
- Ne jamais créer des comptes fictifs pour faire disparaître une relation orpheline. Identifier son propriétaire réel ou faire valider explicitement son traitement, en conservant l'original.
- Ne remplacer un ancien lien qu'après comparaison du fichier physique avec l'original. Les rendus d'images, liens signés, publics et authentifiés doivent tous être contrôlés.
- Un import qui a ignoré une ligne existante ne prouve pas que cette ligne est correcte. Réparer seulement les différences identifiées, après sauvegarde et revue.
- Les fichiers d'intégration régénérés par l'éditeur peuvent rester sur disque sans être importés par l'application. Le contrôle du code distingue ce reliquat d'une dépendance exécutée ; toute réintroduction dans le code applicatif bloque la validation.

Ne pas envoyer le HAR ni les chaînes de connexion dans le chat. Si l'ancienne base est uniquement disponible dans Lovable Cloud, utiliser l'export officiel (**More → Database → Manage → Settings → Export data**) puis une copie isolée accessible en lecture seule ; cet export n'inclut pas les médias.