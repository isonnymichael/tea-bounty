/**
 * Extracts and validates the TEA wallet address from a PR body.
 * 
 * Security Note: This uses a strict pattern match to ensure only valid
 * Ethereum addresses are accepted. The pattern requires "TEA Wallet: 0x..."
 * to be present in the PR body.
 */

/**
 * Validates if a string is a valid Ethereum address
 * @param address - The address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEthereumAddress(address: string): boolean {
    // Must be 42 characters (0x + 40 hex chars)
    if (address.length !== 42) {
        return false;
    }

    // Must start with 0x
    if (!address.startsWith('0x')) {
        return false;
    }

    // Must contain only hex characters after 0x
    const hexPart = address.slice(2);
    return /^[0-9a-fA-F]{40}$/.test(hexPart);
}

/**
 * Extracts the TEA wallet address from PR body
 * @param prBody - The PR body text
 * @returns The validated wallet address
 * @throws Error if wallet address is not found or invalid
 */
export function extractWalletAddress(prBody: string | null | undefined): string {
    if (!prBody) {
        throw new Error(
            '❌ No PR body found. Please add your wallet address to the PR description using the format: "TEA Wallet: 0x..."'
        );
    }

    // Pattern: "TEA Wallet: 0x..." (case-insensitive, flexible whitespace)
    const pattern = /TEA\s+Wallet\s*:\s*(0x[0-9a-fA-F]{40})/i;
    const match = prBody.match(pattern);

    if (!match) {
        throw new Error(
            '❌ No TEA wallet address found in PR body. Please add it using the format: "TEA Wallet: 0x..."'
        );
    }

    const address = match[1];

    // Validate the extracted address
    if (!isValidEthereumAddress(address)) {
        throw new Error(
            `❌ Invalid Ethereum address format: ${address}. Address must be 42 characters starting with 0x.`
        );
    }

    return address;
}
