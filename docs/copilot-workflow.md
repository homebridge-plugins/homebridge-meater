# GitHub Copilot Beta Branch Workflow

This document explains the new workflow implemented for GitHub Copilot to ensure proper semantic versioning and beta branch targeting.

## Overview

All GitHub Copilot-generated PRs now target beta branches instead of the main branch, ensuring a proper review and testing process before merging to production.

## Workflow Changes

### 1. Issue Labeling (Required Before Copilot Assignment)

Before assigning any issue to GitHub Copilot, **one of these labels must be applied**:

- `patch` - Bug fixes (2.0.2 → 2.0.3)
- `minor` - New features (2.0.2 → 2.1.0)  
- `major` - Breaking changes (2.0.2 → 3.0.0)

### 2. Automatic Beta Branch Targeting

GitHub Copilot will now:

1. Check the issue label to determine version increment
2. Calculate the target version based on current package.json version
3. Look for an existing `beta-{version}` branch
4. Create the beta branch if it doesn't exist
5. Target the PR to the beta branch
6. Update package.json to the target version

### 3. Issue Templates Updated

Issue templates have been updated to automatically apply appropriate labels:

- **Bug Report** → `patch` label
- **Feature Request** → `minor` label  
- **Breaking Change Request** → `major` label

## Beta Branch Management

### Creating Beta Branches Manually

If you need to create a beta branch manually:

```bash
# For patch release
git checkout latest
git pull origin latest  
git checkout -b beta-2.0.3
git push origin beta-2.0.3

# For minor release
git checkout latest
git pull origin latest
git checkout -b beta-2.1.0
git push origin beta-2.1.0

# For major release
git checkout latest
git pull origin latest
git checkout -b beta-3.0.0
git push origin beta-3.0.0
```

### Merging Beta Branches

After testing and review, beta branches should be merged to `latest`:

```bash
git checkout latest
git pull origin latest
git merge beta-2.0.3
git push origin latest
git tag v2.0.3
git push origin v2.0.3
```

## Files Added/Modified

- `.github/copilot-instructions.md` - Main Copilot instructions
- `.github/ISSUE_TEMPLATE/bug-report.yml` - Updated to use `patch` label
- `.github/ISSUE_TEMPLATE/feature-request.yml` - Updated to use `minor` label
- `.github/ISSUE_TEMPLATE/breaking-change.yml` - New template for `major` changes
- `.github/pull_request_template.md` - New PR template with beta branch requirements
- `docs/copilot-workflow.md` - This documentation file

## Benefits

1. **Proper Semantic Versioning**: Automatic version management based on change type
2. **Beta Testing**: Changes go through beta branches for testing before production
3. **Clear Process**: Standardized workflow for all contributors
4. **Automated Branch Management**: Reduces manual branch creation and targeting errors

## Troubleshooting

### Issue has no version label

If Copilot encounters an issue without a required label:
1. The maintainer should add the appropriate label (`patch`, `minor`, or `major`)
2. Then assign the issue to Copilot

### Beta branch already exists

If a beta branch already exists for the target version:
- Copilot will target the existing branch
- Multiple PRs can target the same beta branch

### Version conflicts

If there are version conflicts, the maintainer should:
1. Resolve the conflict manually
2. Update the issue label if needed
3. Re-assign to Copilot if necessary