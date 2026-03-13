#!/usr/bin/env bash
set -euo pipefail

#######################################
# Script: template_medium.sh
# Description: Medium complexity script template for multi-function scripts (50-200 lines)
# Usage: template_medium.sh [OPTIONS] ARGS
#######################################

# ===== CONSTANTS =====
SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
readonly SCRIPT_NAME
readonly VERSION="1.0.0"

# ===== CONFIGURATION =====
# Default configuration values

# ===== LOGGING FUNCTIONS =====
log_info() { echo "[INFO] $1"; }
log_warning() { echo "[WARNING] $1" >&2; }
log_error() { echo "[ERROR] $1" >&2; }

# ===== HELPER FUNCTIONS =====

#######################################
# Display usage information
#######################################
usage() {
  cat << EOF
Usage: ${SCRIPT_NAME} [OPTIONS] ARG1 ARG2

Description of what this script does and its purpose.

ARGUMENTS:
  ARG1              Description of first argument
  ARG2              Description of second argument (optional)

OPTIONS:
  -h, --help        Display this help message

EXAMPLES:
  ${SCRIPT_NAME} input.txt
  ${SCRIPT_NAME} input.txt output.txt
EOF
}

#######################################
# Validate input arguments
# Arguments:
#   $1 - First argument to validate
# Returns:
#   0 on success, 1 on failure
#######################################
validate_input() {
  local input="$1"
  
  # Add your validation logic here
  if [[ -z "${input}" ]]; then
    log_error "Input cannot be empty"
    return 1
  fi
  
  return 0
}

#######################################
# Parse command line arguments
# Sets global variables based on flags
#######################################
parse_args() {
  # Check for help first
  for arg in "$@"; do
    if [[ "${arg}" == "-h" ]] || [[ "${arg}" == "--help" ]]; then
      usage
      exit 0
    fi
  done
  
  # Parse options
  while [[ $# -gt 0 ]]; do
    case "$1" in
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
  
  # Validate required positional arguments
  if [[ $# -lt 1 ]]; then
    log_error "Missing required arguments"
    usage
    exit 2
  fi
  
  # Store positional arguments in global variables
  ARG1="$1"
  ARG2="${2:-}"  # Optional second argument
}

# ===== BUSINESS LOGIC FUNCTIONS =====

#######################################
# Process the input
# Arguments:
#   $1 - Input to process
# Returns:
#   0 on success, 1 on failure
#######################################
process_input() {
  local input="$1"
  
  log_info "Processing input: ${input}"
  
  # Add your processing logic here
  
  log_info "Processing completed"
  return 0
}

# ===== MAIN FUNCTION =====

#######################################
# Main function - entry point
#######################################
main() {
  log_info "Starting ${SCRIPT_NAME} v${VERSION}..."
  
  # Parse arguments
  parse_args "$@"
  
  # Configuration:
  #   ARG1: ${ARG1}
  #   ARG2: ${ARG2}
  
  # Validate input
  if ! validate_input "${ARG1}"; then
    log_error "Input validation failed"
    exit 1
  fi
  
  # Process input
  if ! process_input "${ARG1}"; then
    log_error "Processing failed"
    exit 1
  fi
  
  log_info "Script completed successfully"
}

# ===== SCRIPT EXECUTION =====
main "$@"
