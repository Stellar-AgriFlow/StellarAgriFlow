# Parametric Agricultural Climate Insurance Specification

## Abstract
This document describes the technical architecture and actuarial solvency mechanics of the **AgriFlow Parametric Climate Insurance Protocol** on Soroban.

## Solvency & Reserve Dynamics

To guarantee 100% solvency without risk of unbacked claims:
$$\text{Available Solvency} = \text{Total Pool Deposits} - \text{Total Reserved Liabilities}$$

A policy can only be underwritten if:
$$\text{Total Reserved} + \text{Policy Payout} \le \text{Total Deposited}$$

If this condition fails, the contract reverts with `InsuranceError::InsufficientLiquidity`.

## Premium Collection & Liquidity Provider Economics

1. **Fixed Premium Rate**: 5% of insured payout amount ($P = 0.05 \times \text{Payout}$).
2. **LP Share Accounting**:
   - Initial deposit mints 1:1 shares.
   - Subsequent deposits mint proportional shares:
     $$\text{Shares Minted} = \frac{\text{Deposit Amount} \times \text{Total Shares}}{\text{Total Deposited}}$$
   - Expired policies with no claims release reserved capital back into the general pool, increasing net asset value (NAV) per share for liquidity providers.

## Cross-Contract Oracle Execution

When `trigger_policy_payout` is invoked:
1. `ParametricInsurance` executes a cross-contract invocation to `WeatherRiskOracle::get_latest_weather_metrics(region)`.
2. If `drought_index >= trigger_threshold`:
   - Policy status transitions to `PaidOut`.
   - Payout funds are transferred directly to the farmer's Stellar address.
   - Reserved pool capital is decremented.
