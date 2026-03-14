---
name: xsl-to-sql-detail
description: Inserta contenido XSL (UTF-8) en el campo XSLPLANTILLA del INSERT correspondiente en SCHEMA.TABLE, identificado por TEMPLATEID. Reemplazo directo (overwrite), sin escapes, editando sql/dml/02_SMXCORP_DETALLE_PLANTILLA.sql. Use this skill when the user asks to update an insert detail by TEMPLATEID with a given XSL file path (Excel 2003 SpreadsheetML/XSLT).
compatibility: Requires Python 3.8+ and local filesystem write access; designed for Agent Skills–compliant clients; no network required.
---

# Skill: xsl-to-sql-detail

## Descripción
Inserta el contenido de un archivo XSL (UTF-8) en el campo `XSLPLANTILLA` del INSERT correspondiente en `SCHEMA.TABLE`, identificado por `TEMPLATEID`.

Use when: you need to embed or update the Excel 2003 (SpreadsheetML/XSLT) template for a specific detail identified by `TEMPLATEID` in a Db2 for i SQL insert script, and the user provides `xsl_file_path`.

## Entradas requeridas
- `xsl_file_path` (string): Ruta al archivo `.xsl` a incrustar.
- `coddet` (string): Valor de `TEMPLATEID` para localizar el INSERT objetivo.

## Parámetros fijos
- `insert_file_path`: `sql/dml/02_SMXCORP_DETALLE_PLANTILLA.sql` (por defecto; el flag puede omitirse y se usará esta ruta).
- `overwrite`: true (reemplazo directo, sin comparación).
- `no_escapes`: true (pegar el XSL tal cual, sin escape adicional).

## Comportamiento
- Localiza el INSERT por `coddet` con patrón sobre la línea `VALUES (1,'{coddet}', ...`.
- Reemplaza únicamente el literal del campo `XSLPLANTILLA`.
- Mantiene el formato de 2 líneas (INSERT / VALUES) e indentación existente.
- No altera otros campos, comentarios o el orden de columnas.

## Validaciones y errores
- `coddet` inexistente o múltiples coincidencias → error.
- Archivo XSL no encontrado o no legible en UTF‑8 → error.

## Ejemplo de uso
Entrada:
```
{
  "xsl_file_path": "07_PALLETS_NO_ESCANEADOS/PLANTILLA_EXCEL_2003_PALLET_NO_ESCANEADOS_M.xsl",
  "coddet": "137"
}
```

Salida esperada:
```
{
  "status": "ok",
  "coddet": "137",
  "diagnostics": []
}
```

## Guardrails
- Nunca ejecuta SQL, solo edita el archivo de inserts.
- Escritura por defecto a `sql/dml/02_SMXCORP_DETALLE_PLANTILLA.sql`; puede especificarse otra ruta con `--insert_file_path`.
- Nunca modificar el contenido de los archivos `.xsl` de plantillas Excel; el script solo los lee en UTF-8 y los inserta tal cual.
- Validación de comilla simple: si el XSL contiene `'`, el script falla. Motivo: el literal SQL de `XSLPLANTILLA` está delimitado por `'...'` y no se permiten escapes ni transformaciones del XSL. Si necesitas representar una comilla simple textual en el XML, usa la entidad `&apos;` en el `.xsl` antes de ejecutar el skill.

## Frases de ejemplo (descubrimiento)
- "Actualiza XSLPLANTILLA del detalle 137 con el archivo 07_PALLETS_NO_ESCANEADOS/PLANTILLA_EXCEL_2003_PALLET_NO_ESCANEADOS_M.xsl"
- "Reemplaza el XSL de TEMPLATEID 132 usando 03_INICIO_FIN_TAREAS/DETALLADO/PLANTILLA_EXCEL_2003_INICIO_FIN_TAREAS_DETALLADO.xsl"

## Limitaciones
- Usar rutas estilo Unix (no Windows-style paths).
- No compara contenido previo; siempre overwrite.

## Checklist (previo a ejecutar)
- El nombre del skill (name) coincide con el nombre del directorio (`xsl-to-sql-detail`).
- Cuentas con `xsl_file_path` y `coddet` correctos.
- Existe y es accesible el archivo `sql/dml/02_SMXCORP_DETALLE_PLANTILLA.sql`.
- Hay exactamente un INSERT `VALUES (1,'{coddet}', ...)` para ese `coddet`.
- Opcional: se generará respaldo `.bak` antes de escribir (activado por defecto en `scripts/embed_xsl.py`).

## Pruebas
- Ejecuta el test de ejemplo (no modifica tu SQL real):
```
python3 .windsurf/skills/xsl-to-sql-detail/tests/run_basic.py
```
- Verifica que concluya con `Test passed.` y que el JSON de salida tenga `status: ok`.

## Ejemplo recomendado (con backup)
```
cp sql/dml/02_SMXCORP_DETALLE_PLANTILLA.sql sql/dml/02_SMXCORP_DETALLE_PLANTILLA.sql.bak
python3 .windsurf/skills/xsl-to-sql-detail/scripts/embed_xsl.py --xsl_file_path "<ruta/plantilla>.xsl" --coddet "<TEMPLATEID>"
```

### Ejemplo opcional (especificar otra ruta de inserts)
```
python3 .windsurf/skills/xsl-to-sql-detail/scripts/embed_xsl.py --xsl_file_path "<ruta/plantilla>.xsl" --coddet "<TEMPLATEID>" \
  --insert_file_path "<ruta/alternativa.sql>"
```

## Integración con agentes (genérica)
- Descubrimiento: incluye este SKILL.md en el set de skills del agente (p. ej., en `<available_skills>` generado por `skills-ref to-prompt`).
- Selección por intención: usa términos como “actualiza/reemplaza XSLPLANTILLA”, “CODDETPLAARCIMP”, “XSL”, “Excel 2003/SpreadsheetML”.
