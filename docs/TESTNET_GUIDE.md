# Stellar Testnet Guide for AgriFlow

This guide explains how to configure your environment and test agricultural payments on Stellar Testnet.

## 1. Prerequisites

1. Install Google Chrome, Brave, or Mozilla Firefox.
2. Install the [Freighter Wallet Extension](https://www.freighter.app/).
3. Create a new wallet vault and securely record your recovery phrase.

## 2. Switch Freighter to Testnet

1. Open the Freighter extension popup.
2. Click the gear icon (**Settings**) in the top right header.
3. Locate **Network** and switch the toggle from **Public** to **Testnet**.
4. The status pill in Freighter should reflect `Testnet`.

## 3. Funding with Testnet XLM

Stellar Testnet accounts must be activated by receiving at least 1 XLM.

You can fund your testnet account through either:
1. **The Built-in Friendbot Tool**: Connect your wallet in AgriFlow. If your account is not yet funded, click **Fund with Friendbot**.
2. **Stellar Laboratory**: Visit [laboratory.stellar.org](https://laboratory.stellar.org/#account-creator?network=test), enter your public key, and click **Get test network lumens**.

## 4. Executing an Agricultural Payment

1. Launch AgriFlow (`pnpm dev`).
2. Navigate to [http://localhost:3000](http://localhost:3000).
3. Click **Connect Wallet** and select Freighter.
4. Verify your balance is displayed.
5. In the payment card:
   - Enter a test recipient (e.g., `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`).
   - Enter an amount such as `10` XLM.
   - Choose a purpose (e.g., `Farm Input`).
   - Click **Confirm & Send Payment**.
6. When the Freighter extension prompts you, review the transaction details and click **Approve**.
7. The payment receipt modal will present the confirmed transaction hash.
8. Click **View on Stellar Explorer** to view the ledger confirmation on Stellar.Expert.
