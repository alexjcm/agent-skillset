# Error Handling in Bash

This reference provides comprehensive guidance on error handling techniques for robust Bash scripts.

## Table of Contents

1. [Set Options Deep Dive](#set-options-deep-dive)
2. [Exit Code Conventions](#exit-code-conventions)
3. [Function Return Values](#function-return-values)
4. [Cleanup with Trap](#cleanup-with-trap)
5. [Validation Patterns](#validation-patterns)
6. [Error Messages](#error-messages)

---

## Set Options Deep Dive

### `set -e` (errexit)

Exit immediately if a command exits with a non-zero status.

```bash
set -e

# Script will exit here if command fails
command_that_might_fail

# This won't execute if above fails
echo "Success"
```

**Caveats:**

```bash
# Does NOT exit on failure in:
# 1. Conditions
if false; then
  echo "Never printed"
fi

# 2. While/until conditions  
while false; do
  echo "Never executed"
done

# 3. Pipelines (unless pipefail is set)
false | true  # Succeeds without pipefail

# 4. Commands with || or &&
command_that_fails || echo "Handled"
```

**Disabling temporarily:**

```bash
set -e

# Disable for specific commands
set +e
command_that_might_fail
exit_code=$?
set -e

# Handle error
if [[ ${exit_code} -ne 0 ]]; then
  echo "Command failed with code ${exit_code}"
fi
```

### `set -u` (nounset)

Treat unset variables as errors.

```bash
set -u

echo "${undefined_var}"  # ERROR: unbound variable

# Use default values for optional variables
echo "${optional_var:-default}"  # OK: prints "default"
echo "${optional_var:=default}"  # OK: also sets optional_var
```

**Checking if variable is set:**

```bash
if [[ -n "${VAR:-}" ]]; then
  echo "VAR is set to: ${VAR}"
else
  echo "VAR is not set"
fi
```

### `set -o pipefail`

Pipeline returns the exit status of the last command that failed.

```bash
set -o pipefail

# Without pipefail: succeeds (true is last)
# With pipefail: fails (false fails)
false | true
echo $?  # Non-zero with pipefail

# Practical example
if ! grep pattern file | sort | uniq > output; then
  echo "Pipeline failed"
  exit 1
fi
```

### Recommended Combination

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'  # Safer word splitting

# Your script here
```

---

## Exit Code Conventions

### Standard Exit Codes

```bash
# Success
exit 0

# Generic errors
exit 1   # General error

# Specific errors (follows Bash conventions)
exit 2   # Misuse of shell command (invalid arguments)
exit 126 # Command cannot execute (permission denied)
exit 127 # Command not found
exit 128 # Invalid exit argument
exit 130 # Script terminated by Ctrl+C (128 + 2)
```

### Custom Exit Codes

> **Note:** Custom exit codes are considered an **advanced pattern**. For most scripts, standard codes `0` (success) and `1` (error) are sufficient and preferred for simplicity.

Define meaningful codes for your application only when necessary:

```bash
# Exit codes
readonly E_SUCCESS=0
readonly E_GENERAL=1
readonly E_INVALID_ARGS=2
readonly E_FILE_NOT_FOUND=10
readonly E_PERMISSION_DENIED=11
readonly E_NETWORK_ERROR=12

validate_file() {
  local file="$1"
  
  if [[ ! -e "${file}" ]]; then
    echo "Error: File not found: ${file}" >&2
    return ${E_FILE_NOT_FOUND}
  fi
  
  if [[ ! -r "${file}" ]]; then
    echo "Error: Permission denied: ${file}" >&2
    return ${E_PERMISSION_DENIED}
  fi
  
  return ${E_SUCCESS}
}

# Use in main
main() {
  validate_file "$1" || exit $?
}
```

### Checking Exit Codes

```bash
# Check immediately
if command; then
  echo "Success"
else
  echo "Failed"
fi

# Or capture and check
command
exit_code=$?
if [[ ${exit_code} -ne 0 ]]; then
  echo "Command failed with exit code: ${exit_code}"
  exit ${exit_code}
fi

# Pattern for multiple related commands
exit_code=0
command1 || exit_code=$?
command2 || exit_code=$?
command3 || exit_code=$?

if [[ ${exit_code} -ne 0 ]]; then
  echo "One or more commands failed"
  exit ${exit_code}
fi
```

---

## Function Return Values

### Returning Data via stdout

For data output, use echo:

```bash
get_username() {
  local user_id="$1"
  
  # Query and return username
  local username
  username="$(id -un "${user_id}" 2>/dev/null)" || return 1
  
  echo "${username}"
  return 0
}

# Usage
if username="$(get_username 1000)"; then
  echo "Username: ${username}"
else
  echo "Failed to get username"
fi
```

### Global Variables (Use Sparingly)

```bash
# Global for function output (prefix with underscore)
_RESULT=""

compute_value() {
  local input="$1"
  
  # Computation
  _RESULT=$((input * 2))
  
  return 0
}

# Usage
compute_value 10
echo "Result: ${_RESULT}"
```

---

## Cleanup with Trap

### Basic Cleanup

```bash
#!/usr/bin/env bash
set -euo pipefail

# Temporary file
temp_file="$(mktemp)"

# Ensure cleanup on exit
trap 'rm -f "${temp_file}"' EXIT

# Use temp file
echo "data" > "${temp_file}"

# Cleanup happens automatically on exit
```

### Multiple Cleanup Actions

```bash
cleanup() {
  echo "Cleaning up..."
  rm -f "${temp_file}"
  rm -rf "${temp_dir}"
  
  # Kill background process if running
  if [[ -n "${bg_pid:-}" ]]; then
    kill "${bg_pid}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

temp_file="$(mktemp)"
temp_dir="$(mktemp -d)"

# Start background process
long_running_command &
bg_pid=$!
```

### Trap on Specific Signals

```bash
# Handle interruption gracefully
interrupted=0

handle_interrupt() {
  echo "Interrupted, cleaning up..."
  interrupted=1
}

trap handle_interrupt INT TERM

# Main work
for i in {1..100}; do
  if [[ ${interrupted} -eq 1 ]]; then
    echo "Stopping gracefully..."
    break
  fi
  
  # Do work
  sleep 1
done
```

---

## Validation Patterns

### Safe Command Execution

```bash
safe_execute() {
  local description="$1"
  shift
  local command=("$@")
  
  echo "Executing: ${description}"
  
  if ! "${command[@]}"; then
    echo "Error: Failed to ${description}" >&2
    return 1
  fi
  
  echo "Success: ${description}"
  return 0
}

# Usage
safe_execute "copy file" cp source.txt dest.txt || exit 1
safe_execute "remove temp" rm -f temp.txt || exit 1
```

### Defensive Directory Changes

```bash
# ❌ BAD: cd might fail silently
cd /some/directory
rm -rf *  # Dangerous if cd failed!

# ✅ GOOD: Exit if cd fails
cd /some/directory || exit 1
rm -rf *

# ✅ BETTER: Use subshell
(
  cd /some/directory || exit 1
  rm -rf *
)
```

---

## Error Messages

### Informative Error Messages

```bash
# ❌ BAD: Vague error
echo "Error" >&2

# ✅ GOOD: Specific error
echo "Error: File not found: ${filename}" >&2

# ✅ BETTER: Context and suggestion
echo "Error: Configuration file not found: ${config_file}" >&2
echo "Please create the file or set CONFIG_FILE environment variable" >&2
```
