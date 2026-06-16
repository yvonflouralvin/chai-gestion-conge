# Employee Admin

Panneau d'administration des comptes employés : création, édition des rôles/superviseur, gestion des contrats, calcul du solde de congé annuel, réinitialisation de mot de passe.

## Fichiers clés

- `src/components/admin-panel.tsx` — composant principal, affiché dans l'onglet "Employee Management" pour les Admins (`src/app/page.tsx`). Contient deux formulaires zod : `employeeSchema` (identité/rôles/superviseur) et `contractSchema` (poste/équipe/type/dates).
- `src/app/api/users/[uid]/password/route.ts` — route API `PATCH`, utilise `firebase-admin` (`adminAuth.updateUser`) pour changer un mot de passe sans connaître l'ancien. Appelée par `admin-panel.tsx` via `handleSetEmployePassword`.
- `src/lib/firebase-admin.ts` — credential serveur (`FIREBASE_SERVICE_ACCOUNT_KEY`), nécessaire à la route ci-dessus.
- `src/lib/utils.ts` — `calculateContractLeaveDays(contract)` (≈1.75 jour/mois de contrat), `getCurrentContract`/`getFirstContract`, `processEmployee` (mappe un doc Firestore brut vers `EmployeeWithCurrentContract`).
- `src/components/admin/employee/ResetPasswordDialog.tsx` — **composant mort, non utilisé** (le bloc JSX correspondant dans `admin-panel.tsx` est commenté ; la vraie UI de reset password est inline dans `admin-panel.tsx`). Ne pas s'appuyer sur ce fichier, il est désynchronisé (pas branché à l'API).

## Flux principaux

- **Ajouter un employé** : `handleAddEmployee` crée le compte Firebase Auth (`createUserWithEmailAndPassword`) avec un mot de passe temporaire codé en dur (`"Chai2025"`), crée le document Firestore `users/{uid}` (rôles, superviseur, premier contrat, `availableLeaveDays` calculé depuis le contrat), puis envoie un email de réinitialisation Firebase (`sendPasswordResetEmail`). Comme la création d'un utilisateur change la session Auth active côté client, le code restaure ensuite la session de l'admin (`auth.updateCurrentUser(adminUser)`).
- **Éditer un employé** : `handleUpdateEmployee` met à jour seulement `name`, `role`, `supervisorId`, `availableLeaveDays` (pas l'email, champ désactivé dans le formulaire).
- **Ajouter un contrat** : `handleAddContract` archive le contrat précédent (`arrayUnion` dans le tableau `contracts`) et **ajoute** au solde existant les nouveaux jours calculés (`calculateContractLeaveDays`) via une `runTransaction`.
- **Réinitialiser le mot de passe** (Admin uniquement) : ouvre un dialog inline, saisie du nouveau mot de passe (min. 6 caractères côté API), `PATCH /api/users/{uid}/password`.

## Pièges

- Le mot de passe temporaire `"Chai2025"` est en dur dans le code — si on change la politique de mot de passe, chercher cette constante dans `admin-panel.tsx`.
- `getSupervisorIdValue` transforme la valeur spéciale `"na"` du `<Select>` en `null` — ne pas oublier cette conversion si on retouche le formulaire de superviseur.
- Les rôles disponibles sont codés en dur (`const roles = [...]` dans `admin-panel.tsx`) et doivent rester synchronisés avec `EmployeeRole` (`src/types/index.ts`).
