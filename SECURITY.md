# Security Policy

## Security Model

> [!CAUTION]
> **This is NOT a trustless or production-grade security system.**

The TEA Bounty Action uses a **"best-effort" security model** designed for **trusted repositories only**. It is a library-level tool, not a secure platform.

## Threat Model

### What This Action DOES Provide

✅ Anti-double-payout protection (label + comment checks)  
✅ Hard cap on reward amounts (default: 1,000 TEA)  
✅ Wallet address validation  
✅ Fail-safe error handling (no retry loops)  
✅ Clear audit trail (comments + labels on PRs)

### What This Action DOES NOT Provide

❌ **Trustless security** - Uses a hot wallet with private key in GitHub Secrets  
❌ **Protection against malicious repo admins** - Anyone with Secrets access can extract the private key  
❌ **Protection against compromised GitHub accounts** - If an admin account is hacked, funds are at risk  
❌ **Replay attack protection** - Only basic label/comment checks  
❌ **Multi-signature security** - Single private key controls all funds  
❌ **Public bounty platform security** - Not designed for untrusted contributors

## Known Risks

### 1. Private Key Exposure

**Risk**: The private key is stored in GitHub Secrets. Anyone with repository admin access can view it.

**Mitigation**:
- ✅ Use a **dedicated hot wallet** with limited balance
- ✅ Only fund the wallet with the amount needed for near-term rewards
- ✅ Regularly rotate the wallet and update the secret
- ✅ Monitor wallet balance and transactions

### 2. Malicious Pull Requests

**Risk**: A malicious contributor could submit a PR with someone else's wallet address.

**Mitigation**:
- ✅ Only use in **trusted repositories** with known contributors
- ✅ Review PRs before merging (standard practice)
- ✅ The action only runs AFTER merge, so you control who gets rewarded

### 3. GitHub Actions Compromise

**Risk**: If GitHub Actions is compromised, the private key could be exposed.

**Mitigation**:
- ✅ Use a hot wallet with **limited balance** (e.g., only 10-20 rewards worth)
- ✅ Monitor wallet activity
- ✅ This is an inherent risk of any GitHub Actions-based secret management

### 4. Double Payout Attempts

**Risk**: Someone could try to trigger the action multiple times on the same PR.

**Mitigation**:
- ✅ Action checks for `tea-paid` label before sending
- ✅ Action checks for `TEA_REWARD_SENT` comment marker
- ✅ No retry logic to prevent accidental double sends
- ✅ If either check passes, action exits safely

### 5. Insufficient Gas Fees

**Risk**: The hot wallet runs out of ETH for gas fees.

**Mitigation**:
- ✅ Action checks wallet balance before transfer
- ✅ Clear error message if insufficient ETH
- ✅ Action fails safely without sending tokens

### 6. Smart Contract Vulnerabilities

**Risk**: The TEA token contract could have vulnerabilities.

**Mitigation**:
- ❌ This action does NOT audit the token contract
- ✅ Use well-audited ERC20 token contracts only
- ✅ Test with small amounts first

## Recommended Practices

### For Repository Owners

1. **Use a Dedicated Hot Wallet**
   - Create a new wallet specifically for this action
   - Never use your main wallet
   - Fund it with limited balance (e.g., 1,000-5,000 TEA)

2. **Limit Access to Secrets**
   - Only trusted admins should have access to repository secrets
   - Use GitHub's branch protection rules
   - Enable 2FA for all admin accounts

3. **Monitor Wallet Activity**
   - Set up alerts for wallet transactions
   - Regularly check the wallet balance
   - Review transaction history for anomalies

4. **Start Small**
   - Test with small reward amounts first
   - Gradually increase as you gain confidence
   - Monitor for issues

5. **Regular Rotation**
   - Rotate the hot wallet every few months
   - Update the `TEA_PRIVATE_KEY` secret
   - Transfer remaining balance to a secure wallet

### For Contributors

1. **Protect Your Wallet Address**
   - Only add your own wallet address to PRs
   - Double-check the address before submitting
   - Use a dedicated wallet for bounties (not your main wallet)

2. **Verify Transactions**
   - Check the transaction hash in the PR comment
   - Verify the amount received matches the reward
   - Report any discrepancies immediately

## Incident Response

### If Private Key is Compromised

1. **Immediately** transfer all remaining funds from the hot wallet to a secure wallet
2. Generate a new wallet and private key
3. Update the `TEA_PRIVATE_KEY` secret in GitHub
4. Review recent transactions for unauthorized activity
5. Notify contributors if any funds were stolen

### If Double Payout Occurs

1. Review the PR to understand what happened
2. Check if the anti-double-payout logic failed
3. Manually add the `tea-paid` label if missing
4. Report the issue to the action maintainers

### If Wrong Address is Paid

1. Contact the contributor who received the funds
2. Request they return the funds (if possible)
3. Review the PR to understand how the wrong address was used
4. Improve PR review process to catch errors

## Reporting Security Issues

If you discover a security vulnerability in this action:

1. **DO NOT** open a public issue
2. Email the maintainers directly (add your email here)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work on a fix.

## Disclaimer

This action is provided "as is" without warranty of any kind. By using this action, you acknowledge:

- You understand the security risks
- You accept full responsibility for any lost funds
- You will only use this in trusted repositories
- You will use a hot wallet with limited balance
- The authors are not liable for any damages

## Security Checklist

Before deploying this action, ensure:

- [ ] You have read and understood this security policy
- [ ] You are using a dedicated hot wallet with limited balance
- [ ] You have tested with small amounts first
- [ ] You have configured the `max_reward_cap` appropriately
- [ ] You have limited access to GitHub Secrets to trusted admins only
- [ ] You have set up wallet monitoring and alerts
- [ ] You understand this is NOT a trustless system
- [ ] You are only using this in a trusted repository

---

**Last Updated**: 2025-12-18

**Remember**: This is a convenience tool for trusted teams, not a secure bounty platform. Use accordingly.
