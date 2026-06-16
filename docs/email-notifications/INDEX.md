# Email Notifications

Envoi d'emails HTML à chaque étape du workflow de congé (soumission, transition de statut, approbation finale, rejet).

## Fichiers clés

- `src/lib/email.ts` — construit le contenu HTML et décide qui notifier :
  - `sendLeaveRequestSubmittedEmail` : notifie le superviseur (ou tous les employés `HR` si la demande part directement en `Pending HR`, cas Circonstance).
  - `sendLeaveRequestUpdatedEmail` : selon le nouveau `status` de la demande, notifie l'étape suivante (`Pending Manager` → manager, `Pending HR` → tous les RH... selon les branches de la fonction) ainsi que l'employé, ou notifie l'employé seul en cas d'`Approved`/`Rejected`.
- `src/app/api/send-email/route.ts` — route API `POST` qui envoie réellement l'email via `nodemailer` (SMTP configuré par variables d'environnement `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`).
- Appelé depuis `src/app/page.tsx` (`addLeaveRequest`, `updateRequestStatus`).

## Comportement notable

- `sendEmail` (dans `lib/email.ts`) appelle `fetch("/api/send-email", ...)` **sans `await`** ni vérification de la réponse — l'envoi est best-effort, une erreur SMTP ne fait pas échouer la mise à jour Firestore.
- Les liens dans les emails pointent vers `https://chai-request.com/` codé en dur (pas une variable d'env) — à changer manuellement si le domaine change.
- Le commentaire en tête de `lib/email.ts` ("mock email service... log to console") est obsolète : l'envoi est réel via `/api/send-email` + nodemailer, pas un mock.

## Pièges

- Les identifiants SMTP (`EMAIL_USER`/`EMAIL_PASS`) sont des secrets — vérifier qu'ils sont bien dans `.env` / la config de déploiement (Jenkins/Azure/Firebase App Hosting) et jamais commités en clair.
- Si on ajoute une nouvelle transition de statut, il faut ajouter la branche correspondante dans `sendLeaveRequestUpdatedEmail`, sinon aucune notification ne part pour ce cas.
