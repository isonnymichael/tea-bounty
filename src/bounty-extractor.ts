/**
 * Extracts bounty amount from linked issue
 * 
 * This module handles extracting the TEA reward amount from the issue
 * that is linked to the PR using the "Closes #X" pattern.
 */

import * as github from '@actions/github';
import * as core from '@actions/core';

/**
 * Extracts the bounty amount from issue body
 * @param issueBody - The issue body text
 * @returns The bounty amount as a number
 * @throws Error if bounty amount is not found or invalid
 */
export function extractBountyFromIssueBody(issueBody: string | null | undefined): number | null {
    if (!issueBody) {
        return null;
    }

    // Pattern: "tea-reward: X" (case-insensitive, flexible whitespace)
    const pattern = /tea-reward\s*:\s*(\d+(?:\.\d+)?)/i;
    const match = issueBody.match(pattern);

    if (!match) {
        return null;
    }

    const amount = parseFloat(match[1]);

    // Validate the extracted amount
    if (isNaN(amount) || amount <= 0) {
        throw new Error(
            `❌ Invalid bounty amount in issue: ${match[1]}. Amount must be a positive number.`
        );
    }

    return amount;
}

/**
 * Gets the linked issue number from PR body
 * @param prBody - The PR body text
 * @returns The issue number or null if not found
 */
export function getLinkedIssueNumber(prBody: string | null | undefined): number | null {
    if (!prBody) {
        return null;
    }

    // Pattern: "Closes #123", "Fixes #123", "Resolves #123" (case-insensitive)
    const patterns = [
        /closes\s+#(\d+)/i,
        /fixes\s+#(\d+)/i,
        /resolves\s+#(\d+)/i,
        /close\s+#(\d+)/i,
        /fix\s+#(\d+)/i,
        /resolve\s+#(\d+)/i,
    ];

    for (const pattern of patterns) {
        const match = prBody.match(pattern);
        if (match) {
            return parseInt(match[1], 10);
        }
    }

    return null;
}

/**
 * Gets the bounty amount from the linked issue
 * @param octokit - GitHub API client
 * @param prBody - Pull request body
 * @returns The bounty amount or null if not found
 */
export async function getBountyAmountFromIssue(
    octokit: ReturnType<typeof github.getOctokit>,
    prBody: string | null | undefined
): Promise<number | null> {
    // Get linked issue number from PR body
    const issueNumber = getLinkedIssueNumber(prBody);

    if (!issueNumber) {
        core.info('ℹ️  No linked issue found in PR body (no "Closes #X" pattern)');
        return null;
    }

    core.info(`🔗 Found linked issue: #${issueNumber}`);

    try {
        // Fetch the issue
        const { context } = github;
        const { data: issue } = await octokit.rest.issues.get({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: issueNumber,
        });

        core.info(`📄 Fetched issue #${issueNumber}: "${issue.title}"`);

        // Extract bounty amount from issue body
        const bountyAmount = extractBountyFromIssueBody(issue.body);

        if (bountyAmount) {
            core.info(`💰 Found bounty amount in issue: ${bountyAmount} TEA`);
        } else {
            core.info('ℹ️  No bounty amount found in issue body (no "tea-reward: X" pattern)');
        }

        return bountyAmount;
    } catch (error) {
        if (error instanceof Error) {
            core.warning(`⚠️  Failed to fetch issue #${issueNumber}: ${error.message}`);
        }
        return null;
    }
}
