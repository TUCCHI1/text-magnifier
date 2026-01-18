# Contributing

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>: <subject>
```

### Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | minor |
| `fix` | Bug fix | patch |
| `docs` | Documentation only | - |
| `style` | Formatting (no code change) | - |
| `refactor` | Code refactoring | - |
| `perf` | Performance improvement | patch |
| `test` | Adding/updating tests | - |
| `build` | Build system changes | - |
| `ci` | CI configuration | - |
| `chore` | Other changes | - |
| `revert` | Revert a commit | - |

### Breaking Changes

For breaking changes, add `!` after the type or include `BREAKING CHANGE:` in the footer:

```
feat!: Remove deprecated API

BREAKING CHANGE: The old API has been removed.
```

### Examples

```
feat: Add keyboard shortcut toggle
fix: Restore spotlight on re-enable
docs: Update installation instructions
refactor: Simplify storage handling
test: Add toggle restore test
ci: Add release-please automation
```

### Validation

Commit messages are validated automatically by commitlint.
Invalid commits will be rejected.
