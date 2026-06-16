# Auth

Authentification email/mot de passe via Firebase Auth, avec le profil métier de l'utilisateur stocké en parallèle dans Firestore (collection `users`).

## Fichiers clés

- `src/lib/firebase.ts` — initialisation de l'app Firebase client (config en dur dans le code, projet `leaveease-5o9gj`).
- `src/lib/firebase-admin.ts` — SDK Firebase Admin côté serveur (utilisé par les API routes), credential via `process.env.FIREBASE_SERVICE_ACCOUNT_KEY`.
- `src/context/auth-context.tsx` — **source de vérité**. `AuthProvider` écoute `onAuthStateChanged`, charge le document Firestore `users/{uid}` correspondant, le transforme via `processEmployee` (`src/lib/utils.ts`) et expose `useAuth() -> { currentUser, loading }`. `currentUser` est de type `EmployeeWithCurrentContract | null`.
- `src/components/auth-context.tsx` — **fichier mort, ne pas utiliser**. Copie quasi identique de celui ci-dessus, plus ancienne/buggée (deux providers montés = double écoute auth, cause du bug "double auth" déjà corrigé). N'est importé par aucun fichier. À supprimer si l'occasion se présente ; en attendant, toujours importer `useAuth`/`AuthProvider` depuis `@/context/auth-context`.
- `src/app/layout.tsx` — monte `AuthProvider` une seule fois autour de toute l'app.
- `src/app/auth/signin/page.tsx` — page de connexion (`signInWithEmailAndPassword`), redirige vers `/` après connexion.
- `src/components/user-nav.tsx` — menu utilisateur (avatar, nom, email, déconnexion via `signOut`).
- `src/app/page.tsx` — redirige vers `/auth/signin` si pas de `currentUser` une fois `authLoading` terminé.

## Comportement notable

- Si le compte existe dans Firebase Auth mais pas dans Firestore (`users/{uid}`), `currentUser` reste `null` → l'utilisateur est traité comme déconnecté et renvoyé vers signin.
- Pas d'inscription libre dans l'UI : les comptes sont créés par un Admin depuis le panneau employés (voir [`docs/employee-admin/`](../employee-admin/INDEX.md)), avec un mot de passe temporaire puis un email Firebase de réinitialisation.
- Aucune notion de "refresh token" custom ni de session côté serveur : tout repose sur le SDK client Firebase Auth.

## Pièges

- Ne jamais réintroduire un second `AuthProvider` monté en parallèle (cause racine du bug "double auth").
- `role` est toujours un tableau (`EmployeeRole[]`) même si Firestore stocke parfois une chaîne simple — `processEmployee` normalise ça.
