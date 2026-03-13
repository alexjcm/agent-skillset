---
name: safe-bash-scripting
description: Provides standards, rules, and best practices for creating portable, safe, and maintainable Bash scripts compatible with Bash 3.2 on Linux and macOS development environments. Use when asked to write, update, validate, fix or optimize bash scripts for local development automation, file operations, build/deploy scripts, or any bash scripting task requiring professional standards and portability.
---

# Bash Script Standards

This skill ensures that all Bash scripts are written according to professional standards and are compatible with Bash 3.2 (default on macOS) and modern Linux environments. It focuses on portability, maintainability, safety, readability, and simplicity for local development automation.

## Core Standards

### Shebang and Shell Options

Always start scripts with:

```bash
#!/usr/bin/env bash
set -euo pipefail
```

**Compatibility Note:** All scripts must work with Bash 3.2.

### Golden Example

This pattern represents the minimum viable standard for all scripts:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Constants
readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

log_info() { echo "[INFO] $1"; }

cleanup() {
  log_info "Cleaning up..."
  # removal logic here
}
trap cleanup EXIT

main() {
  log_info "Starting process..."
  # Your logic here
}
main "$@"
```

### Negative Constraints (WHAT NOT TO DO)

To ensure compatibility with macOS (Bash 3.2) and prevent common errors:

1.  **NO `function` keyword**: Use `my_func() { ... }`, not `function my_func { ... }`.
2.  **NO Associative Arrays**: Do not use `declare -A` (requires Bash 4.0+).
3.  **NO `source`**: Use `.` (dot) instead of `source` for POSIX compliance.
4.  **NO `==` in `[ ]`**: Use `=` for string comparison in `[ ]`, or use `[[ ... ]]`.
5.  **NO backticks**: Use `$(cmd)`, not `` `cmd` ``.
6.  **NO unquoted variables**: Always quote variables `"${var}"` to prevent globbing/splitting.


## Naming Conventions

- **Constants**: `readonly MAX_RETRIES=3` (Uppercase, readonly)
- **Variables**: `local artifact_path="..."` (Lowercase, snake_case, scoped)
- **Files**: `deploy_artifact.sh` (Lowercase, snake_case, `.sh` extension)
- **Functions**: `validate_input()` (Lowercase, snake_case, no `function` keyword)


## Error Handling

**Core Principle:** Fail fast and loudly.
- Use `set -euo pipefail` (See Core Standards).
- Validate all inputs.
- Use `trap cleanup EXIT` for resource management.

> [!IMPORTANT]
> For detailed error handling patterns, exit codes, and traps, essentially consult:
> **[references/error_handling.md](references/error_handling.md)**

## Best Practices Reference

For comprehensive best practices and industry standards, see:

- **[references/best_practices.md](references/best_practices.md)** - Complete guide covering:
  - Shell options deep dive
  - Script structure patterns
  - Defensive programming
  - Portability guidelines
  - Code style standards
  - Function design
  - Variable scoping
  - Quoting rules
  - Testing
  - Performance optimization
  - Security considerations
  - Documentation standards
  - Industry standards (Google Shell Style Guide, ShellCheck)

## Common Patterns Reference

For reusable code patterns, see:

- **[references/common_patterns.md](references/common_patterns.md)** - Patterns for:
  - Argument parsing
  - Path validation
  - File operations
  - Directory traversal

## Error Handling Reference

For advanced error handling techniques, see:

- **[references/error_handling.md](references/error_handling.md)** - Deep dive into:
  - [`set` options (`-e`, `-u`, `-o pipefail`)](references/error_handling.md#set-options-deep-dive)
  - [Exit code conventions](references/error_handling.md#exit-code-conventions)
  - [Function return values](references/error_handling.md#function-return-values)
  - [Cleanup with trap](references/error_handling.md#cleanup-with-trap)
  - [Validation patterns](references/error_handling.md#validation-patterns)

## Build & Deployment Workflows

For generic build and deployment patterns, refer to your project's specific tooling documentation or create a dedicated reference file aligned with these standards.

## Example Scripts

See working examples in the `scripts/` directory:

- **[scripts/example_file_copy.sh](scripts/example_file_copy.sh)** - Safe file copy with validation

## Templates

Use templates as starting points for new scripts:

- **[assets/template_simple.sh](assets/template_simple.sh)** - For simple scripts (10-50 lines)
  - Basic structure
  - Minimal logging
  - 1-2 main functions

- **[assets/template_medium.sh](assets/template_medium.sh)** - For medium scripts (50-200 lines)
  - Full structure with sections
  - Argument parsing
  - Multiple functions
  - Structured logging


## Safe Deletion (rm)

Use this pattern whenever a Bash script will delete directories or files using `rm`.

Reference implementation and full guidance are documented in: references/common_patterns.md#safe-deletion-rm

Note: To avoid drift, prefer a single source of truth for safe prefixes. Derive the whitelist from central variables (e.g., `IDE_SKILL_PATHS`) instead of duplicating values across scripts.

## Quick Reference

### Common Checks

```bash
# Check if command exists
if command -v git &> /dev/null; then
  log_info "git found"
fi

# Check if script is run as root
if [[ ${EUID} -eq 0 ]]; then
  log_error "Do not run as root"
  exit 1
fi
```

### Safe File Operations

```bash
# Always quote variables
cp "${source}" "${destination}"

# Check before overwrite
if [[ -f "${destination}" ]]; then
  read -p "File exists. Overwrite? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
  fi
fi

# Use temporary files safely
temp_file="$(mktemp)"
trap 'rm -f "${temp_file}"' EXIT
```

## Workflows

### Create
1. Define objective, inputs/outputs, environment (TTY/CI), and ensure Bash 3.2 compatibility.
2. Choose a template: `assets/template_simple.sh` or `assets/template_medium.sh`.
3. Implement following standards in this skill and `references/best_practices.md`.
4. Update `usage` to reflect actual arguments, options, and include 1–2 valid examples.
5. Validate with the Adherence Checklist (see below).
6. Run ShellCheck and fix findings of medium/high severity.
7. Perform quick manual tests for happy path and common errors.
8. Run repository validator: `scripts/validate_bash.sh [paths]` (prefer using this wrapper)

#### Definition of Done (Create)
- Shebang + `set -euo pipefail` present.
- No `function`, no backticks, no `source`, no associative arrays.
- Variables quoted; tests use `[[ ... ]]`.
- `usage` is updated to reflect real args/flags and includes 1–2 valid examples; returns `exit 2` on invalid args.
- CI/non-interactive behavior has no prompts; requires explicit flags for destructive actions (for example, `--force`).
- ShellCheck executed with no medium/high findings, or with a documented justification.
- Minimum manual tests passed (success and error paths).

### Update/Adjust
1. Review current script interface (args/flags), behavior, and compatibility impact.
2. Apply changes adhering to standards and quoting rules.
3. Update `usage` and examples if the interface changes; return `exit 2` on invalid args.
4. Re-run the Adherence Checklist.
5. Run ShellCheck and address findings; run quick regression checks.
6. Run repository validator: `scripts/validate_bash.sh [paths]`

#### Definition of Done (Update/Adjust)
- Interface reviewed and documented: any change in args/flags is reflected in `usage` and examples.
- Backward compatibility evaluated; if there are breaking changes, they are clearly documented.
- Shebang + `set -euo pipefail`; no `function`/backticks/`source`/associative arrays.
- Strict quoting and tests with `[[ ... ]]`; `exit 2` on argument validation failures.
- CI/non-interactive behavior has no prompts; explicit flags (`--force`) for destructive actions.
- ShellCheck has no medium/high findings (or they are justified); fixes applied where appropriate.
- Minimum regression tests executed for main and error paths.

### Validate (no code changes)
> Important: In this workflow the AI agent MUST NOT modify any files; its responsibility is only to validate and report findings.
1. Apply the Adherence Checklist to the script.
2. Run ShellCheck and collect findings.
3. Produce a concise report with recommendations; do not modify files in this workflow.
4. Run repository validator (optional): `scripts/validate_bash.sh [paths]`

#### Definition of Done (Validate)
- Checklist applied and findings documented.
- ShellCheck executed; results classified as blocking (must fix) and recommended (improvements).
- Clear report including:
  - Status summary (approved/observations/changes required)
  - List of issues and actionable suggestions
  - Notes on `usage` if it does not reflect the real interface
- No files were modified as part of this workflow. The AI agent made no code changes.

## Usage rules

- Must accurately document required/optional positional arguments and flags actually supported by the script.
- Include 1–2 valid examples that use `SCRIPT_NAME` and reflect real usage.
- Print help when `-h|--help` is passed and when argument validation fails.
- Exit with code `2` for invalid arguments or unknown options.
- Keep `usage` updated whenever the interface changes.

## Adherence Checklist

- Shebang `#!/usr/bin/env bash` and `set -euo pipefail` at the top.
- No `function` keyword, no associative arrays, no backticks, no `source` keyword.
- Always quote variables: `${var}` as "${var}"; use `$(...)` for command substitution.
- Prefer `[[ ... ]]` for tests; use `=` for string compare in `[ ]` if needed.
- Provide `cleanup` and `trap cleanup EXIT` when resources or temp files are involved.
- Consistent logging via helper functions; avoid noisy output by default.
- `usage` accurately reflects the interface and includes examples; return `exit 2` on invalid args.
- Ensure portability for Bash 3.2 (macOS default) and common Linux distros.

## ShellCheck quickstart

- Preferred wrapper: `scripts/validate_bash.sh [paths]` (uses severity=warning, shell=bash; auto-discovers `*.sh` when no paths are provided)
- Note: The wrapper may attempt to install ShellCheck automatically on supported systems. If you prefer to skip installation, pass `--skip-install` and install manually.
- macOS: `brew install shellcheck`
- Debian/Ubuntu: `sudo apt-get update && sudo apt-get install -y shellcheck`
- Validate a script: `shellcheck -S style -x path/to/script.sh`
- If ShellCheck is unavailable, document the reason and perform the manual Adherence Checklist.
