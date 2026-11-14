import { describe, it, expect } from 'vitest';
import {
  classifySorobanRpcError,
  extractSorobanDiagnosticMessage,
  SorobanAuthError,
  SorobanLedgerTimeoutError,
  SorobanResourceLimitError,
  SorobanRpcError,
  SorobanSimulationError,
} from '../packages/contracts-client/src/errors';

describe('Soroban RPC Typed Error Discrimination', () => {
  const sampleContractId = 'CBLQUEAJAI6PYQDEWQR2ICR2FPPP6KQN5ZEGPT4FD7MXCGBJZTOO2CDZ';

  it('classifies authorization and wallet signature errors as SorobanAuthError', () => {
    const authErr = classifySorobanRpcError(
      {
        error: 'HostError: Error(Auth, InvalidAction) — require_auth failed for invoker',
        events: ['auth_check_failed'],
      },
      { contractId: sampleContractId, functionName: 'release_escrow' }
    );

    expect(authErr).toBeInstanceOf(Error);
    expect(authErr).toBeInstanceOf(SorobanRpcError);
    expect(authErr).toBeInstanceOf(SorobanAuthError);
    expect(authErr.kind).toBe('AUTH_ERROR');
    expect(authErr.contractId).toBe(sampleContractId);
    expect(authErr.functionName).toBe('release_escrow');
    expect(authErr.diagnosticEvents).toContain('auth_check_failed');

    const walletRejectErr = classifySorobanRpcError('User denied transaction signature');
    expect(walletRejectErr).toBeInstanceOf(SorobanAuthError);
  });

  it('classifies CPU, memory, and footprint budget errors as SorobanResourceLimitError', () => {
    const budgetErr = classifySorobanRpcError(
      {
        error: 'HostError: Error(Budget, ExceededLimit) — CPU instructions exceeded limit',
      },
      { contractId: sampleContractId, functionName: 'batch_settle' }
    );

    expect(budgetErr).toBeInstanceOf(SorobanRpcError);
    expect(budgetErr).toBeInstanceOf(SorobanResourceLimitError);
    expect(budgetErr.kind).toBe('RESOURCE_LIMIT_ERROR');
  });

  it('classifies ledger expiration and polling timeouts as SorobanLedgerTimeoutError', () => {
    const timeoutErr = classifySorobanRpcError(
      new Error('Transaction confirmation timed out after 37.5s'),
      { contractId: sampleContractId, functionName: 'register_farm' }
    );

    expect(timeoutErr).toBeInstanceOf(SorobanRpcError);
    expect(timeoutErr).toBeInstanceOf(SorobanLedgerTimeoutError);
    expect(timeoutErr.kind).toBe('LEDGER_TIMEOUT_ERROR');
  });

  it('classifies contract traps and simulation failures as SorobanSimulationError', () => {
    const simErr = classifySorobanRpcError(
      {
        error: 'HostError: Error(Contract, #4) — EscrowAlreadySettled',
        diagnosticEvents: ['contract_trap:#4'],
      },
      { contractId: sampleContractId, functionName: 'settle' }
    );

    expect(simErr).toBeInstanceOf(SorobanRpcError);
    expect(simErr).toBeInstanceOf(SorobanSimulationError);
    expect(simErr.kind).toBe('SIMULATION_ERROR');
    expect(simErr.rawMessage).toContain('Error(Contract, #4)');

    const extracted = extractSorobanDiagnosticMessage(simErr);
    expect(extracted.rawMessage).toContain('Error(Contract, #4)');
    expect(extracted.diagnosticEvents).toEqual(['contract_trap:#4']);
  });
});
