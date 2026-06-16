# AGENT_GIT.md

Règles git à suivre pour toute modification sur ce dépôt.

## Branches

- **`claude`** : branche de référence, toujours à jour. C'est la base de départ pour toute nouvelle modification, et la cible des PR une fois le travail terminé.
- **`build`** et **`dev`** : branches gérées séparément (déploiement / intégration), ne pas y travailler directement, ne pas les cibler avec une PR sauf demande explicite.

## Convention de nommage des branches de travail

Avant de commencer **toute** modification, créer une branche de travail à partir de `claude` :

```
claude-<type>/<nom-de-la-modif>
```

- `type` ∈ `feature`, `fix`, `bug`, `chore`, `refactor`, `docs` (choisir le plus proche de la nature du changement)
- `nom-de-la-modif` : court, en kebab-case, descriptif (ex: `reset-password-admin`, `calcul-jours-feries`)

Exemples : `claude-feature/dashboard-stats`, `claude-fix/calcul-jours-negatifs`, `claude-docs/agent-md`.

## Workflow standard

1. Se mettre à jour : `git checkout claude && git pull`
2. Créer la branche de travail : `git checkout -b claude-<type>/<nom-de-la-modif>`
3. Faire la modification.
4. Tester / vérifier que l'app compile sans problème avant de proposer de pousser :
   - `npm run typecheck` (ou `yarn typecheck`)
   - `npm run build` (ou `yarn build`)
   - `npm run lint` si pertinent
   - Test manuel du parcours concerné si c'est une feature UI (voir skill `/run` ou `/verify`)
5. Une fois la modif testée et terminée, et seulement à ce moment : pousser la branche et créer une PR ciblant `claude`.
6. Ne jamais committer directement sur `claude`, `build` ou `dev`.

## Avant de pousser / créer une PR

- Toujours demander confirmation à l'utilisateur avant `git push` et avant `gh pr create` (actions visibles/partagées — voir règles générales de l'agent).
- Ne pousser que si les vérifications de l'étape 4 sont passées.
- Mettre à jour la documentation (`docs/<module>/INDEX.md`, voir [AGENT.md](AGENT.md)) si la modification le justifie, **avant** d'ouvrir la PR.

## Commits

- Messages clairs, à l'impératif, décrivant le "quoi" (le style historique du repo mélange français/anglais, ex: `Fixer probleme double auth`, `Adding reset user password for Admin`) — rester cohérent avec ce style.
- Plusieurs changements distincts dans un même commit : les lister séparés par ` - `.
- Ne jamais utiliser `--no-verify`, `--amend` sur un commit déjà poussé, ou des opérations destructives (`reset --hard`, `push --force`) sans demande explicite de l'utilisateur.
