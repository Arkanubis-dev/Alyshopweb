---
trigger: always_on
description: Regla para realizar commit en Git automáticamente tras cada cambio finalizado
---

# Regla Obligatoria: Commit y Push a GitHub en Cada Cambio

1. **Ejecución de Commit y Push:** Cada vez que se complete un cambio, ajuste o nueva funcionalidad solicitada por el usuario, el asistente DEBE ejecutar automáticamente el commit y el push a GitHub (`git add .`, `git commit -m "..."`, y `git push origin main`).
2. **Visibilidad del Usuario:** Esta regla existe para que el usuario pueda visualizar de inmediato todos los cambios reflejados en el repositorio de GitHub y en su historial.
3. **Mensajes Descriptivos:** Redactar mensajes de commit claros, ordenados y descriptivos explicando qué se implementó o corrigió.
