/**
 * TEA token transfer logic using ethers.js
 * 
 * TEA is the NATIVE token of the Tea Protocol blockchain (like ETH on Ethereum).
 * This means we send it using native value transfers, not ERC-20 contract calls.
 * 
 * Security Note: This uses a hot wallet approach. The private key should be
 * stored in GitHub Secrets and the wallet should have a LIMITED balance.
 * This is NOT a trustless system.
 */

import { ethers } from 'ethers';

export interface TransferResult {
    txHash: string;
    amount: string;
    recipient: string;
}

/**
 * Sends TEA tokens (native token) to the specified address
 * @param privateKey - Wallet private key (from GitHub Secrets)
 * @param rpcUrl - Tea Protocol RPC URL
 * @param recipientAddress - Address to send tokens to
 * @param amount - Amount of TEA tokens to send (in whole units, not wei)
 * @returns Transaction hash and details
 */
export async function sendTeaTokens(
    privateKey: string,
    rpcUrl: string,
    recipientAddress: string,
    amount: number
): Promise<TransferResult> {
    // Validate inputs
    if (!privateKey || privateKey.length === 0) {
        throw new Error('❌ Private key is required (TEA_PRIVATE_KEY secret not set)');
    }

    if (!rpcUrl || rpcUrl.length === 0) {
        throw new Error('❌ RPC URL is required');
    }

    if (!ethers.isAddress(recipientAddress)) {
        throw new Error(`❌ Invalid recipient address: ${recipientAddress}`);
    }

    if (amount <= 0) {
        throw new Error(`❌ Amount must be positive, got: ${amount}`);
    }

    try {
        // Connect to Tea Protocol provider
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // Create wallet instance
        const wallet = new ethers.Wallet(privateKey, provider);

        // TEA uses 18 decimals (standard for native tokens)
        const decimals = 18;
        const symbol = 'TEA';

        console.log(`📊 Token: ${symbol}, Decimals: ${decimals}`);

        // Convert amount to wei (smallest unit)
        const amountInWei = ethers.parseUnits(amount.toString(), decimals);

        console.log(`💰 Sending ${amount} ${symbol} to ${recipientAddress}`);
        console.log(`   Amount in wei: ${amountInWei.toString()}`);

        // Check wallet balance before sending
        const balance = await provider.getBalance(wallet.address);
        console.log(`   Wallet balance: ${ethers.formatUnits(balance, decimals)} ${symbol}`);

        if (balance < amountInWei) {
            throw new Error(
                `❌ Insufficient balance. Wallet has ${ethers.formatUnits(balance, decimals)} ${symbol}, but trying to send ${amount} ${symbol}`
            );
        }

        // Execute native token transfer
        const tx = await wallet.sendTransaction({
            to: recipientAddress,
            value: amountInWei,
        });

        console.log(`⏳ Transaction submitted: ${tx.hash}`);
        console.log(`   Waiting for confirmation...`);

        // Wait for transaction confirmation
        const receipt = await tx.wait();

        if (!receipt || receipt.status !== 1) {
            throw new Error('❌ Transaction failed');
        }

        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

        return {
            txHash: tx.hash,
            amount: `${amount} ${symbol}`,
            recipient: recipientAddress,
        };
    } catch (error) {
        if (error instanceof Error) {
            // Enhance error messages
            if (error.message.includes('insufficient funds')) {
                throw new Error(
                    '❌ Insufficient TEA balance. Please fund the hot wallet with TEA tokens.'
                );
            }
            throw error;
        }
        throw new Error(`❌ Unknown error during token transfer: ${String(error)}`);
    }
}
