#!/usr/bin/env bash
set -euo pipefail

# validate_bash.sh - Auto-installing ShellCheck wrapper for AI agents
# Usage: validate_bash.sh [FILE|DIR ...]

# Logging helpers
log_info() { echo "[INFO] $1"; }
log_error() { echo "[ERROR] $1" >&2; }

usage() {
  cat <<EOF
USAGE: $(basename "$0") [OPTIONS] [FILE|DIR ...]

Validates Bash scripts with ShellCheck (auto-installs if missing).

ARGUMENTS:
  FILE|DIR    Files to validate or directories to search for *.sh
              If omitted, searches current directory

OPTIONS:
  --skip-install  Do not attempt to install ShellCheck if missing; print instructions and exit
  -h, --help      Show this help

EXAMPLES:
  $(basename "$0")                    # Validate all *.sh in current dir
  $(basename "$0") script.sh          # Validate specific file
  $(basename "$0") scripts/           # Validate all *.sh in directory
  $(basename "$0") file1.sh dir/      # Validate multiple paths
EOF
}

# Check if ShellCheck is installed
check_shellcheck() {
  command -v shellcheck >/dev/null 2>&1
}

# Install ShellCheck based on detected OS
install_shellcheck() {
  log_info "Installing ShellCheck..."
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew >/dev/null 2>&1; then
      brew install shellcheck
    else
      log_error "Homebrew not found. Install ShellCheck manually: https://github.com/koalaman/shellcheck#installing"
      return 1
    fi
  elif [[ -f /etc/debian_version ]]; then
    sudo apt-get update && sudo apt-get install -y shellcheck
  elif [[ -f /etc/fedora-release ]]; then
    sudo dnf install -y ShellCheck || sudo yum install -y ShellCheck || sudo yum install -y shellcheck
  elif [[ -f /etc/arch-release ]]; then
    sudo pacman -S --noconfirm shellcheck
  elif [[ -f /etc/alpine-release ]]; then
    sudo apk add shellcheck
  else
    log_error "Unsupported OS. Install manually: https://github.com/koalaman/shellcheck#installing"
    return 1
  fi
  
  if ! check_shellcheck; then
    log_error "Installation failed"
    return 1
  fi
  
  return 0
}

# Show installation instructions and exit
show_install_instructions() {
  log_error "shellcheck not found and --skip-install provided"
  log_error "Install on macOS:   brew install shellcheck"
  log_error "Install on Debian/Ubuntu: sudo apt-get update && sudo apt-get install -y shellcheck"
  log_error "More options: https://github.com/koalaman/shellcheck#installing"
}

# Discover *.sh files under a directory with standard exclusions
discover_sh() {
  local dir="$1"
  find "$dir" -type f -name '*.sh' \
    -not -path '*/.git/*' \
    -not -path '*/node_modules/*' \
    -not -path '*/vendor/*' \
    -not -path '*/.venv/*' \
    -not -path '*/.idea/*' \
    -not -path '*/dist/*' \
    -not -path '*/build/*' \
    -not -path '*/target/*'
}

# Collect scripts to validate
collect_scripts() {
  local files_tmp="$1"
  shift
  
  if [[ $# -gt 0 ]]; then
    for path in "$@"; do
      if [[ -f "$path" ]]; then
        echo "$path" >> "$files_tmp"
      elif [[ -d "$path" ]]; then
        discover_sh "$path" >> "$files_tmp"
      fi
    done
  else
    discover_sh "." >> "$files_tmp"
  fi
}

# Validate collected scripts
validate_scripts() {
  local files_tmp="$1"
  local failed=0
  
  while IFS= read -r file; do
    log_info "==> $file"
    if ! shellcheck -S warning -s bash "$file"; then
      failed=$((failed + 1))
    fi
  done < "$files_tmp"
  
  return "$failed"
}

# Main execution
main() {
  # Parse options
  local skip_install=0
  
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --skip-install)
        skip_install=1
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      -*)
        log_error "Unknown option: $1"
        usage
        exit 2
        ;;
      *)
        break
        ;;
    esac
  done
  
  # Ensure ShellCheck is available
  if ! check_shellcheck; then
    if [[ ${skip_install} -eq 1 ]]; then
      show_install_instructions
      exit 127
    fi
    
    if ! install_shellcheck; then
      exit 127
    fi
  fi
  
  # Collect scripts to validate
  local files_tmp
  files_tmp=$(mktemp)
  trap 'rm -f "$files_tmp"' EXIT
  
  collect_scripts "$files_tmp" "$@"
  
  local total
  total=$(wc -l < "$files_tmp" | tr -d ' ')
  
  if [[ $total -eq 0 ]]; then
    log_info "No scripts found"
    exit 0
  fi
  
  log_info "Validating $total script(s)..."
  
  # Validate scripts
  local failed=0
  validate_scripts "$files_tmp" || failed=$?
  
  echo ""
  if [[ $failed -gt 0 ]]; then
    log_error "$failed of $total failed"
    exit 1
  fi
  
  log_info "All $total passed"
  exit 0
}

# Run main function
main "$@"
