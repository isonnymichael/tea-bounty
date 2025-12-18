/**
 * GitHub integration for posting comments and adding labels
 */

import { context } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

type Octokit = InstanceType<typeof GitHub>;

const PAID_LABEL = 'tea-paid';
const REWARD_SENT_MARKER = 'TEA_REWARD_SENT';

/**
 * Posts a success comment on the PR
 * @param octokit - GitHub API client
 * @param prNumber - Pull request number
 * @param amount - Amount sent (e.g., "100 TEA")
 * @param txHash - Transaction hash
 * @param explorerUrl - Optional block explorer URL
 */
export async function postRewardComment(
    octokit: Octokit,
    prNumber: number,
    amount: string,
    txHash: string,
    explorerUrl?: string
): Promise<void> {
    const { owner, repo } = context.repo;

    const txLink = explorerUrl
        ? `[${txHash}](${explorerUrl}/tx/${txHash})`
        : `\`${txHash}\``;

    const commentBody = `## ✅ TEA Reward Sent! 🎉

**Amount:** ${amount}  
**Transaction:** ${txLink}

Thank you for your contribution! 🙏

---
<!-- ${REWARD_SENT_MARKER} -->`;

    await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: commentBody,
    });

    console.log(`✅ Posted reward comment on PR #${prNumber}`);
}

/**
 * Adds the 'tea-paid' label to the PR
 * @param octokit - GitHub API client
 * @param prNumber - Pull request number
 */
export async function addPaidLabel(
    octokit: Octokit,
    prNumber: number
): Promise<void> {
    const { owner, repo } = context.repo;

    // First, ensure the label exists in the repository
    try {
        await octokit.rest.issues.getLabel({
            owner,
            repo,
            name: PAID_LABEL,
        });
    } catch (error) {
        // Label doesn't exist, create it
        console.log(`Creating '${PAID_LABEL}' label...`);
        await octokit.rest.issues.createLabel({
            owner,
            repo,
            name: PAID_LABEL,
            color: '00ff00', // Green
            description: 'TEA bounty reward has been paid',
        });
    }

    // Add the label to the PR
    await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: prNumber,
        labels: [PAID_LABEL],
    });

    console.log(`✅ Added '${PAID_LABEL}' label to PR #${prNumber}`);
}
