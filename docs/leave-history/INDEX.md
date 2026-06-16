# Leave History & Dashboard

Affichage de l'historique des demandes (tableaux + détail des étapes) et tableau de bord statistique.

## Fichiers clés

- `src/components/leave-history.tsx` — composant principal des tableaux de demandes (voir aussi [`docs/approvals-workflow/`](../approvals-workflow/INDEX.md), il porte aussi les actions d'approbation).
- `src/components/leave-request-history-dialog.tsx` (`LeaveRequestHistoryDialog`) — modale listant chronologiquement les entrées de `leave-history.ts` (`getLeaveRequestHistory`) pour une demande : action, acteur, statut, commentaire/raison.
- `src/components/leave-request-delete-dialog.tsx` (`LeaveRequestDeleteDialog`) — modale de confirmation, appelle `deleteLeaveRequest` (`src/lib/requests.ts`). Visible seulement pour Admin/HR (bouton dans `leave-history.tsx`).
- `src/lib/leave-history.ts` — accès Firestore à la sous-collection `leave-requests/{id}/history` (`addLeaveRequestHistoryEntry`, `getLeaveRequestHistory`), plus deux utilitaires : `getLeaveTypeName` et `getWorkingDays` (calcul de jours ouvrés indépendant de `calculateLeaveDays`, utilisé par la page de téléchargement PDF).
- `src/components/dashboard.tsx` (`Dashboard`) — statistiques agrégées (total, approuvées/rejetées/en attente par étape, jours consommés/planifiés, taux d'approbation, demandes "urgentes" en attente >3 jours). Filtre les données par équipe si l'utilisateur est Supervisor/Manager ; HR/Admin voient tout.

## Code mort à connaître (ne pas réutiliser, ne pas dupliquer davantage)

Le dossier `src/components/LeaveHistory/` (notez la casse, différent de `leave-history.tsx`) contient des helpers en grande partie **dupliqués et non utilisés** :

- `src/components/LeaveHistory/index.tsx` — exporte `getLeaveTypeIcon`, `getLeaveTypeName`, `badge()`, `StatusBadge`. Seul `getLeaveTypeName` est réellement importé (par `leave-history.tsx`) ; `StatusBadge` et `badge()` ne sont importés nulle part et `badge()` référence même une variable `status` non définie dans son scope (code cassé si jamais appelé).
- `src/components/LeaveHistory/PersonalLeaveHistory.tsx` — composant non importé nulle part.

Si vous touchez à la logique des badges de statut ou des libellés de type de congé, la version qui compte est celle inline dans `leave-history.tsx` (`getStatusBadge`) — pas celle de ce dossier.

## Pièges

- Deux implémentations de "jours ouvrés" coexistent : `calculateLeaveDays` (`src/lib/utils.ts`, exclut week-ends + jours fériés codés en dur 2026) utilisée pour les quotas/déductions, et `getWorkingDays` (`src/lib/leave-history.ts`, exclut juste les week-ends, listes de jours fériés vides) utilisée uniquement pour l'affichage du PDF téléchargeable. Elles peuvent donner des résultats différents — ne pas supposer qu'elles sont interchangeables.
- `Dashboard` ne lit pas l'historique (`leave-history.ts`), seulement la liste `leaveRequests` passée en props depuis `src/app/page.tsx`.
