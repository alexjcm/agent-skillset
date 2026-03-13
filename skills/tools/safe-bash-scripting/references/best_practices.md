# Bash Script Best Practices

This reference document provides comprehensive best practices and industry standards for writing professional, maintainable, and portable Bash scripts.

## Table of Contents

1. [Shell Options](#shell-options)
2. [Script Structure](#script-structure)
3. [Defensive Programming](#defensive-programming)
4. [Portability](#portability)
5. [Code Style](#code-style)
6. [Functions](#functions)
7. [Variables](#variables)
8. [Quoting Rules](#quoting-rules)
9. [Testing](#testing)
10. [Performance](#performance)
11. [Security](#security)
12. [Documentation](#documentation)
13. [Industry Standards](#industry-standards)

---

## Shell Options

### Essential Options

Always use these at the start of your scripts:

```bash
#!/usr/bin/env bash
set -e  # Exit immediately if a command exits with a non-zero status
set -u  # Treat unset variables as an error
set -o pipefail  # Return value of pipeline is the last command to exit with non-zero status
```

### When to Use Each Option

**`set -e` (errexit)**
- **Use when:** You want the script to stop immediately on any error
- **Avoid when:** You need to handle errors explicitly with `if` statements
- **Note:** Does not catch errors in functions or subshells unless you use `||` or `&&`

**`set -u` (nounset)**
- **Use when:** You want to catch typos in variable names
- **Tip:** Use `${VAR:-default}` for optional variables

**`set -o pipefail`**
- **Use when:** You want pipelines to fail if any command fails
- **Example:** Without this, `false | true` succeeds; with it, it fails

---

## Script Structure

### Recommended Structure

```bash
#!/usr/bin/env bash
set -euo pipefail

#######################################
# Script: script_name.sh
# Description: What this script does
# Usage: script_name.sh [OPTIONS] ARGS
#######################################

# ===== CONSTANTS =====
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
readonly VERSION="1.0.0"

# ===== CONFIGURATION =====
# Default values for configuration
DEFAULT_RETRIES=3

# ===== HELPER FUNCTIONS =====
# Logging, validation, etc.

# ===== BUSINESS LOGIC FUNCTIONS =====
# Main functionality

# ===== MAIN FUNCTION =====
main() {
  # Entry point
}

# ===== SCRIPT EXECUTION =====
main "$@"
```

### Header Comments

Always include:
- **Script name** and brief description
- **Usage** syntax
- **Dependencies** or prerequisites (if any)

---

## Defensive Programming

### Input Validation

Always validate before use, but centralize patterns and functions in Common Patterns:

- Argument parsing: see references/common_patterns.md#argument-parsing
- Path validation (file/directory/extension): see references/common_patterns.md#path-validation

This document preserves the principles (what and why to validate). For concrete implementations and reusable functions, use Common Patterns.

> Note: For error handling, exit codes, and traps, see:
> - references/error_handling.md#exit-code-conventions
> - references/error_handling.md#cleanup-with-trap

### Fail Fast

Detect and report errors as early as possible:

```bash
# Check prerequisites upfront
command -v jq &> /dev/null || { echo "Error: jq is required" >&2; exit 1; }

# Validate environment
[[ -n "${REQUIRED_VAR:-}" ]] || { echo "Error: REQUIRED_VAR not set" >&2; exit 1; }
```

#### Keep `usage` in sync with the interface
- Update `usage` whenever arguments or flags change.
- Document required/optional positional args and all supported options.
- Include 1–2 valid examples using `SCRIPT_NAME`/`$(basename "$0")`.
- Print help on `-h|--help` and when validation fails; exit with code `2` on invalid args.
- In non-interactive/CI contexts (no TTY), avoid prompts; require explicit flags (for example, `--force`).

---

## Portability

### Bash 3.2 Compatibility

**Avoid Bash 4+ features:**

```bash
# ❌ BAD: Associative arrays (Bash 4+)
declare -A my_array

# ✅ GOOD: Use indexed arrays or external tools
my_array=()
my_array+=("value")
```

### POSIX Compliance

For maximum portability, prefer POSIX constructs:

```bash
# ❌ BAD: Bash-specific [[
if [[ "$var" == "value" ]]; then

# ✅ GOOD: POSIX [
if [ "$var" = "value" ]; then

# But [[ is fine for Bash 3.2+ scripts
```

### Output Policy

For this skill, prefer using the standard logging functions (`log_info`, `log_error`, `log_warning`) defined in `SKILL.md` for all status output. Use `echo` only for piping data to stdout.
---

## Code Style

### Indentation

- Use **2 spaces** for indentation (not tabs)
- Indent case statements

```bash
case "${var}" in
  pattern1)
    command1
    ;;
  pattern2)
    command2
    ;;
esac
```

### Quote Everything

Always quote variables and command substitutions:

```bash
# ✅ GOOD
cp "${source}" "${destination}"
for file in "${files[@]}"; do

# ❌ BAD
cp $source $destination
for file in ${files[@]}; do
```

---

## Functions

### Naming

- Use lowercase with underscores: `validate_input`
- Be descriptive: `copy_artifact_to_deploy` not `copy_file`

### Single Responsibility

Each function should do one thing well:

```bash
# ✅ GOOD: Focused functions
validate_file() {
  [[ -f "$1" ]] || return 1
}

process_file() {
  validate_file "$1" || return 1
  # Processing logic
}

# ❌ BAD: Functions doing too much
process_and_validate_file() {
  # Validation + processing mixed
}
```

### Return Codes vs stdout

**Return codes** for success/failure:

```bash
validate_input() {
  [[ -n "$1" ]] || return 1
  return 0
}

if validate_input "${value}"; then
  echo "Valid"
fi
```

**stdout** for data:

```bash
get_filename() {
  basename "$1"
}

filename="$(get_filename "${path}")"
```

### Function Comments

Document complex functions:

```bash
#######################################
# Validates and processes input file
# Arguments:
#   $1 - Path to input file
#   $2 - Output directory (optional)
# Returns:
#   0 on success, 1 on failure
# Outputs:
#   Writes processed data to stdout
#######################################
process_input() {
  # Implementation
}
```

---

## Variables

### Scope

Use `local` for function variables:

```bash
my_function() {
  local temp_var="value"  # Only visible in function
  # Use temp_var
}
```

### Constants

Use `readonly` for constants:

```bash
readonly MAX_RETRIES=3
readonly CONFIG_FILE="/etc/myapp.conf"
```

---

## Quoting Rules

### When to Quote

**Always quote:**
- Variable expansions: `"${var}"`
- Command substitutions: `"$(command)"`
- Strings with spaces: `"hello world"`

**Don't quote:**
- Arithmetic expressions: `$((1 + 1))`
- Single words in assignments: `var=value`

### Double vs Single Quotes

```bash
# Double quotes: Variable expansion
echo "Hello ${name}"  # Expands ${name}

# Single quotes: Literal strings
echo 'Hello ${name}'  # Literal ${name}
```

### Parameter Expansion

```bash
# Default values
echo "${VAR:-default}"  # Use default if VAR is unset or empty

# Substring
echo "${VAR:0:5}"  # First 5 characters

# Replace
echo "${VAR/old/new}"  # Replace first occurrence
echo "${VAR//old/new}"  # Replace all occurrences
```

---

## Testing

### ShellCheck Integration

Always run ShellCheck before deploying:

```bash
shellcheck myscript.sh
```

Preferred local wrapper:
- Use `scripts/validate_bash.sh [paths]` to validate scripts with sensible defaults (severity=warning, shell=bash). If no paths are provided, it auto-detects `*.sh` under the current directory.
- Installation is optional: pass `--skip-install` to avoid automatic installation and follow the manual instructions shown by the tool.

See also: references/error_handling.md#exit-code-conventions para patrones de comprobación y propagación de códigos de salida.

---

## Performance

### Avoid Unnecessary Subshells

```bash
# ❌ BAD: Subshell for each iteration
for file in $(ls); do

# ✅ GOOD: Glob expansion
for file in *; do
```

### Use Builtins

Prefer bash builtins over external commands:

```bash
# ❌ BAD: External command
length=$(echo -n "$string" | wc -c)

# ✅ GOOD: Bash builtin
length=${#string}
```

### Pipeline Efficiency

Minimize pipeline stages:

```bash
# ❌ BAD: Multiple pipes
cat file | grep pattern | sort | uniq

# ✅ GOOD: Fewer processes
grep pattern file | sort -u
```

---

## Security

### Avoid eval

Never use `eval` with user input:

```bash
# ❌ DANGEROUS
eval "$user_input"

# ✅ SAFE: Use arrays or proper quoting
```

### Sanitize Inputs

Validate and sanitize all external inputs:

```bash
# Validate format
if [[ ! "$input" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  echo "Invalid input format" >&2
  exit 1
fi
```

### Temporary File Handling

Use `mktemp` for temporary files:

```bash
# ✅ GOOD: Secure temp file
temp_file="$(mktemp)"
trap 'rm -f "${temp_file}"' EXIT

# ❌ BAD: Predictable temp file
temp_file="/tmp/myapp.tmp"
```

---

## Documentation

### Comment Quality

Write comments that explain **why**, not **what**:

### Usage Messages

Provide clear usage information:

```bash
usage() {
  cat << EOF
Usage: $(basename "$0") [OPTIONS] FILE

Process FILE with various options.

OPTIONS:
  -h, --help      Display this help message

EXAMPLES:
  $(basename "$0") input.txt
EOF
}
```

---

## Industry Standards

### Google Shell Style Guide

Key recommendations:
- Use `#!/usr/bin/env bash` shebang
- Indent with 2 spaces
- Maximum line length: 100 characters
- Use `[[` over `[` for conditions
- Quote all variables

**Reference:** https://google.github.io/styleguide/shellguide.html

### ShellCheck Recommendations

Follow ShellCheck's best practices:
- Quote variables to prevent word splitting
- Use `|| exit` after `cd` commands
- Check command existence before use
- Prefer `[[ ]]` over `[ ]`

**Reference:** https://www.shellcheck.net/wiki/

### POSIX Shell Compliance

For portable scripts:
- Avoid arrays (use while read loops)
- Use `[ ]` instead of `[[ ]]`
- Avoid `local` (use function prefixes)

**Reference:** https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html

### Bash Pitfalls

Common mistakes to avoid:
- Not quoting variables
- Using `ls` for file iteration
- Not checking exit codes
- Using `-eq` for string comparison

**Reference:** https://mywiki.wooledge.org/BashPitfalls
