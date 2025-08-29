# GitHub Copilot Instructions for homebridge-meater

## Branch Targeting Strategy

All pull requests created by GitHub Copilot **MUST** target a branch that starts with `beta-` first, never directly to the main branch (`latest`).

### Beta Branch Creation and Targeting

1. **Check for existing beta branch**: Before creating a PR, check if a beta branch exists for the target version
2. **Create beta branch if needed**: If no appropriate beta branch exists, create one based on the next semantic version
3. **Target the beta branch**: All PRs must target the beta branch, not the main branch

### Beta Branch Naming Convention

Beta branches should follow this naming pattern: `beta-{version}`

Examples:
- `beta-2.0.3` (for patch releases)
- `beta-2.1.0` (for minor releases) 
- `beta-3.0.0` (for major releases)

## Semantic Versioning and Labels

**IMPORTANT**: Labels must be set on the issue before assigning to GitHub Copilot.

### Required Labels

One of the following labels **MUST** be present on the issue:

- `patch` - For bug fixes (increments patch version: 2.0.2 → 2.0.3)
- `minor` - For new features (increments minor version: 2.0.2 → 2.1.0)  
- `major` - For breaking changes (increments major version: 2.0.2 → 3.0.0)

### Version Increment Logic

Based on current version `2.0.2`:

| Label | Next Version | Beta Branch |
|-------|-------------|-------------|
| `patch` | `2.0.3` | `beta-2.0.3` |
| `minor` | `2.1.0` | `beta-2.1.0` |
| `major` | `3.0.0` | `beta-3.0.0` |

## Workflow for GitHub Copilot

1. **Verify label exists**: Ensure the issue has one of: `patch`, `minor`, or `major` labels
2. **Determine target version**: Based on the label and current version (from package.json)
3. **Check for beta branch**: Look for existing `beta-{target-version}` branch
4. **Create beta branch if needed**: 
   - Base it on the `latest` branch
   - Name it `beta-{target-version}`
5. **Create PR targeting beta branch**: All changes should target the beta branch
6. **Update package.json version**: Update version in package.json to match the target version (without beta suffix)

## Beta Branch Creation Steps

If creating a new beta branch:

```bash
# Example for patch release (2.0.2 → 2.0.3)
git checkout latest
git pull origin latest
git checkout -b beta-2.0.3
git push origin beta-2.0.3
```

## PR Guidelines

- **Title**: Should clearly indicate the change type and reference the issue
- **Description**: Should reference the original issue and explain changes
- **Target**: Must target the appropriate `beta-{version}` branch
- **Version**: package.json version should be updated to match target version

## Example Workflow

For an issue labeled `patch` (bug fix):

1. Current version: `2.0.2`
2. Target version: `2.0.3` 
3. Target branch: `beta-2.0.3`
4. If `beta-2.0.3` doesn't exist, create it from `latest`
5. Create PR targeting `beta-2.0.3`
6. Update package.json version to `2.0.3`

## Error Prevention

- ❌ **Never target `latest` branch directly**
- ❌ **Never proceed without required labels**
- ❌ **Never create PR without beta branch**
- ✅ **Always verify labels first**
- ✅ **Always target beta branches**
- ✅ **Always update package.json version**

## Label Requirements Validation

Before starting work, GitHub Copilot should validate:

```
IF issue has no label (patch|minor|major) THEN
  STOP and request maintainer to add appropriate label
ELSE
  PROCEED with beta branch targeting
```

This ensures proper semantic versioning and prevents targeting the wrong branch.