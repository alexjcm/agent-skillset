#!/usr/bin/env bash
set -euo pipefail

#######################################
# Script: example_file_copy.sh
# Description: Safe file copy with validation and confirmation
# Usage: example_file_copy.sh SOURCE DESTINATION [OPTIONS]
#######################################

SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
readonly SCRIPT_NAME

# Configuration
FORCE_OVERWRITE=0
BACKUP_EXISTING=0

# Logging functions
log_info() { echo "[INFO] $1"; }
log_error() { echo "[ERROR] $1" >&2; }
log_success() { echo "[SUCCESS] $1"; }

#######################################
# Display usage information
#######################################
usage() {
  cat << EOF
Usage: ${SCRIPT_NAME} SOURCE DESTINATION [OPTIONS]

Safely copy files with validation and optional confirmation.

ARGUMENTS:
  SOURCE              Source file path
  DESTINATION         Destination file or directory path

OPTIONS:
  -f, --force         Force overwrite without confirmation
  -b, --backup        Create backup of existing destination file
  -h, --help          Display this help message

EXAMPLES:
  ${SCRIPT_NAME} file.txt /tmp/
  ${SCRIPT_NAME} file.txt /tmp/newfile.txt --force
  ${SCRIPT_NAME} file.txt /tmp/file.txt --backup
EOF
}

#######################################
# Validate source file
# Arguments:
#   $1 - Source file path
#######################################
validate_source() {
  local source="$1"
  
  log_info "Validating source: ${source}"
  
  if [[ ! -e "${source}" ]]; then
    log_error "Source does not exist: ${source}"
    return 1
  fi
  
  if [[ ! -f "${source}" ]]; then
    log_error "Source is not a regular file: ${source}"
    return 1
  fi
  
  if [[ ! -r "${source}" ]]; then
    log_error "Source is not readable: ${source}"
    return 1
  fi
  
  return 0
}

#######################################
# Validate destination
# Arguments:
#   $1 - Destination path
#######################################
validate_destination() {
  local destination="$1"
  local dest_dir
  
  log_info "Validating destination: ${destination}"
  
  # If destination is a directory, that's fine
  if [[ -d "${destination}" ]]; then
    if [[ ! -w "${destination}" ]]; then
      log_error "Destination directory is not writable: ${destination}"
      return 1
    fi
    return 0
  fi
  
  # If destination is a file, check parent directory
  dest_dir="$(dirname "${destination}")"
  
  if [[ ! -d "${dest_dir}" ]]; then
    log_error "Destination directory does not exist: ${dest_dir}"
    return 1
  fi
  
  if [[ ! -w "${dest_dir}" ]]; then
    log_error "Destination directory is not writable: ${dest_dir}"
    return 1
  fi
  
  return 0
}

#######################################
# Check if destination file exists and get confirmation
# Arguments:
#   $1 - Destination file path
# Returns:
#   0 - OK to proceed
#   1 - Do not proceed
#######################################
check_overwrite() {
  local dest_file="$1"
  
  if [[ ! -f "${dest_file}" ]]; then
    return 0
  fi
  
  log_info "Destination file already exists: ${dest_file}"
  
  if [[ ${FORCE_OVERWRITE} -eq 1 ]]; then
    return 0
  fi
  
  # Interactive confirmation
  read -p "Overwrite existing file? (y/n) " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "User confirmed overwrite"
    return 0
  else
    log_info "User cancelled operation"
    return 1
  fi
}

#######################################
# Create backup of existing file
# Arguments:
#   $1 - File to backup
#######################################
create_backup() {
  local file="$1"
  local backup
  local timestamp
  
  timestamp="$(date '+%Y%m%d_%H%M%S')"
  backup="${file}.backup.${timestamp}"
  
  log_info "Creating backup: ${backup}"
  
  if cp "${file}" "${backup}"; then
    log_success "Backup created: ${backup}"
    return 0
  else
    log_error "Failed to create backup"
    return 1
  fi
}

#######################################
# Copy file
# Arguments:
#   $1 - Source file
#   $2 - Destination path
#######################################
copy_file() {
  local source="$1"
  local destination="$2"
  local dest_file="${destination}"
  
  # If destination is a directory, append source filename
  if [[ -d "${destination}" ]]; then
    dest_file="${destination}/$(basename "${source}")"
  fi
  
  
  # Check if we need to overwrite
  if ! check_overwrite "${dest_file}"; then
    log_info "Copy operation cancelled"
    return 1
  fi
  
  # Create backup if requested and file exists
  if [[ ${BACKUP_EXISTING} -eq 1 ]] && [[ -f "${dest_file}" ]]; then
    if ! create_backup "${dest_file}"; then
      log_error "Backup failed, aborting copy"
      return 1
    fi
  fi
  
  # Perform the copy
  log_info "Copying: ${source} -> ${dest_file}"
  
  if cp "${source}" "${dest_file}"; then
    log_success "File copied successfully"
    
    return 0
  else
    log_error "Copy operation failed"
    return 1
  fi
}

#######################################
# Parse command line arguments
# Sets global variables: SOURCE, DESTINATION
#######################################
parse_args() {
  # Check for help first
  for arg in "$@"; do
    if [[ "${arg}" == "-h" ]] || [[ "${arg}" == "--help" ]]; then
      usage
      exit 0
    fi
  done
  
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -f|--force)
        FORCE_OVERWRITE=1
        shift
        ;;
      -b|--backup)
        BACKUP_EXISTING=1
        shift
        ;;
      -*)
        log_error "Unknown option: $1"
        usage
        exit 2
        ;;
      *)
        if [[ -z "${SOURCE:-}" ]]; then
          SOURCE="$1"
        elif [[ -z "${DESTINATION:-}" ]]; then
          DESTINATION="$1"
        else
          log_error "Too many arguments"
          usage
          exit 2
        fi
        shift
        ;;
    esac
  done
  
  # Validate required arguments
  if [[ -z "${SOURCE:-}" ]] || [[ -z "${DESTINATION:-}" ]]; then
    log_error "Missing required arguments"
    usage
    exit 2
  fi
}

#######################################
# Main function
#######################################
main() {
  log_info "Starting ${SCRIPT_NAME}..."
  
  # Parse arguments (sets SOURCE and DESTINATION globals)
  parse_args "$@"
  
  
  # Validate source
  if ! validate_source "${SOURCE}"; then
    exit 1
  fi
  
  # Validate destination
  if ! validate_destination "${DESTINATION}"; then
    exit 1
  fi
  
  # Copy file
  if ! copy_file "${SOURCE}" "${DESTINATION}"; then
    exit 1
  fi
  
  log_success "Operation completed successfully"
}

# Execute main
main "$@"
