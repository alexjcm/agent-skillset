#!/usr/bin/env python3
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
FIXTURES = Path(__file__).resolve().parent / "fixtures"


def run():
    sample_sql = FIXTURES / "sample.sql"
    sample_xsl = FIXTURES / "sample.xsl"
    work_sql = FIXTURES / "_work.sql"

    try:
        # ------------------------------------------------------------------
        # Prepare working copy
        # ------------------------------------------------------------------
        shutil.copyfile(sample_sql, work_sql)

        cmd = [
            sys.executable,
            str(SCRIPTS / "embed_xsl.py"),
            "--xsl_file_path",
            str(sample_xsl),
            "--coddet",
            "137",
            "--insert_file_path",
            str(work_sql),
        ]

        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False,
        )

        if proc.returncode != 0:
            print("Command:", " ".join(cmd))
            print("STDOUT:\n", proc.stdout)
            print("STDERR:\n", proc.stderr)
            sys.exit(1)

        # ------------------------------------------------------------------
        # Validate JSON output
        # ------------------------------------------------------------------
        try:
            result = json.loads(proc.stdout)
        except json.JSONDecodeError:
            print("Invalid JSON output:", proc.stdout)
            sys.exit(1)

        assert result["status"] == "ok"
        assert result["coddet"] == "137"

        # ------------------------------------------------------------------
        # Validate SQL content (substring checks + exact byte match of XSL)
        # ------------------------------------------------------------------
        new_sql = work_sql.read_text(encoding="utf-8")

        assert "old-xsl-content" not in new_sql, "Old XSL content still present"
        # Updated expectation to match new sample.xsl content
        assert "Worksheet ss:Name=\"Reporte Test\"" in new_sql, "New XSL content not found"
        assert "VALUES (1,'137'," in new_sql, "Target INSERT missing or corrupted"

        # Exact byte-for-byte check of inserted XSL literal vs fixture
        import re
        pattern = re.compile(r"VALUES\s*\(\s*1\s*,\s*'137'\s*,\s*\d+\s*,\s*'([\s\S]*?)'\s*,", re.IGNORECASE)
        m = pattern.search(new_sql)
        assert m, "Could not extract XSL literal from SQL"
        embedded_xsl = m.group(1)
        xsl_text = sample_xsl.read_text(encoding="utf-8")
        assert embedded_xsl == xsl_text, "Embedded XSL differs from fixture (not inserted as-is)"

        print("Test passed.")

    finally:
        # ------------------------------------------------------------------
        # Cleanup
        # ------------------------------------------------------------------
        # Keep _work.sql for inspection after the test
        bak = FIXTURES / "_work.sql.bak"
        if bak.exists():
            bak.unlink()


if __name__ == "__main__":
    run()
