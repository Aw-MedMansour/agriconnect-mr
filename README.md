# AgriConnect

**AgriConnect** est une plateforme numérique professionnelle dédiée au secteur agricole en Mauritanie et dans la région. Elle met en relation les acteurs de la filière — producteurs, éleveurs, coopératives, fournisseurs de services, acheteurs et experts — au sein d'un écosystème unifié, moderne et accessible.

---

## Liens utiles

- **Site en production** : https://agriconnect-mr.com
- **Dépôt GitHub** : https://github.com/Aw-MedMansour/agriconnect-mr
- **Contact** : agrosky00@gmail.com

---

## Fonctionnalités principales

### Marketplace

- **Produits agricoles** : publication de produits avec quantités, unités (kg, tonne, litre) et prix.
- **Services agricoles** : mise en relation avec des prestataires (transport, conseil, équipement, etc.).

### Réseau social agricole

- Fil d'actualités dédié à l'agriculture.
- Publications texte, image et lien.
- Likes, commentaires, partages et compteurs de vues persistants.
- Suppression de ses propres publications et commentaires.

### Messagerie

- Conversations privées entre membres.
- Interface de messagerie plein écran et responsive.
- Accusés de lecture (envoyé, reçu, lu).
- Suppression de ses propres discussions.

### Intelligence artificielle

- **Plant AI Chatbot** : chatbot agronome sous la tutelle de FulanIA, capable de répondre aux questions agricoles et de conseiller les utilisateurs.
- **Analyse IA de plantes** : identification et diagnostic à partir d'une photo.
- **Matching IA** : mise en relation intelligente entre offres et besoins.

### Notifications

- Centre de notifications en temps réel.
- Notifications liées aux messages, likes, commentaires, follows et interactions sur les publications.
- Politiques de sécurité renforcées contre l'abus et la falsification.

### Profils et annuaire

- Profil utilisateur avec avatar à initiales et gradients.
- Annuaire des acteurs et système de réputation.
- Authentification sécurisée.

### Multilingue

- **Français**, **anglais** et **arabe**.
- Sélecteur de langue dans le profil.
- Interface RTL pour l'arabe.

---

## Stack technique

- **Framework** : TanStack Start
- **Interface** : React 19, TypeScript
- **Styles** : Tailwind CSS v4
- **Backend / Auth / Base de données** : Supabase
- **Build** : Vite 7
- **Hébergement** : Lovable Cloud

---

## Installation locale

```sh
git clone https://github.com/Aw-MedMansour/agriconnect-mr.git
cd agriconnect-mr
npm install
npm run dev
```

---

## Structure des modules

- `src/agriconnect/components/` : composants React de l'application
- `src/agriconnect/utils/` : synchronisation, base de données, helpers
- `src/agriconnect/i18n.jsx` : gestion des langues (fr / en / ar)
- `supabase/migrations/` : migrations de la base de données

---

## Partenaire

AgriConnect est développé en partenariat avec **Agrosky**, basé à Nouakchott, Mauritanie.

---

## Licence

© AgriConnect / Agrosky. Tous droits réservés.
