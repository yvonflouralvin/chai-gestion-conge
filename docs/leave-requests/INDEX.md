# Leave Requests (soumission de demande)

Formulaire permettant à un employé de soumettre une nouvelle demande de congé. C'est l'étape qui crée le document Firestore `leave-requests/{id}` consommé ensuite par le workflow d'approbation ([`docs/approvals-workflow/`](../approvals-workflow/INDEX.md)).

## Fichiers clés

- `src/components/leave-request-form.tsx` — le formulaire (react-hook-form + zod). Calcule en direct le nombre de jours demandés et le solde disponible selon le type de congé sélectionné.
- `src/lib/data.ts` — `leaveTypes`: liste statique des types de congé (id, nom, icône, sous-types). C'est la **seule source de vérité** pour les types — pas de collection Firestore dédiée.
- `src/lib/utils.ts` — `calculateLeaveDays(start, end)`: nombre de jours ouvrés (hors week-end et jours fériés `publicHolidays`, codés en dur pour 2026).
- `src/app/page.tsx` (`addLeaveRequest`) — écrit le document dans Firestore, log l'historique (`addLeaveRequestHistoryEntry`) et envoie l'email de notification (`sendLeaveRequestSubmittedEmail`).

## Types de congé (`leaveTypes`, `src/lib/data.ts`)

| id | nom | particularité |
|----|-----|---------------|
| 1 | Annuel | déduit `currentUser.availableLeaveDays` à l'approbation finale |
| 2 | Sick | pas de quota géré dans le code actuel |
| 3 | Paternity | quota fixe de 30 jours/an, calculé côté client à partir des requêtes déjà approuvées |
| 5 | Maternity | quota fixe de 90 jours/an, idem ; un document justificatif est attendu (`documentUrl`) mais l'upload n'est **pas implémenté** (TODO explicite dans le formulaire) |
| 4 | Circonstance | a des `subTypes` (`Deuil`, `Mariage`, `Déménagement`) ; route directement vers `Pending HR` au lieu de `Pending Supervisor` |

## Comportement notable

- Les dépassements de solde (annuel/paternité/maternité) déclenchent un `toast` d'avertissement mais **ne bloquent pas la soumission** (le `return` est commenté dans le code — comportement voulu actuellement, pas un bug).
- `status` initial : `"Pending HR"` si `leaveTypeId === 4` (Circonstance), sinon `"Pending Supervisor"`.
- `supervisorId` est figé sur l'employé au moment de la création (copié depuis `currentUser.supervisorId`).

## Pièges

- Si on ajoute un nouveau type de congé dans `leaveTypes`, il faut aussi : vérifier la logique de quota dans `leave-request-form.tsx`, et la logique de déduction de solde dans `src/app/page.tsx` (`updateRequestStatus`, actuellement codée uniquement pour `leaveTypeId === 1`).
- L'upload de document (congé maternité) n'est pas branché — ne pas supposer que `documentUrl` est rempli.
