# GitHub Actions Setup Instructions

## Prerequisites

### 1. Set up ANTHROPIC_API_KEY Secret

To enable Claude Code integration in GitHub Actions:

1. Go to your repository on GitHub: https://github.com/Alterspective-Engine/ShareDo-CLI
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key
5. Click **Add secret**

### 2. Install Claude GitHub App (Optional)

For enhanced integration:
1. Visit https://github.com/apps/claude-code
2. Click **Install**
3. Select your repository

## Using Claude in PRs

Once set up, you can interact with Claude in:

### Pull Request Comments
```
@claude review this PR and suggest improvements
@claude fix the TypeScript errors in this PR
@claude add tests for the new functionality
```

### Issue Comments
```
@claude implement the feature described in this issue
@claude create a PR that fixes this bug
```

## Workflow Triggers

### Automatic Builds
- **On push to main/develop**: Full build and test
- **On PR creation/update**: Validation and checks
- **Manual trigger**: Use "Run workflow" in Actions tab

### Claude Assistance
- **On PR/issue comment**: When `@claude` is mentioned
- **Maximum 5 turns**: Configurable in workflow
- **300 second timeout**: Prevents runaway sessions

## Build Status Badges

Add these to your README.md:

```markdown
[![Build and Test](https://github.com/Alterspective-Engine/ShareDo-CLI/actions/workflows/build.yml/badge.svg)](https://github.com/Alterspective-Engine/ShareDo-CLI/actions/workflows/build.yml)
[![PR Validation](https://github.com/Alterspective-Engine/ShareDo-CLI/actions/workflows/pr-validation.yml/badge.svg)](https://github.com/Alterspective-Engine/ShareDo-CLI/actions/workflows/pr-validation.yml)
```

## Local Testing

Test workflows locally with [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or
choco install act  # Windows

# Test build workflow
act -W .github/workflows/build.yml

# Test PR workflow
act pull_request -W .github/workflows/pr-validation.yml
```

## Troubleshooting

### Build Failures
- Check Node version (requires 18+)
- Ensure all dependencies are installed: `npm ci`
- Run locally first: `npm run build:all`

### Claude Not Responding
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check workflow runs in Actions tab
- Ensure comment contains `@claude`

### Permission Issues
- Repository needs Actions enabled
- Secrets need proper permissions
- Claude app needs repository access

## Cost Management

### GitHub Actions Minutes
- Free tier: 2,000 minutes/month (private repos)
- Unlimited for public repos
- Monitor usage in Settings → Billing

### Anthropic API Usage
- Each Claude interaction uses API tokens
- Monitor usage at https://console.anthropic.com
- Set spending limits if needed

## Support

For issues:
- GitHub Actions: Check [Actions documentation](https://docs.github.com/actions)
- Claude Code: Visit [Claude Code docs](https://docs.anthropic.com/claude-code)
- Repository issues: Create an issue in the repo