# Chai Gestion Congé

Une application web moderne pour la gestion des congés des employés, construite avec Next.js et Firebase.

## Description

Ce projet est une application web complète conçue pour simplifier et automatiser le processus de demande et de gestion des congés au sein d'une entreprise. Elle offre une interface intuitive pour les employés et des outils puissants pour les administrateurs, tout en intégrant une touche d'intelligence artificielle pour optimiser les workflows.

## Fonctionnalités Principales

-   **Authentification :** Système sécurisé d'inscription et de connexion pour les utilisateurs.
-   **Demande de Congé :** Un formulaire simple permet aux employés de soumettre leurs demandes de congé.
-   **Historique des Congés :** Chaque utilisateur peut consulter l'historique et le statut de ses demandes (approuvées, en attente, rejetées).
-   **Panneau d'Administration :** Une interface dédiée permet aux managers ou au personnel RH de visualiser, approuver ou rejeter les demandes en attente.
-   **Suggestion d'Approbateurs par IA :** Utilise l'intelligence artificielle (Google Genkit) pour suggérer les personnes les plus appropriées pour approuver une demande de congé.

## Stack Technique

-   **Framework :** [Next.js](https://nextjs.org/) (avec le App Router)
-   **Langage :** [TypeScript](https://www.typescriptlang.org/)
-   **Interface Utilisateur (UI) :**
    -   [React](https://react.dev/)
    -   [Tailwind CSS](https://tailwindcss.com/)
    -   [shadcn/ui](https://ui.shadcn.com/) pour les composants
-   **Backend & Infrastructure :**
    -   [Firebase](https://firebase.google.com/) (pour l'Authentification, la base de données Firestore et l'Hébergement)
-   **Intelligence Artificielle :**
    -   [Google Genkit](https://firebase.google.com/docs/genkit)

## Structure du Projet

Le code source est organisé dans le dossier `src/` de la manière suivante :

-   `src/app/` : Contient les pages et les routes de l'application.
-   `src/components/` : Composants React réutilisables (UI et fonctionnels).
-   `src/lib/` : Logique métier, fonctions utilitaires et intégration avec des services externes (ex: Firebase).
-   `src/context/` : Gestion de l'état global, notamment le contexte d'authentification.
-   `src/ai/` : Toute la logique liée à l'IA avec Genkit.
-   `src/types/` : Définitions des types TypeScript utilisés dans le projet.

## Pour Commencer

Pour lancer le projet en local, suivez ces étapes :

1.  **Installer les dépendances :**
    ```bash
    yarn install
    ```

2.  **Lancer le serveur de développement :**
    ```bash
    yarn dev
    ```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur pour voir l'application.
