import { Keypair } from '@stellar/stellar-sdk';

export interface InvocationSpec {
  functionName: string;
  contractId: string;
  args: any[];
  subInvocations?: InvocationSpec[];
}

export interface SorobanAuthEntry {
  credentials: {
    type: 'source_account' | 'contract';
    address: string;
    nonce: number;
    signatureExpirationLedger: number;
  };
  rootInvocation: InvocationSpec;
  signature?: string;
  isSigned: boolean;
}

export interface MultiAuthSession {
  sessionId: string;
  description: string;
  requiredSigners: string[];
  collectedEntries: Map<string, SorobanAuthEntry>;
  createdAtLedger: number;
  expiresAtLedger: number;
}

export class AuthEntryBuilder {
  private entry: Partial<SorobanAuthEntry> = {
    isSigned: false,
  };

  public setCredentials(address: string, nonce: number, expirationLedger: number, type: 'source_account' | 'contract' = 'source_account'): this {
    if (!address.startsWith('G') && !address.startsWith('C')) {
      throw new Error(`Invalid address format: ${address}`);
    }
    if (nonce < 0) {
      throw new Error('Nonce must be non-negative');
    }
    this.entry.credentials = {
      type,
      address,
      nonce,
      signatureExpirationLedger: expirationLedger,
    };
    return this;
  }

  public setRootInvocation(contractId: string, functionName: string, args: any[] = [], subInvocations: InvocationSpec[] = []): this {
    if (!contractId || !functionName) {
      throw new Error('Contract ID and function name are required');
    }
    this.entry.rootInvocation = {
      contractId,
      functionName,
      args,
      subInvocations,
    };
    return this;
  }

  public sign(signerKeypair: Keypair): SorobanAuthEntry {
    if (!this.entry.credentials || !this.entry.rootInvocation) {
      throw new Error('Cannot sign incomplete auth entry: missing credentials or rootInvocation');
    }
    if (signerKeypair.publicKey() !== this.entry.credentials.address) {
      throw new Error(`Signer public key ${signerKeypair.publicKey()} does not match auth entry address ${this.entry.credentials.address}`);
    }

    const payload = JSON.stringify({
      credentials: this.entry.credentials,
      invocation: this.entry.rootInvocation,
    });
    const signature = Buffer.from(signerKeypair.sign(Buffer.from(payload)) as unknown as Uint8Array).toString('base64');

    this.entry.signature = signature;
    this.entry.isSigned = true;

    return this.build();
  }

  public build(): SorobanAuthEntry {
    if (!this.entry.credentials || !this.entry.rootInvocation) {
      throw new Error('Cannot build incomplete auth entry: missing credentials or rootInvocation');
    }
    return {
      credentials: this.entry.credentials,
      rootInvocation: this.entry.rootInvocation,
      signature: this.entry.signature,
      isSigned: this.entry.isSigned || false,
    };
  }
}

export class MultiAuthCollector {
  private sessions: Map<string, MultiAuthSession> = new Map();

  public createSession(sessionId: string, description: string, requiredSigners: string[], currentLedger: number, validLedgersSpan = 500): MultiAuthSession {
    if (this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`);
    }
    if (requiredSigners.length === 0) {
      throw new Error('At least one required signer must be specified');
    }

    const session: MultiAuthSession = {
      sessionId,
      description,
      requiredSigners: [...new Set(requiredSigners)],
      collectedEntries: new Map(),
      createdAtLedger: currentLedger,
      expiresAtLedger: currentLedger + validLedgersSpan,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  public getSession(sessionId: string): MultiAuthSession | undefined {
    return this.sessions.get(sessionId);
  }

  public addAuthEntry(sessionId: string, entry: SorobanAuthEntry, currentLedger: number): { completed: boolean; missingSigners: string[] } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (currentLedger > session.expiresAtLedger) {
      throw new Error(`Session ${sessionId} has expired at ledger ${session.expiresAtLedger} (current: ${currentLedger})`);
    }
    if (!entry.isSigned || !entry.signature) {
      throw new Error('Auth entry must be signed before submission');
    }
    if (entry.credentials.signatureExpirationLedger < currentLedger) {
      throw new Error(`Auth entry signature expired at ledger ${entry.credentials.signatureExpirationLedger}`);
    }

    const signer = entry.credentials.address;
    if (!session.requiredSigners.includes(signer)) {
      throw new Error(`Signer ${signer} is not an authorized party for session ${sessionId}`);
    }

    session.collectedEntries.set(signer, entry);

    const missingSigners = session.requiredSigners.filter((s) => !session.collectedEntries.has(s));
    return {
      completed: missingSigners.length === 0,
      missingSigners,
    };
  }

  public compileAuthorizationEntries(sessionId: string): SorobanAuthEntry[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const missing = session.requiredSigners.filter((s) => !session.collectedEntries.has(s));
    if (missing.length > 0) {
      throw new Error(`Cannot compile authorization entries: missing signers [${missing.join(', ')}]`);
    }

    return Array.from(session.collectedEntries.values());
  }
}
