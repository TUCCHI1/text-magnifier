# Contributing

## Development Workflow

This project uses **Trunk-Based Development** with automated releases.

### Branch Strategy

- **main** - The only long-lived branch. All development happens here.
- Feature branches are short-lived and merged via Pull Request.

### Pull Request Process

1. Fork the repository (external contributors)
2. Create a feature branch from `main`
3. Make your changes following the commit message format below
4. Open a Pull Request to `main`
5. Wait for CI checks to pass (required: `check`, `build`, `test`)
6. Request review if needed

### CI/CD Pipeline

All Pull Requests must pass these checks before merging:

| Check   | Description                                |
| ------- | ------------------------------------------ |
| `check` | TypeScript type checking, ESLint, Prettier |
| `build` | Production build verification              |
| `test`  | Playwright E2E tests                       |

### Pre-commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged) for pre-commit validation:

- **TypeScript files**: `eslint --fix` → `prettier --write`
- **Other files** (JSON, MD, YAML, HTML, CSS): `prettier --write`

Setup (automatic on `npm install`):

```bash
npm install  # Husky hooks are installed automatically via "prepare" script
```

### Release Process

Releases are automated using [release-please](https://github.com/googleapis/release-please):

1. Commits to `main` are analyzed for version bumps
2. A Release PR is automatically created/updated
3. When the Release PR is merged, a new GitHub Release is created
4. Release schedule: Daily at 09:00 JST (if there are changes)

---

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>: <subject>
```

### Types

| Type       | Description                 | Version Bump |
| ---------- | --------------------------- | ------------ |
| `feat`     | New feature                 | minor        |
| `fix`      | Bug fix                     | patch        |
| `docs`     | Documentation only          | -            |
| `style`    | Formatting (no code change) | -            |
| `refactor` | Code refactoring            | -            |
| `perf`     | Performance improvement     | patch        |
| `test`     | Adding/updating tests       | -            |
| `build`    | Build system changes        | -            |
| `ci`       | CI configuration            | -            |
| `chore`    | Other changes               | -            |
| `revert`   | Revert a commit             | -            |

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

Commit messages are validated automatically by [commitlint](https://commitlint.js.org/).
Invalid commits will be rejected by the pre-commit hook.

---

## Dependency Updates

Dependencies are automatically updated by [Dependabot](https://docs.github.com/en/code-security/dependabot):

- **Patch/Minor updates**: Auto-merged after CI passes
- **Major updates**: Require manual review
