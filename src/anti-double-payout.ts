/**
 * Anti-double-payout logic to prevent sending rewards multiple times.
 * 
 * Security Note: This checks both labels and comments to ensure idempotency.
 * If either check passes, the action will exit safely without sending tokens.
 */

import { context } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';

type Octokit = InstanceType<typeof GitHub>;

const PAID_LABEL = 'tea-paid';
const REWARD_SENT_MARKER = 'TEA_REWARD_SENT';

/**
 * Checks if the PR has already been paid
 * @param octokit - GitHub API client
 * @param prNumber - Pull request number
 * @returns true if already paid, false otherwise
 */
export async function hasAlreadyBeenPaid(
    octokit: Octokit,
    prNumber: number
): Promise<boolean> {
    const { owner, repo } = context.repo;

    // Check 1: Does the PR have the 'tea-paid' label?
    const { data: pr } = await octokit.rest.issues.get({
        owner,
        repo,
        issue_number: prNumber,
    });

    const hasLabel = pr.labels.some(
        (label) => typeof label === 'string' ? label === PAID_LABEL : label.name === PAID_LABEL
    );

    if (hasLabel) {
        return true;
    }

    // Check 2: Does any comment contain the TEA_REWARD_SENT marker?
    const { data: comments } = await octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: prNumber,
    });

    const hasRewardComment = comments.some((comment) =>
        comment.body?.includes(REWARD_SENT_MARKER)
    );

    return hasRewardComment;
}
