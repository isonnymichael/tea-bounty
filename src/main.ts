/**
 * TEA Bounty GitHub Action - Main Entry Point
 * 
 * This action sends TEA token rewards when a PR is merged.
 * 
 * SECURITY WARNING: This is a "best-effort" security model using a hot wallet.
 * Only use in trusted repositories with a limited-balance wallet.
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import { extractWalletAddress } from './wallet';
import { hasAlreadyBeenPaid } from './anti-double-payout';
import { sendTeaTokens } from './transfer';
import { postRewardComment, addPaidLabel } from './github-integration';
import { getBountyAmountFromIssue } from './bounty-extractor';

async function run(): Promise<void> {
    try {
        // ========================================
        // 1. VALIDATE TRIGGER CONDITIONS
        // ========================================

        const { context } = github;

        // Ensure this is a pull_request event
        if (context.eventName !== 'pull_request') {
            core.setFailed(`❌ This action only runs on pull_request events. Current event: ${context.eventName}`);
            return;
        }

        const payload = context.payload;
        const pr = payload.pull_request;

        if (!pr) {
            core.setFailed('❌ No pull request found in event payload');
            return;
        }

        // Check if PR was merged
        if (!pr.merged) {
            core.info('ℹ️  PR was closed but not merged. Skipping reward.');
            return;
        }

        // Check target branch
        const targetBranch = core.getInput('target_branch') || 'main';
        if (pr.base.ref !== targetBranch) {
            core.info(`ℹ️  PR was merged into '${pr.base.ref}', not '${targetBranch}'. Skipping reward.`);
            return;
        }

        const prNumber = pr.number;
        core.info(`✅ PR #${prNumber} was merged into ${targetBranch}`);

        // ========================================
        // 2. GET INPUTS AND VALIDATE
        // ========================================

        const rpcUrl = core.getInput('rpc_url', { required: true });
        const maxRewardCap = parseFloat(core.getInput('max_reward_cap') || '1000');
        const fallbackAmount = core.getInput('tea_amount'); // Optional fallback

        // Get private key from environment (GitHub Secret)
        const privateKey = process.env.TEA_PRIVATE_KEY;
        if (!privateKey) {
            core.setFailed('❌ TEA_PRIVATE_KEY environment variable not set. Please add it to GitHub Secrets.');
            return;
        }

        // ========================================
        // 3. GET GITHUB TOKEN AND OCTOKIT
        // ========================================

        const token = process.env.GITHUB_TOKEN || core.getInput('github_token');
        if (!token) {
            core.setFailed('❌ GITHUB_TOKEN not found. This should be automatically provided by GitHub Actions.');
            return;
        }

        const octokit = github.getOctokit(token);

        // ========================================
        // 4. EXTRACT BOUNTY AMOUNT FROM ISSUE
        // ========================================

        let teaAmount: number | null = await getBountyAmountFromIssue(octokit, pr.body);

        // If no bounty found in issue, use fallback from input
        if (teaAmount === null) {
            if (fallbackAmount) {
                teaAmount = parseFloat(fallbackAmount);
                core.info(`ℹ️  Using fallback amount from workflow input: ${teaAmount} TEA`);
            } else {
                core.setFailed(
                    '❌ No bounty amount found. Please either:\n' +
                    '   1. Add "tea-reward: X" to the linked issue body, OR\n' +
                    '   2. Set the "tea_amount" input in your workflow file'
                );
                return;
            }
        }

        // Validate amount
        if (isNaN(teaAmount) || teaAmount <= 0) {
            core.setFailed(`❌ Invalid bounty amount: ${teaAmount}. Must be a positive number.`);
            return;
        }

        // Enforce hard cap
        if (teaAmount > maxRewardCap) {
            core.setFailed(
                `❌ Reward amount ${teaAmount} exceeds maximum allowed cap of ${maxRewardCap} TEA. ` +
                `This is a safety limit to prevent accidental large transfers.`
            );
            return;
        }

        core.info(`💰 Reward amount: ${teaAmount} TEA (max cap: ${maxRewardCap})`);

        // ========================================
        // 5. EXTRACT AND VALIDATE WALLET ADDRESS
        // ========================================

        const walletAddress = extractWalletAddress(pr.body);
        core.info(`📍 Recipient wallet: ${walletAddress}`);

        // ========================================
        // 6. CHECK FOR DOUBLE PAYOUT
        // ========================================

        const alreadyPaid = await hasAlreadyBeenPaid(octokit, prNumber);
        if (alreadyPaid) {
            core.info('✋ This PR has already been rewarded. Skipping to prevent double payout.');
            return;
        }

        // ========================================
        // 7. SEND TEA TOKENS
        // ========================================

        core.info('🚀 Initiating token transfer...');

        const result = await sendTeaTokens(
            privateKey,
            rpcUrl,
            walletAddress,
            teaAmount
        );

        core.info(`✅ Transfer successful!`);
        core.info(`   TX Hash: ${result.txHash}`);
        core.info(`   Amount: ${result.amount}`);
        core.info(`   Recipient: ${result.recipient}`);

        // ========================================
        // 8. POST COMMENT AND ADD LABEL
        // ========================================

        // Optionally get block explorer URL from input
        const explorerUrl = core.getInput('block_explorer_url') || undefined;

        await postRewardComment(
            octokit,
            prNumber,
            result.amount,
            result.txHash,
            explorerUrl
        );

        await addPaidLabel(octokit, prNumber);

        // ========================================
        // 9. SET OUTPUTS
        // ========================================

        core.setOutput('tx_hash', result.txHash);
        core.setOutput('amount', result.amount);
        core.setOutput('recipient', result.recipient);

        core.info('🎉 TEA bounty reward sent successfully!');

    } catch (error) {
        // Fail the action with a clear error message
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed(`❌ Unknown error: ${String(error)}`);
        }
    }
}

// Run the action
run();
