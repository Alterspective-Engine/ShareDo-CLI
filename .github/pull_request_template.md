## Description
<!-- Describe your changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Claude Code Build Checklist
**Run these in GitHub Codespaces with Claude Code:**

### Pre-Push Checklist
- [ ] Open in Codespaces
- [ ] Ask Claude: `Check my changes build correctly`
- [ ] Ask Claude: `Run all tests and fix any failures`
- [ ] Ask Claude: `Fix any TypeScript errors`
- [ ] Ask Claude: `Check for code quality issues`

### Build Verification
```
# Ask Claude to run:
npm run build:all
npm run test:all
npm run lint:all
npm run typecheck:all
```

### If Build Fails
1. Copy error from GitHub Actions
2. Open in Codespaces
3. Tell Claude: `Fix this build error: [paste error]`
4. Push Claude's fixes

## Testing
- [ ] Tested locally
- [ ] Claude verified build passes
- [ ] All tests passing

## Notes for Reviewers
<!-- Any additional context -->

---
💡 **Tip**: Open this PR in GitHub Codespaces and use Claude Code (Ctrl+Shift+L) for automated assistance!