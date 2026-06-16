# AGENT.md

Ce fichier est le point d'entrée pour tout agent (Claude Code ou autre) qui travaille sur ce dépôt. Il donne le contexte minimal nécessaire avant de modifier le code, et explique comment garder la documentation à jour.

## C'est quoi ce projet

**Chai Gestion Congé** (nom interne historique : "LeaveEase", titre affiché dans l'app : "CHAI Request") est une application web de gestion des congés pour les employés de Clinton Health Access Initiative (CHAI). Elle permet de :

- soumettre une demande de congé (annuel, maladie, paternité, maternité, circonstance) ;
- la faire approuver via un workflow à plusieurs niveaux (Superviseur → Manager, ou directement RH selon le type) ;
- suivre l'historique des demandes ;
- administrer les comptes employés (rôles, contrats, solde de jours) ;
- générer un PDF imprimable du formulaire de congé une fois approuvé/rejeté ;
- envoyer des notifications email à chaque étape.

Un module IA (Genkit) est présent mais **non implémenté** (stub qui lève une erreur) — voir `docs/ai-suggestions/INDEX.md`.

## Stack technique

- **Next.js 15** (App Router) + **TypeScript** + **React 18**
- **Firebase** : Auth (client) + Firestore (base de données) + firebase-admin (API routes serveur, ex. reset password)
- **UI** : Tailwind CSS + shadcn/ui (Radix) + react-hook-form + zod
- **Email** : Nodemailer via une route API (`/api/send-email`)
- **IA** : Google Genkit (non branché, stub)

Voir `README.md` pour les commandes de démarrage (`yarn dev`, etc.).

## Structure du code

```
src/
  app/            Pages et routes Next.js (App Router) + API routes
  components/     Composants React (UI + métier)
  context/        AuthProvider / useAuth (source de vérité, voir piège ci-dessous)
  lib/             Logique métier serveur/client : firebase, employee, requests, email, leave-history, utils
  ai/              Genkit (stub, non utilisé en prod)
  types/           Types TypeScript partagés (Employee, LeaveRequest, etc.)
```

### Pièges connus à ne pas réintroduire

- **Deux fichiers `auth-context.tsx` existent** : `src/context/auth-context.tsx` (utilisé partout, importé via `@/context/auth-context`) et `src/components/auth-context.tsx` (mort, non importé nulle part — reliquat d'un bug "double auth" corrigé). Ne pas réutiliser ni dupliquer ce deuxième fichier ; le supprimer si l'occasion se présente, et toujours importer depuis `@/context/auth-context`.
- Les rôles employé (`EmployeeRole`) sont un **tableau** (`role: EmployeeRole[]`), un même employé peut être Supervisor + Manager. Toute logique de permission doit utiliser `.includes(...)`, jamais une comparaison stricte `===`.
- Les jours fériés/calcul de jours ouvrés sont codés en dur pour l'année **2026** dans `src/lib/utils.ts` (`publicHolidays`). À mettre à jour chaque année.
- Le mot de passe initial des nouveaux employés est codé en dur (`"Chai2025"`) dans `src/components/admin-panel.tsx`, suivi d'un email de réinitialisation Firebase.

## Modules / Features

La documentation détaillée par module vit dans `docs/<module>/INDEX.md` :

- [`docs/auth/`](docs/auth/INDEX.md) — Authentification (Firebase Auth, AuthProvider, page signin)
- [`docs/leave-requests/`](docs/leave-requests/INDEX.md) — Soumission de demande de congé
- [`docs/approvals-workflow/`](docs/approvals-workflow/INDEX.md) — Workflow d'approbation multi-niveaux et statuts
- [`docs/employee-admin/`](docs/employee-admin/INDEX.md) — Panneau d'administration des employés (rôles, contrats, reset password)
- [`docs/leave-history/`](docs/leave-history/INDEX.md) — Historique des demandes et tableau de bord
- [`docs/email-notifications/`](docs/email-notifications/INDEX.md) — Notifications email à chaque étape
- [`docs/download-pdf/`](docs/download-pdf/INDEX.md) — Génération du formulaire imprimable
- [`docs/ai-suggestions/`](docs/ai-suggestions/INDEX.md) — Module Genkit (non implémenté)

Le fichier `docs/blueprint.md` est le document de design d'origine (nom de code "LeaveEase") ; il est conservé comme référence historique mais peut diverger de l'état actuel — préférer les INDEX.md ci-dessus.

## Règles git

Voir **[AGENT_GIT.md](AGENT_GIT.md)** : convention de branches (`claude-<type>/<nom>`, créée depuis `claude`), workflow (tester/compiler avant de pousser), et règles de commit/PR. À lire avant de commencer toute modification de code.

## Règle de mise à jour de la documentation

**Après toute modification non triviale** (nouvelle feature, changement de workflow, changement de schéma de données, refactor d'un module, fix d'un bug qui révèle un piège non documenté) :

1. Identifie le(s) module(s) concerné(s) dans la liste ci-dessus.
2. Mets à jour le(s) `docs/<module>/INDEX.md` correspondant(s) : description, fichiers clés, points d'attention.
3. Si la modification crée un nouveau module/feature transverse, crée `docs/<nouveau-module>/INDEX.md` et ajoute-le à la liste ci-dessus.
4. Si la modification change un piège/règle globale (ex: nouvelle convention, nouveau champ partagé), mets à jour la section "Pièges connus" de ce fichier.

Une modif "triviale" (typo, style, renommage local sans impact fonctionnel) ne nécessite pas de mise à jour de la doc.
