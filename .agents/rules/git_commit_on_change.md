---
trigger: always_on
description: Regla para realizar commit en Git automáticamente tras cada cambio finalizado
---

# Regla Obligatoria: Commit en Git en Cada Cambio

1. **Ejecución de Commit:** Cada vez que se complete un cambio, ajuste o nueva funcionalidad solicitada por el usuario, el asistente DEBE ejecutar un commit en Git (`git add .` y `git commit -m "..."`).
2. **Visibilidad del Usuario:** Esta regla existe para que el usuario pueda visualizar de inmediato todos los cambios en el control de versiones y no se pierda nada.
3. **Mensajes Descriptivos:** Redactar mensajes de commit claros, ordenados y descriptivos explicando qué se implementó o corrigió.
