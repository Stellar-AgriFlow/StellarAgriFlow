export type SorobanErrorKind =
  | 'SIMULATION_ERROR'
  | 'AUTH_ERROR'
  | 'RESOURCE_LIMIT_ERROR'
  | 'LEDGER_TIMEOUT_ERROR';

export interface SorobanErrorMetadata {
  rawMessage?: string;
  contractId?: string;
  functionName?: string;
  diagnosticEvents?: string[];
  cause?: unknown;
}

/**
 * Base class for all typed Soroban RPC client exceptions.
 */
export class SorobanRpcError extends Error {
  public readonly kind: SorobanErrorKind;
  public readonly rawMessage: string;
  public readonly contractId?: string;
  public readonly functionName?: string;
  public readonly diagnosticEvents: string[];

  constructor(
    kind: SorobanErrorKind,
    message: string,
    metadata: SorobanErrorMetadata = {}
  ) {
    super(message);
    this.name = new.target.name;
    this.kind = kind;
    this.rawMessage = metadata.rawMessage || message;
    this.contractId = metadata.contractId;
    this.functionName = metadata.functionName;
    this.diagnosticEvents = metadata.diagnosticEvents || [];
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when Soroban RPC transaction simulation fails (e.g. host trap,
 * contract panic `Error(Contract, #...)`, invalid arguments, or missing state).
 */
export class SorobanSimulationError extends SorobanRpcError {
  constructor(message: string, metadata: SorobanErrorMetadata = {}) {
    super('SIMULATION_ERROR', message, metadata);
  }
}

/**
 * Thrown when Soroban authorization fails (`Error(Auth, ...)`), a required
 * `require_auth` entry is missing/expired, or the user wallet rejects signing.
 */
export class SorobanAuthError extends SorobanRpcError {
  constructor(message: string, metadata: SorobanErrorMetadata = {}) {
    super('AUTH_ERROR', message, metadata);
  }
}

/**
 * Thrown when a Soroban invocation exceeds CPU instruction limits, memory bytes,
 * read/write ledger footprint limits, or refundable resource fee budgets (`Error(Budget, ...)`).
 */
export class SorobanResourceLimitError extends SorobanRpcError {
  constructor(message: string, metadata: SorobanErrorMetadata = {}) {
    super('RESOURCE_LIMIT_ERROR', message, metadata);
  }
}

/**
 * Thrown when transaction confirmation polling exceeds the ledger timeout window
 * or when a transaction's timebounds / ledger sequence horizon expires before inclusion.
 */
export class SorobanLedgerTimeoutError extends SorobanRpcError {
  constructor(message: string, metadata: SorobanErrorMetadata = {}) {
    super('LEDGER_TIMEOUT_ERROR', message, metadata);
  }
}

/**
 * Extracts raw diagnostic strings from a Soroban RPC error object, simulation response,
 * or standard Error instance.
 */
export function extractSorobanDiagnosticMessage(err: unknown): {
  rawMessage: string;
  diagnosticEvents: string[];
} {
  if (!err) {
    return { rawMessage: 'Unknown Soroban RPC error', diagnosticEvents: [] };
  }

  if (typeof err === 'string') {
    return { rawMessage: err, diagnosticEvents: [] };
  }

  if (err instanceof SorobanRpcError) {
    return {
      rawMessage: err.rawMessage,
      diagnosticEvents: err.diagnosticEvents,
    };
  }

  const obj = err as Record<string, unknown>;
  const diagnosticEvents: string[] = [];

  if (Array.isArray(obj.events)) {
    for (const ev of obj.events) {
      diagnosticEvents.push(typeof ev === 'string' ? ev : JSON.stringify(ev));
    }
  }
  if (Array.isArray(obj.diagnosticEvents)) {
    for (const ev of obj.diagnosticEvents) {
      diagnosticEvents.push(typeof ev === 'string' ? ev : JSON.stringify(ev));
    }
  }

  const candidates = [
    typeof obj.error === 'string' ? obj.error : undefined,
    typeof obj.message === 'string' ? obj.message : undefined,
    typeof obj.resultXdr === 'string' ? obj.resultXdr : undefined,
    diagnosticEvents.length > 0 ? diagnosticEvents.join(' | ') : undefined,
  ].filter((c): c is string => Boolean(c && c.trim()));

  const rawMessage =
    candidates.length > 0 ? candidates.join(' — ') : JSON.stringify(err);

  return { rawMessage, diagnosticEvents };
}

/**
 * Categorizes any raw Soroban RPC diagnostic or error payload into a typed,
 * discriminable `SorobanRpcError` subclass (`SorobanAuthError`,
 * `SorobanResourceLimitError`, `SorobanLedgerTimeoutError`, or `SorobanSimulationError`).
 */
export function classifySorobanRpcError(
  err: unknown,
  context: Pick<SorobanErrorMetadata, 'contractId' | 'functionName'> = {}
): SorobanRpcError {
  if (err instanceof SorobanRpcError) {
    return err;
  }

  const { rawMessage, diagnosticEvents } = extractSorobanDiagnosticMessage(err);
  const metadata: SorobanErrorMetadata = {
    rawMessage,
    diagnosticEvents,
    contractId: context.contractId,
    functionName: context.functionName,
    cause: err,
  };

  // 1. Authorization & signature errors
  if (
    /Error\(Auth\b|auth.*failed|unauthorized|require_auth|signature.*rejected|user\s+(denied|declined|rejected)|missing.*signature|invalid.*signature|op_bad_auth/i.test(
      rawMessage
    )
  ) {
    return new SorobanAuthError(
      `Soroban authorization failed: ${rawMessage}`,
      metadata
    );
  }

  // 2. Resource limit / budget exceeded errors
  if (
    /Error\(Budget\b|resource\s+limit|budget\s+exceeded|cpu\s+limit|memory\s+limit|instructions\s+exceeded|footprint\s+exceeded|tx_insufficient_fee|op_exceeded_work_limit|read\s+bytes\s+exceeded|write\s+bytes\s+exceeded/i.test(
      rawMessage
    )
  ) {
    return new SorobanResourceLimitError(
      `Soroban resource limit exceeded: ${rawMessage}`,
      metadata
    );
  }

  // 3. Ledger timeout / expiration errors
  if (
    /timed?\s*out|timeout|tx_too_late|ledger.*expired|expiration\s+ledger|deadline\s+exceeded|not\s+found\s+after\s+polling/i.test(
      rawMessage
    )
  ) {
    return new SorobanLedgerTimeoutError(
      `Soroban ledger confirmation timed out: ${rawMessage}`,
      metadata
    );
  }

  // 4. Default to structured simulation / contract execution error
  return new SorobanSimulationError(
    `Soroban contract simulation failed: ${rawMessage}`,
    metadata
  );
}
