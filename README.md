# AgriConnect

AgriConnect est une plateforme professionnelle agricole éditée par **Agrosky** à Nouakchott, en Mauritanie. Elle met en relation agriculteurs, acheteurs, transporteurs et prestataires.

Site : [agriconnect-mr.com](https://agriconnect-mr.com)

## Fonctionnalités

- Marketplace de produits agricoles et de services.
- Réseau social agricole, profils et annuaire des acteurs.
- Messagerie entre membres et notifications.
- Espace IA : Plant AI, analyse de plantes par photo et matching.
- Interface en français, anglais et arabe.

Certaines fonctionnalités demandent une connexion et la disponibilité des services associés.

## Développement local

Cette version utilise React 19, TanStack Start, Vite, Tailwind CSS et Lovable Cloud pour les données et l'authentification. Elle est distincte de l'ancien dépôt GitHub React/Vite ; ne pas utiliser les commandes ou variables de cet ancien dépôt pour démarrer cette version.

Prérequis : Bun et accès à la configuration de l'environnement du projet. Les valeurs privées ne doivent jamais être ajoutées au dépôt.

```bash
bun install
bun run dev
```

Commandes disponibles : `bun run build`, `bun run lint` et `bun run preview`.

## Structure

- `src/routes/` : pages et métadonnées du site.
- `src/agriconnect/` : interface et fonctionnalités de la plateforme.
- `src/lib/` : appels serveur pour les outils IA.
- `supabase/` : migrations et configuration du projet cloud.

## Contact

Agrosky — [agrosky00@gmail.com](mailto:agrosky00@gmail.com)
