# Tests: xsl-to-sql-detail

Este directorio contiene pruebas básicas para el script `scripts/embed_xsl.py`.

## Escenarios
- Caso feliz: reemplazo de `XSLPLANTILLA` para un `TEMPLATEID` existente en un SQL de ejemplo.
- `coddet` inexistente: el script debe devolver error.

## Cómo ejecutar (ejemplo)
Ejecuta el test básico:
```
python3 .windsurf/skills/xsl-to-sql-detail/tests/run_basic.py
```

Nota: Los tests usan archivos de fixture y una copia temporal del SQL; no modifican tus scripts reales.
