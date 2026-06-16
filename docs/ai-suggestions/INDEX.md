# AI Suggestions (Genkit) — non implémenté

Module prévu pour suggérer des approbateurs via IA (cf. `docs/blueprint.md`, idée d'origine : si un rôle d'approbateur est saisi de façon vague, l'IA propose des employés correspondants). **Aucune logique réelle n'existe aujourd'hui.**

## Fichiers clés

- `src/ai/genkit.ts` — instancie Genkit avec le plugin `googleAI()`, modèle `googleai/gemini-2.0-flash`. Nécessite une clé API Google AI configurée en variable d'environnement (convention Genkit standard) pour fonctionner.
- `src/ai/flows/suggest-approvers.ts` — `suggestApprovers()` est un **stub qui lève systématiquement une erreur** (`throw new Error('Not implemented')`), avec des schémas zod d'entrée/sortie vides (`z.object({})`).
- `src/ai/dev.ts` — point d'entrée pour `yarn genkit:dev` / `genkit:watch` (CLI Genkit en local), importe juste le flow ci-dessus.

## État actuel

- Ce module n'est appelé par **aucun** composant de l'app (`suggestApprovers` n'a aucun import ailleurs dans `src/`).
- Le choix du superviseur/manager se fait aujourd'hui manuellement via le panneau admin (voir [`docs/employee-admin/`](../employee-admin/INDEX.md)), sans assistance IA.

## Si on implémente ce module

- Définir de vrais schémas d'entrée (ex: titre de poste vague saisi par l'admin, liste des employés/rôles disponibles) et de sortie (liste de suggestions classées) dans `suggest-approvers.ts`.
- Brancher le flow dans `admin-panel.tsx` (champ superviseur) une fois fonctionnel.
- Mettre à jour cette page une fois que le module est branché à une UI réelle, et déplacer la mention "non implémenté" du `AGENT.md` racine.
