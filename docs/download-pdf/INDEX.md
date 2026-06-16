# Download / Printable Form

Page publique générant un formulaire de demande de congé imprimable (mise en page façon document papier CHAI), accessible via un lien direct par `id` de demande — utilisée comme "export PDF" (impression navigateur → enregistrer en PDF).

## Fichiers clés

- `src/app/download/[id]/page.tsx` — route Next.js `/download/{id}`, server component minimal qui délègue tout le rendu à `DownloadPage`.
- `src/components/download-page/DownloadPage.tsx` — charge la demande (`getLeaveRequestById`), l'employé (`getEmployeeById`) et l'historique (`getLeaveRequestHistory`), puis affiche un document statique avec logo, infos employé/contrat, type de congé, dates, et les deux dernières entrées de l'historique utilisées comme "signatures" (superviseur = avant-dernière entrée, directeur pays = dernière entrée).
- `src/components/download-page/PrintFunction.tsx` — simple bouton (icône imprimante) qui appelle `print()` du navigateur.

## Comportement notable

- `getWorkingDays` (`src/lib/leave-history.ts`) est utilisé ici pour afficher le nombre de jours sollicités — **pas** `calculateLeaveDays` (`src/lib/utils.ts`). Les deux fonctions n'excluent pas les mêmes jours fériés (voir [`docs/leave-history/`](../leave-history/INDEX.md)).
- "Nombre de jours restant sur la période du contrat" est calculé avec `calculateLeaveDays(new Date(), employeed.contractEndDate)` (jours ouvrés entre **aujourd'hui** et la fin du contrat actif, hors week-ends et jours fériés de `publicHolidays`). Si le contrat actif n'a pas de date de fin (`contractEndDate === null`, contrat permanent), affiche "Indéterminé" plutôt qu'un nombre. Ce champ affichait auparavant `employeed.availableLeaveDays` (le solde de congé, sans rapport avec la durée du contrat) — ne pas réintroduire cette confusion.
- Les deux dernières entrées d'historique (`history[length-2]` et `history[length-1]`) sont supposées être "Superviseur" puis "Directeur Pays" — cette hypothèse casse si le workflow d'approbation change d'ordre ou de nombre d'étapes (voir [`docs/approvals-workflow/`](../approvals-workflow/INDEX.md)).
- Aucune protection d'accès sur cette route : quiconque connaît l'`id` Firestore peut consulter/imprimer la demande (pas de vérification d'auth dans `DownloadPage`).
- Le lien vers cette page apparaît dans `leave-history.tsx` dès que le statut est `Approved` ou `Pending HR` (icône `FileDownIcon`).

## Pièges

- Si le nombre d'étapes d'approbation change (ex: ajout d'un niveau), revoir la logique "deux dernières entrées = superviseur + directeur" dans `DownloadPage.tsx`.
- Pas de gestion d'état "non trouvé" visible pour l'utilisateur : si `id` est invalide, la page reste simplement vide (le rendu conditionnel attend `employeed != null && leaveRequest != null`).
