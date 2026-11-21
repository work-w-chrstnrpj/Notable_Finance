# OpenCode Adapters

OpenCode-compatible adapters are generated from canonical files in `.agents/`.

- Agents: `.opencode/agents/*.md`
- Skills: `.opencode/skills/<skill>/SKILL.md`

Edit `.agents/roles/`, `.agents/skills/`, or `.agents/overlays/`, then run `node .ai/cli/bin/cli.mjs sync`.
