# 🍵 TEA Bounty Action

A minimal, opt-in GitHub Action that automatically sends TEA token rewards when Pull Requests are merged.

> [!WARNING]
> **This is NOT a trustless platform.** This action uses a hot wallet approach and is designed ONLY for trusted repositories. Read [SECURITY.md](SECURITY.md) before using.

## Features

✅ **Dynamic bounty amounts** - Extract reward amounts from linked issues  
✅ Automatically sends TEA tokens when PRs are merged  
✅ Anti-double-payout protection (checks labels + comments)  
✅ Configurable reward amounts with hard cap (default: 1,000 TEA)  
✅ Clear error messages and fail-safe design  
✅ No backend, no database - pure GitHub Action

## Quick Start

### 1. Add GitHub Secrets

In your repository settings, add these secrets:

- `TEA_PRIVATE_KEY` - Private key of your hot wallet (⚠️ use a wallet with LIMITED balance)
- `RPC_URL` - Tea Protocol RPC URL
- `BLOCK_EXPLORER_URL` - (Optional) Block explorer URL for transaction links

### 2. Create Workflow File

Create `.github/workflows/tea-bounty.yml`:

```yaml
name: TEA Bounty Rewards

on:
  pull_request:
    types: [closed]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  send-reward:
    # Only run if PR was actually merged
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    
    steps:
      - name: Send TEA Reward
        uses: isonnymichael/tea-bounty@v1
        with:
          rpc_url: ${{ secrets.RPC_URL }}
          target_branch: 'master'
          max_reward_cap: '1000'
          block_explorer_url: ${{ secrets.BLOCK_EXPLORER_URL }} # Optional
        env:
          TEA_PRIVATE_KEY: ${{ secrets.TEA_PRIVATE_KEY }}
```

### 3. Create Issue with Bounty

Create an issue and specify the bounty amount in the description:

```markdown
## Issue
Fix login bug

tea-reward: 75
```

The pattern is case-insensitive: `tea-reward: X` where X is the amount in TEA tokens.

### 4. Contributors Create PR

Contributors must:
1. Link the issue using `Closes #X`, `Fixes #X`, or `Resolves #X` in the PR description
2. Add their wallet address in the PR description

```markdown
## PR Description
Fix login bug

Closes #42

TEA Wallet: 0xABC1234567890123456789012345678901234567
```

## Configuration

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `tea_amount` | No | - | Fallback amount if no bounty in linked issue |
| `rpc_url` | ✅ Yes | - | Tea Protocol RPC URL |
| `target_branch` | No | `master` | Only reward PRs merged into this branch |
| `max_reward_cap` | No | `1000` | Maximum allowed reward (safety limit) |
| `block_explorer_url` | No | - | Block explorer URL for transaction links |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TEA_PRIVATE_KEY` | ✅ Yes | Private key of hot wallet (from GitHub Secrets) |
| `RPC_URL` | ✅ Yes | Tea Protocol RPC URL (from GitHub Secrets) |
| `BLOCK_EXPLORER_URL` | No | Block explorer URL for transaction links (from GitHub Secrets) |

## How It Works

1. **Trigger**: Action runs when a PR is closed
2. **Validation**: Checks if PR was merged (not just closed) and targets the correct branch
3. **Bounty Extraction**: Extracts bounty amount from linked issue's `tea-reward: X` pattern
4. **Wallet Extraction**: Extracts wallet address from PR body using pattern `TEA Wallet: 0x...`
5. **Double-Payout Check**: Verifies PR doesn't have `tea-paid` label or reward comment
6. **Transfer**: Sends TEA tokens using ethers.js
7. **Confirmation**: Posts comment with transaction hash and adds `tea-paid` label

## Security Model

> [!CAUTION]
> **Read [SECURITY.md](SECURITY.md) for full details.**

This action is designed for **trusted repositories only**:

- Uses a hot wallet (private key in GitHub Secrets)
- No trustless verification
- Best-effort security, not production-grade
- Recommended: Use a dedicated wallet with limited balance

## Anti-Double-Payout

The action prevents double payments by checking:

1. ✅ Does the PR have a `tea-paid` label?
2. ✅ Does any comment contain `TEA_REWARD_SENT` marker?

If either check passes, the action exits safely without sending tokens.

## Error Handling

The action fails safely with clear error messages:

- ❌ No wallet address in PR body
- ❌ Invalid Ethereum address format
- ❌ Reward amount exceeds hard cap
- ❌ Insufficient token balance
- ❌ Insufficient ETH for gas fees
- ❌ PR already rewarded

## Outputs

| Output | Description |
|--------|-------------|
| `tx_hash` | Transaction hash of the token transfer |
| `amount` | Amount sent (e.g., "100 TEA") |
| `recipient` | Recipient wallet address |

## Example PR Comment

After successful transfer, the action posts:

```
## ✅ TEA Reward Sent! 🎉

**Amount:** 100 TEA  
**Transaction:** 0xabc123...

Thank you for your contribution! 🙏
```

## Limitations

- ⚠️ **Not for public bounty platforms** - Designed for trusted repos only
- ⚠️ **Hot wallet security** - Private key stored in GitHub Secrets
- ⚠️ **No retry logic** - Fails safely to prevent double payments
- ⚠️ **Manual wallet address** - Contributors must add address to PR body
- ⚠️ **Tea Protocol only** - Sends native TEA tokens on the Tea Protocol blockchain

## Development

### Build

```bash
npm install
npm run build
```

This compiles TypeScript and bundles into `dist/index.js` using `@vercel/ncc`.

### Local Testing

Since this is a GitHub Action, full testing requires:

1. A test repository with PR workflow
2. A test wallet with TEA tokens
3. GitHub Secrets configured

See [SECURITY.md](SECURITY.md) for testing recommendations.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add your wallet address to PR body: `TEA Wallet: 0x...`
4. Submit a PR

## License

MIT

## Disclaimer

This software is provided "as is" without warranty. Use at your own risk. The authors are not responsible for lost funds, security breaches, or any other issues arising from use of this action.

---

**Made with 🍵 for the TEA community**
