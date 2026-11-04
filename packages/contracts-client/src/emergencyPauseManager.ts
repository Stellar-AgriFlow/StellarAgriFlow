export type ContractModule =
  | 'TREASURY'
  | 'MARKETPLACE'
  | 'ESCROW'
  | 'LENDING'
  | 'LIQUIDATION'
  | 'INSURANCE';

export interface ModulePauseRecord {
  module: ContractModule;
  isPaused: boolean;
  pausedBy?: string;
  pausedAtLedger?: number;
  reason?: string;
  timelockUnpauseLedger?: number;
  unpauseRequestedBy?: string;
}

export class EmergencyPauseManager {
  private guardianAddresses: Set<string>;
  private moduleStates: Map<ContractModule, ModulePauseRecord> = new Map();
  public static readonly DEFAULT_TIMELOCK_LEDGERS = 17280; // ~ 24 hours on Stellar

  constructor(guardians: string[] = []) {
    this.guardianAddresses = new Set(guardians);
    const modules: ContractModule[] = [
      'TREASURY',
      'MARKETPLACE',
      'ESCROW',
      'LENDING',
      'LIQUIDATION',
      'INSURANCE',
    ];
    for (const m of modules) {
      this.moduleStates.set(m, {
        module: m,
        isPaused: false,
      });
    }
  }

  public addGuardian(address: string): void {
    this.guardianAddresses.add(address);
  }

  public isGuardian(address: string): boolean {
    return this.guardianAddresses.has(address);
  }

  public pauseModule(
    module: ContractModule,
    guardianAddress: string,
    currentLedger: number,
    reason: string
  ): ModulePauseRecord {
    if (!this.isGuardian(guardianAddress)) {
      throw new Error(`Unauthorized: Address ${guardianAddress} is not a registered emergency guardian`);
    }

    const state = this.moduleStates.get(module) || { module, isPaused: false };
    if (state.isPaused) {
      throw new Error(`Module ${module} is already paused`);
    }

    state.isPaused = true;
    state.pausedBy = guardianAddress;
    state.pausedAtLedger = currentLedger;
    state.reason = reason;
    state.timelockUnpauseLedger = undefined;
    state.unpauseRequestedBy = undefined;

    this.moduleStates.set(module, state);
    return state;
  }

  public requestTimelockedUnpause(
    module: ContractModule,
    guardianAddress: string,
    currentLedger: number,
    timelockDelayLedgers: number = EmergencyPauseManager.DEFAULT_TIMELOCK_LEDGERS
  ): ModulePauseRecord {
    if (!this.isGuardian(guardianAddress)) {
      throw new Error(`Unauthorized: Address ${guardianAddress} is not a registered emergency guardian`);
    }

    const state = this.moduleStates.get(module);
    if (!state || !state.isPaused) {
      throw new Error(`Cannot request unpause: Module ${module} is not currently paused`);
    }

    state.timelockUnpauseLedger = currentLedger + timelockDelayLedgers;
    state.unpauseRequestedBy = guardianAddress;

    return state;
  }

  public executeUnpause(module: ContractModule, currentLedger: number): ModulePauseRecord {
    const state = this.moduleStates.get(module);
    if (!state || !state.isPaused) {
      throw new Error(`Cannot execute unpause: Module ${module} is not paused`);
    }
    if (!state.timelockUnpauseLedger) {
      throw new Error(`Cannot execute unpause: No timelock scheduled for module ${module}`);
    }
    if (currentLedger < state.timelockUnpauseLedger) {
      throw new Error(
        `Timelock delay not elapsed: current ledger ${currentLedger} < unlock ledger ${state.timelockUnpauseLedger}`
      );
    }

    state.isPaused = false;
    state.pausedBy = undefined;
    state.pausedAtLedger = undefined;
    state.reason = undefined;
    state.timelockUnpauseLedger = undefined;
    state.unpauseRequestedBy = undefined;

    return state;
  }

  public isModuleOperational(module: ContractModule): boolean {
    const state = this.moduleStates.get(module);
    return state ? !state.isPaused : true;
  }

  public getStatus(module: ContractModule): ModulePauseRecord {
    return this.moduleStates.get(module) || { module, isPaused: false };
  }

  public getAllStatuses(): ModulePauseRecord[] {
    return Array.from(this.moduleStates.values());
  }
}
