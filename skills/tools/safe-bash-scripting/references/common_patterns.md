# Common Bash Patterns

This reference provides reusable code patterns for common scripting tasks.

> Note: For exit code conventions and trap handling, see:
> - references/error_handling.md#exit-code-conventions
> - references/error_handling.md#cleanup-with-trap

## Table of Contents

1. [Argument Parsing](#argument-parsing)
2. [Path Validation](#path-validation)
3. [File Operations](#file-operations)
4. [Directory Traversal](#directory-traversal)
5. [Additional Patterns](#additional-patterns)

---

## Argument Parsing

### Simple Positional Arguments

```bash
# Script expects: script.sh SOURCE DESTINATION
if [[ $# -ne 2 ]]; then
  log_error "Usage: $0 SOURCE DESTINATION"
  exit 2
fi

source="$1"
destination="$2"
```

### Optional Arguments with Defaults

```bash
source="${1:-.}"  # Default to current directory
destination="${2:-/tmp}"
```

### Flag-Based Arguments

```bash
FORCE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -f|--force)
      FORCE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      log_error "Unknown option: $1"
      exit 2
      ;;
    *)
      break  # End of options, positional args follow
      ;;
  esac
done
```

### Mixed Options and Arguments

```bash
# Parse options first, then positional args
OPTIONS=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --option)
      OPTIONS="$2"
      shift 2
      ;;
    -*)
      log_error "Unknown option: $1"
      exit 2
      ;;
    *)
      break
      ;;
  esac
done

# Now $@ contains only positional arguments
if [[ $# -lt 1 ]]; then
  log_error "Missing required argument"
  exit 2
fi

input_file="$1"
```

---

## Path Validation

### Check File Exists

```bash
validate_file() {
  local file="$1"
  
  if [[ ! -e "${file}" ]]; then
    log_error "File does not exist: ${file}"
    return 1
  fi
  
  if [[ ! -f "${file}" ]]; then
    log_error "Not a regular file: ${file}"
    return 1
  fi
  
  return 0
}
```

### Check Directory Exists and Writable

```bash
validate_directory() {
  local dir="$1"
  
  if [[ ! -d "${dir}" ]]; then
    log_error "Directory does not exist: ${dir}"
    return 1
  fi
  
  if [[ ! -w "${dir}" ]]; then
    log_error "Directory not writable: ${dir}"
    return 1
  fi
  
  return 0
}
```

### Check File Extension

```bash
validate_extension() {
  local file="$1"
  local expected_ext="$2"
  
  if [[ "${file}" != *"${expected_ext}" ]]; then
    log_error "File must have ${expected_ext} extension"
    return 1
  fi
  
  return 0
}
```

---

## File Operations

### Safe File Copy with Backup

```bash
copy_with_backup() {
  local source="$1"
  local destination="$2"
  
  # Create backup if destination exists
  if [[ -f "${destination}" ]]; then
    local backup="${destination}.backup.$(date '+%Y%m%d_%H%M%S')"
    cp "${destination}" "${backup}"
    log_info "Created backup: ${backup}"
  fi
  
  cp "${source}" "${destination}"
}
```

### Atomic File Write

```bash
atomic_write() {
  local content="$1"
  local target_file="$2"
  local temp_file
  
  temp_file="$(mktemp)"
  trap 'rm -f "${temp_file}"' RETURN
  
  echo "${content}" > "${temp_file}"
  mv "${temp_file}" "${target_file}"
}
```

### Read File Line by Line

```bash
process_file_lines() {
  local file="$1"
  
  while IFS= read -r line; do
    # Process each line
    log_info "Processing: ${line}"
  done < "${file}"
}
```

### Find Files by Pattern

```bash
find_files() {
  local directory="$1"
  local pattern="$2"
  
  find "${directory}" -type f -name "${pattern}" -print0 | 
    while IFS= read -r -d '' file; do
      echo "${file}"
    done
}
```

---

## Directory Traversal

### Process All Files in Directory

```bash
process_directory() {
  local directory="$1"
  
  for file in "${directory}"/*; do
    # Skip if no files match
    [[ -e "${file}" ]] || continue
    
    if [[ -f "${file}" ]]; then
      log_info "Processing file: ${file}"
      # Process file
    elif [[ -d "${file}" ]]; then
      log_info "Processing directory: ${file}"
      # Process directory
    fi
  done
}
```

### Create Directory Structure

```bash
ensure_directory_structure() {
  local base_dir="$1"
  
  mkdir -p "${base_dir}"/{bin,lib,conf,logs,tmp}
  
  # Set permissions
  chmod 755 "${base_dir}"/{bin,lib,conf}
  chmod 700 "${base_dir}"/{logs,tmp}
}
```

### Safe Directory Cleanup

```bash
cleanup_old_files() {
  local directory="$1"
  local days="${2:-7}"
  
  # Find and remove files older than N days
  find "${directory}" -type f -mtime +${days} -print -delete
  
  # Remove empty directories
  find "${directory}" -type d -empty -delete
}
```

---

## Safe Deletion (rm)

Use this pattern whenever a Bash script will delete directories or files using rm. It prevents destructive deletions by validating input, refusing symlinks, canonicalizing paths, and enforcing a whitelist of safe prefixes.

Guidelines:
- Separate options from operands: `rm -rf -- "$path"`.
- Validate non-empty input and require a directory (or adapt for files).
- Refuse symlinks and canonicalize with `pwd -P`.
- Block dangerous roots like `/` and `$HOME`.
- Enforce a whitelist of safe prefixes and log actions; handle `rm` failures.

Reusable helper (directory-focused):

```bash
# Whitelist of safe roots where deletions are allowed (adjust for your project)
SAFE_PREFIXES=(
  "$HOME/.myapp/skills/"
  "/opt/myapp/var/skills/"
)

safe_rm() {
  local -r path="${1:-}"

  # Basic validations
  if [[ -z "$path" || ! -d "$path" ]]; then
    log_error "Invalid directory (missing or not a dir): ${path:-<empty>}"
    return 1
  fi

  # Reject symlinks
  if [[ -L "$path" ]]; then
    log_error "Refusing to remove symlink: $path"
    return 1
  fi

  # Canonicalize
  local real_path
  real_path="$(cd "$path" 2>/dev/null && pwd -P)"
  if [[ -z "$real_path" ]]; then
    log_error "Unable to resolve real path: $path"
    return 1
  fi

  # Protect dangerous roots
  if [[ "$real_path" == "/" || "$real_path" == "$HOME" ]]; then
    log_error "Dangerous path: $real_path"
    return 1
  fi

  # Whitelist check
  local allowed=false p
  for p in "${SAFE_PREFIXES[@]}"; do
    case "$real_path" in
      "${p%/}"*) allowed=true; break ;;
    esac
  done
  if [[ "$allowed" != true ]]; then
    log_error "Path outside safe prefix: $real_path"
    return 1
  fi

  log_info "🧹 Removing: $real_path"
  if ! rm -rf -- "$real_path"; then
    log_error "Failed to remove: $real_path"
    return 1
  fi
}
```

## Additional Patterns

### Retry Logic

```bash
retry() {
  local max_attempts="$1"
  shift
  local command=("$@")
  local attempt=1
  
  until "${command[@]}"; do
    if [[ ${attempt} -ge ${max_attempts} ]]; then
      log_error "Command failed after ${max_attempts} attempts"
      return 1
    fi
    log_warning "Attempt ${attempt} failed, retrying..."
    sleep $((attempt * 2))  # Exponential backoff
    attempt=$((attempt + 1))
  done
  
  return 0
}

# Usage: retry 3 curl https://example.com
```

### Confirm Action

```bash
confirm() {
  local prompt="${1:-Are you sure?}"
  
  read -p "${prompt} (y/n) " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    return 0
  else
    return 1
  fi
}

# Usage:
# if confirm "Delete all files?"; then
#   rm -rf *
# fi
```
