#!/usr/bin/env bash
set -euo pipefail

#######################################
# Script: template_simple.sh
# Description: Simple script template for basic tasks (10-50 lines)
# Usage: template_simple.sh [OPTIONS] ARGS
#######################################

# Constants
SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
readonly SCRIPT_NAME

# Logging functions
log_info() { echo "[INFO] $1"; }
log_error() { echo "[ERROR] $1" >&2; }

#######################################
# Display usage information
#######################################
usage() {
  cat << EOF
Usage: ${SCRIPT_NAME} [OPTIONS] ARG

Brief description of what this script does.

OPTIONS:
  -h, --help    Display this help message

EXAMPLES:
  ${SCRIPT_NAME} argument
EOF
}

#######################################
# Main function
#######################################
main() {
  # Parse help flag
  if [[ "${1:-}" == "-h" ]] || [[ "${1:-}" == "--help" ]]; then
    usage
    exit 0
  fi
  
  # Validate arguments
  if [[ $# -lt 1 ]]; then
    log_error "Missing required argument"
    usage
    exit 2
  fi
  
  local arg="$1"
  
  # Main logic here
  log_info "Processing: ${arg}"
  
  # Your code here
  
  log_info "Done"
}

# Execute main
main "$@"
