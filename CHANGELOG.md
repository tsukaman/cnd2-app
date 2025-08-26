# Changelog

All notable changes to the CND² project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-26

### Added
- Initial production release
- Prairie Card integration for automatic profile fetching
- AI-powered diagnosis using OpenAI GPT-4
- Duo mode (2-person compatibility analysis)
- Group mode (3-6 person team analysis)
- QR code and URL sharing functionality
- Beautiful dark theme UI with animations
- Comprehensive test coverage (63 tests)

### Security
- CSP (Content Security Policy) configuration
- Rate limiting implementation (100 requests/minute)
- Environment variable validation with Zod
- API key protection (server-side only)

### Performance
- Image optimization with Next/Image
- Lazy loading with Intersection Observer
- Bundle size analysis with webpack-bundle-analyzer
- Code splitting with dynamic imports
- Edge runtime support with Cloudflare Workers

### Infrastructure
- Cloudflare Pages deployment configuration
- Cloudflare Workers KV for data persistence
- Sentry integration for error tracking
- GitHub Actions CI/CD pipeline
- Claude Code review automation (Japanese)

## [0.9.0] - 2025-08-25

### Added
- Performance optimization features
- Sentry error monitoring integration
- Cloudflare Workers KV storage implementation
- Bundle analyzer for optimization insights
- Type checking script in CI/CD

### Fixed
- CI test failures and missing dependencies
- TypeScript type errors in tests
- API route type safety issues

### Changed
- License from MIT to Apache 2.0
- Removed personal email, added Twitter handle
- Updated all documentation to reflect current state

## [0.8.0] - 2025-08-24

### Security
- Removed `unsafe-eval` from CSP configuration
- Enhanced security headers
- Added CSP violation reporting

### Improved
- Unified Sentry error filtering logic
- API type safety improvements
- KV API route parameter handling

## [0.7.0] - 2025-08-23

### Added
- OpenAI integration with intelligent fallback
- Prairie Card profile parsing
- Rate limiting middleware
- Structured error handling

### Fixed
- Prairie Card URL validation
- API response consistency
- Error message formatting

## [0.6.0] - 2025-08-22

### Added
- Diagnosis result page
- Share functionality with social media integration
- Result persistence (7-day auto-delete)
- Beautiful animations with Framer Motion

## [0.5.0] - 2025-08-21

### Added
- Group diagnosis mode
- Prairie Card input component
- Profile validation with Zod
- Custom hooks for diagnosis flow

## [0.4.0] - 2025-08-20

### Added
- Duo diagnosis mode implementation
- API middleware for logging and error handling
- Environment variable validation
- Test infrastructure with Jest

## [0.3.0] - 2025-08-19

### Added
- Basic UI components
- Dark theme implementation
- Tailwind CSS 4.0 integration
- Responsive design

## [0.2.0] - 2025-08-18

### Added
- Next.js 15.5.0 project setup
- TypeScript configuration
- ESLint and Prettier setup
- GitHub repository initialization

## [0.1.0] - 2025-08-17

### Added
- Initial project planning
- Technical stack decision
- Architecture design
- CloudNative Days Winter 2025 event preparation

---

## Version History

- **1.0.0**: Production release for CloudNative Days Winter 2025
- **0.9.0**: Performance and monitoring improvements
- **0.8.0**: Security hardening
- **0.7.0**: OpenAI integration
- **0.6.0**: Result page and sharing
- **0.5.0**: Group diagnosis feature
- **0.4.0**: Duo diagnosis feature
- **0.3.0**: UI implementation
- **0.2.0**: Project setup
- **0.1.0**: Initial planning