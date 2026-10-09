<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Regla de Proyecto: Realizar Commit y Push a GitHub tras Cada Cambio

- **Obligatorio:** Cada vez que el asistente realice y finalice un cambio, ajuste, corrección o nueva funcionalidad solicitada por el usuario, DEBE realizar automáticamente el commit y el push a GitHub (`git add .`, `git commit -m "..."`, y `git push origin main`).
- **Propósito:** El usuario debe poder visualizar y auditar inmediatamente cada cambio realizado directamente en la web de GitHub sin demoras.
- **Mensajes de Commit:** Los mensajes deben ser claros, descriptivos y profesionales (ej: `feat: ...`, `fix: ...`).
