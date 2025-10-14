# Changelog

All notable changes to **Vaelix Bank API** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- AES256-GCM encryption for API key secrets
- Database key type support for API keys
- GitHub Actions CI/CD pipeline
- Comprehensive test suite with Jest
- Code quality tools (ESLint, Prettier, Husky)
- Docker containerization support
- OpenAPI documentation
- Security audit and vulnerability scanning
- Multi-environment configuration support

### Changed
- Migrated from bcrypt to AES256 encryption for API keys
- Enhanced security middleware with progressive rate limiting
- Improved error handling and logging
- Updated API key validation to use encryption instead of hashing

### Security
- Implemented AES256-GCM encryption for sensitive data at rest
- Added brute force protection with account locking
- Enhanced rate limiting across different endpoints
- Security vulnerability scanning in CI/CD pipeline

## [1.0.0] - 2024-01-XX

### Added
- Initial release of Vaelix Bank API
- Core banking functionality with Weavr integration
- User authentication and authorization
- Account and card management
- Transaction processing (sends, transfers, wire transfers)
- Strong Customer Authentication (SCA)
- Regulatory compliance features
- RESTful API design
- TypeScript implementation
- PostgreSQL database integration

### Features
- Corporate and consumer identity management
- KYC/KYB process integration
- IBAN generation and management
- Virtual and physical card support
- Beneficiary management
- Bulk operations support
- Webhook integration
- Audit trail logging

### Security
- API key authentication
- JWT token management
- bcrypt password hashing
- Basic rate limiting
- Input validation and sanitization

---

## Types of changes

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities

## Versioning

This project uses [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

---

For more information about upcoming releases, see the [GitHub Issues](https://github.com/vaelixbank/vaelix-api/issues) or join our [community discussions](https://github.com/vaelixbank/vaelix-api/discussions).