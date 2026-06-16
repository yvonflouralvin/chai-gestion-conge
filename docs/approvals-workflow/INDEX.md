# Approvals Workflow

Workflow d'approbation à plusieurs niveaux pour une `LeaveRequest`, piloté par le champ `status` (`LeaveRequestStatus` dans `src/types/index.ts`).

## Fichiers clés

- `src/components/leave-history.tsx` — composant central : tableau des demandes filtré selon la vue (`personal` / `approvals` / `all`), boutons Approve/Reject, dialog d'approbation (permet de corriger les dates avant validation), dialog de rejet (raison obligatoire).
- `src/app/page.tsx` (`updateRequestStatus`) — applique la transition de statut, déduit le solde de congé si nécessaire, journalise l'historique, renvoie un email.
- `src/lib/leave-history.ts` (`addLeaveRequestHistoryEntry`, `getLeaveRequestHistory`) — sous-collection Firestore `leave-requests/{id}/history`.

## Machine à états (`status`)

```
Pending Supervisor  --(Supervisor approuve)-->  Pending Manager
Pending Manager     --(Manager approuve)-->     Pending HR
Pending HR          --(HR approuve)-->          Approved
Pending HR          (cas congé "Circonstance", id 4 : démarre directement ici)

N'importe quel "Pending *" --(rejet)--> Rejected
```

La transition est calculée dans `leave-history.tsx` (`_nextStatus`) : elle regarde le rôle de l'utilisateur courant ET le statut actuel de la demande, donc un utilisateur avec plusieurs rôles (ex: Supervisor + Manager) ne peut faire avancer la demande que si son rôle correspond à l'étape attendue par le statut courant.

## Qui voit quoi (`view` dans `LeaveHistory`)

- **`personal`** : les propres demandes de l'utilisateur courant, pas d'actions d'approbation.
- **`approvals`** : agrège les demandes à traiter par l'utilisateur selon ses rôles — équipe supervisée (Supervisor), `Pending Manager` (Manager), `Pending HR` (HR). Les filtres de statut sont affichés.
- **`all`** : toutes les demandes de l'entreprise, lecture seule (pas d'actions, utilisé par Admin/HR dans l'onglet "Leave Requests").

Voir `src/app/page.tsx` (`renderTabs`) pour savoir quels onglets/vues sont affichés selon le rôle (Admin, Supervisor, HR, Manager, Employee).

## Effets de bord à l'approbation finale

- Si `status` devient `Approved` **et** `leaveTypeId === 1` (Annuel) : déduction du solde `availableLeaveDays` de l'employé via une `runTransaction` Firestore (`src/app/page.tsx`). Les autres types de congé (Sick, Paternity, Maternity, Circonstance) ne déduisent rien automatiquement — le quota Paternité/Maternité est juste vérifié côté formulaire à la soumission (voir [`docs/leave-requests/`](../leave-requests/INDEX.md)).
- Au rejet, la raison est stockée dans `supervisorReason` ou `managerReason` selon l'étape où le rejet a eu lieu (pas de `hrReason` dédié — un rejet HR utilise aussi un des deux champs existants).
- Chaque changement de statut écrit une entrée dans l'historique (`addLeaveRequestHistoryEntry`) et déclenche un email (voir [`docs/email-notifications/`](../email-notifications/INDEX.md)).
- Après approbation/rejet, `fetchAllData()` est rappelé pour rafraîchir les soldes affichés.

## Pièges

- Dans `leave-history.tsx` (`getStatusBadge`), le statut `Pending HR` est affiché avec le même badge vert "Approved" que `Approved` (et propose déjà le lien de téléchargement PDF) — c'est volontaire pour le cas circonstance/HR mais peut surprendre si on l'oublie en modifiant l'affichage des statuts.
- La comparaison `request.status as LeaveRequestStatus) in ["Rejected", "Approved"]` dans le bouton "Reject" est un bug JS connu (`in` sur un tableau teste les index, pas les valeurs) — la désactivation du bouton ne fonctionne donc pas vraiment. Ne pas copier ce pattern ailleurs ; utiliser `.includes(...)`.
- Le code attend `selectedRequest.startDate !== approvalStartDate` pour détecter un changement de date — comparaison d'objets `Date` par référence, donc quasiment toujours vraie après un changement via le date picker (génère du bruit dans `audit.changes` mais n'a pas d'impact fonctionnel grave).
