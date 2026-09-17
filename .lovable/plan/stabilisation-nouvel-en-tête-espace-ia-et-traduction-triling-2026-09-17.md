# Stabilisation, nouvel en-tête, espace IA et traduction trilingue

## Objectif
Réorganiser l’interface d’AgriConnect conformément aux deux références fournies, éliminer les chevauchements sur tous les formats d’écran, améliorer la section Intelligence artificielle et rendre l’application disponible en français, anglais et arabe.

## Travaux prévus

### 1. En-tête stable sur mobile, tablette et ordinateur
- Créer une première ligne dédiée à l’identité AgriConnect, centrée et indépendante des actions.
- Afficher le logo, le nom **AgriConnect**, le badge **PRO** et le sous-titre **Le réseau professionnel agricole**, comme sur la deuxième référence.
- Placer sur une deuxième ligne le bouton de publication, le profil/connexion, la recherche, les notifications et la messagerie.
- Intégrer la recherche au milieu de cette ligne sur les grands écrans et sous forme de champ dépliable stable sur petit écran.
- Conserver la navigation principale sur une troisième ligne défilable horizontalement, sans couper les libellés ni élargir la page.

### 2. Stabilisation générale des écrans
- Empêcher tout débordement horizontal et toute variation brutale de largeur.
- Normaliser les largeurs maximales, les zones défilantes, les fenêtres, la messagerie et les commentaires.
- Vérifier les éléments fixes, les menus et les compteurs afin qu’ils ne se chevauchent pas.
- Préserver toutes les fonctionnalités existantes.

### 3. Refonte de la section Intelligence artificielle
- Donner à Plant AI, Analyse IA et Matching IA une navigation plus lisible et plus compacte sur mobile.
- Renforcer la hiérarchie du titre, des descriptions et de l’outil actif sans imbriquer inutilement plusieurs cartes.
- Améliorer Plant AI avec une transcription plus aérée, des suggestions stables et une zone de saisie toujours accessible.
- Conserver les fonctions IA existantes sans lancer de requêtes IA pendant les tests afin de protéger les crédits.

### 4. Français, anglais et arabe
- Ajouter un sélecteur FR / EN / AR visible dans l’en-tête.
- Créer une source de traduction centralisée avec une fonction unique utilisée par les écrans.
- Traduire l’ensemble des textes visibles de la plateforme, y compris navigation, marketplaces, réseau, profils, messagerie, notifications, création, connexion, IA, pied de page et messages d’état.
- Mémoriser la langue choisie sur l’appareil ; français par défaut.
- Activer automatiquement l’écriture de droite à gauche pour l’arabe et rétablir de gauche à droite pour le français et l’anglais.
- Structurer les nouveaux textes avec des clés de traduction afin que les futures modifications soient ajoutées simultanément dans les trois langues.

### 5. Vérification finale
- Vérifier le rendu et les interactions aux formats mobile et ordinateur.
- Tester l’en-tête, la recherche, la navigation, les menus, les fenêtres, la messagerie, les commentaires et les trois outils IA sans consommer de réponse IA.
- Contrôler successivement les versions française, anglaise et arabe, notamment l’alignement RTL.
- Corriger les erreurs visibles, les débordements et les régressions détectés.

## Détails techniques
- Conserver l’architecture et la base de données actuelles.
- Introduire un contexte de langue léger et un dictionnaire typé/structuré, sans service externe de traduction.
- Adapter l’attribut `lang` et la direction du document côté navigateur sans provoquer de conflit d’affichage au chargement.
- Réutiliser le logo AgriConnect existant ; les images envoyées servent uniquement de référence visuelle.
