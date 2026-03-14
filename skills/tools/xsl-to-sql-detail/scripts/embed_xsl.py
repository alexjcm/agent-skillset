#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
import tempfile


def main():
    parser = argparse.ArgumentParser(
        description="Embed XSL content into XSLPLANTILLA for a given TEMPLATEID."
    )
    parser.add_argument("--xsl_file_path", required=True, help="Path to the .xsl file (UTF-8)")
    parser.add_argument("--coddet", required=True, help="TEMPLATEID value (e.g., '137')")
    parser.add_argument("--insert_file_path", default="sql/dml/02_SMXCORP_DETALLE_PLANTILLA.sql", help="Path to the SQL inserts file (default: sql/dml/02_SMXCORP_DETALLE_PLANTILLA.sql)")

    # Backup control
    parser.add_argument("--backup", dest="backup", action="store_true", help="Create a .bak backup before writing (default)")
    parser.add_argument("--no-backup", dest="backup", action="store_false", help="Do not create a backup before writing")
    parser.set_defaults(backup=True)

    args = parser.parse_args()

    # ------------------------------------------------------------------
    # Validate and read XSL
    # ------------------------------------------------------------------
    if not os.path.isfile(args.xsl_file_path):
        fail(f"XSL file not found: {args.xsl_file_path}")

    try:
        with open(args.xsl_file_path, "r", encoding="utf-8") as xf:
            xsl_content = xf.read()
    except Exception as e:
        fail(f"Unable to read XSL as UTF-8: {e}")


    # Guardrail 1: forbid single quotes in XSL (SQL safety)
    # Context: The SQL literal for XSLPLANTILLA is delimited by single quotes ('...').
    # Because this skill must not modify/escape the XSL content, any single quote present
    # in the XSL would break the SQL string literal. To prevent generating invalid SQL,
    # we fail fast if a single quote is detected. If needed, update the source XSL to
    # replace textual single quotes with the XML entity &apos; prior to running this tool.
    if "'" in xsl_content:
        fail(
            "XSL content contains single quotes ('). "
            "This would break the SQL string literal. "
            "Please replace them or use XML entities (&apos;)."
        )

    # ------------------------------------------------------------------
    # Validate and read SQL file
    # ------------------------------------------------------------------
    if not os.path.isfile(args.insert_file_path):
        fail(f"Inserts file not found: {args.insert_file_path}")

    try:
        with open(args.insert_file_path, "r", encoding="utf-8") as sf:
            sql_text = sf.read()
    except Exception as e:
        fail(f"Unable to read inserts SQL as UTF-8: {e}")

    # Guardrail 2: ensure target column exists
    if "XSLPLANTILLA" not in sql_text.upper():
        fail(
            "Target SQL file does not contain column XSLPLANTILLA. "
            "Refusing to modify file."
        )

    # ------------------------------------------------------------------
    # Locate INSERT by TEMPLATEID
    # ------------------------------------------------------------------
    coddet_escaped = re.escape(args.coddet)

    pattern = re.compile(
        r"(VALUES\s*\(\s*1\s*,\s*'"
        + coddet_escaped
        + r"'\s*,\s*\d+\s*,\s*')"   # group 1: prefix up to XSL opening quote
        r"([\s\S]*?)"              # group 2: existing XSL
        r"('\s*,)",                # group 3: closing quote + comma
        re.IGNORECASE | re.DOTALL,
    )

    matches = list(pattern.finditer(sql_text))
    if len(matches) == 0:
        fail(
            f"No INSERT found for TEMPLATEID '{args.coddet}'. "
            f"Expected pattern: VALUES (1,'{args.coddet}',<number>,'<XSL>',...)"
        )
    if len(matches) > 1:
        fail(
            f"Multiple INSERT statements found for TEMPLATEID '{args.coddet}'"
        )

    def replacer(match: re.Match) -> str:
        prefix = match.group(1)
        suffix = match.group(3)
        return prefix + xsl_content + suffix

    new_sql = pattern.sub(replacer, sql_text, count=1)

    # ------------------------------------------------------------------
    # Backup
    # ------------------------------------------------------------------
    if args.backup:
        bak_path = args.insert_file_path + ".bak"
        try:
            with open(bak_path, "w", encoding="utf-8") as sf_bak:
                sf_bak.write(sql_text)
        except Exception as e:
            fail(f"Unable to create backup file: {e}")

    # ------------------------------------------------------------------
    # Atomic write
    # ------------------------------------------------------------------
    try:
        target_dir = os.path.dirname(args.insert_file_path) or "."
        with tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            delete=False,
            dir=target_dir,
        ) as tmp:
            tmp.write(new_sql)
            tmp_path = tmp.name

        os.replace(tmp_path, args.insert_file_path)
    except Exception as e:
        fail(f"Unable to write updated SQL file atomically: {e}")

    ok(
        {
            "status": "ok",
            "coddet": args.coddet,
            "insert_file_path": args.insert_file_path,
            "backup": args.backup,
        }
    )


def ok(payload: dict):
    print(json.dumps(payload, ensure_ascii=False))
    sys.exit(0)


def fail(message: str):
    print(json.dumps({"status": "error", "message": message}, ensure_ascii=False))
    sys.exit(1)


if __name__ == "__main__":
    main()
