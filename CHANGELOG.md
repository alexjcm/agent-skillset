# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- Moved the CLI package layout from `cli/` to the repository root.
- Updated docs and setup commands to use the root package paths.
- Updated Antigravity project path in `src/core/config.ts` (`IDE_PROJECT_PATHS.antigravity`) to `.agents/skills`.

## [1.1.0] - 2026-04-03
### Changed
- Refactored global configuration and caching directory from `~/.skills/` to `~/.skillctrl/`.

## [1.0.0] - 2026-04-03
### Added
- Initial release of `skillctrl`.
- Core CLI functionality to manage and deploy AI agent skills.
