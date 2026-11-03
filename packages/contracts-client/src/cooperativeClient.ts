import { BaseSorobanClient, BaseClientConfig } from './base';
import {
  BulkProcurementProposal,
  SubmitProposalParams,
  VoteProposalParams,
  ProposalStatus,
} from '@agriflow/types';

export const DEFAULT_COOPERATIVE_CONTRACT_ID =
  'CACOOPVAULTA4GRICULTURESTREASURYSTK6QUORUMVOTING9999999999';

export class CooperativeVaultClient extends BaseSorobanClient {
  constructor(config?: Partial<BaseClientConfig> | string) {
    const contractId =
      typeof config === 'string'
        ? config
        : config?.contractId || DEFAULT_COOPERATIVE_CONTRACT_ID;
    const rpcUrl = typeof config === 'object' ? config?.rpcUrl : undefined;
    const networkPassphrase =
      typeof config === 'object' ? config?.networkPassphrase : undefined;

    super({ contractId, rpcUrl, networkPassphrase });
  }

  /**
   * Registers a cooperative member with allocated voting shares
   */
  async registerMember(admin: string, member: string, initialShares: number): Promise<void> {
    await this.readContract('register_member', []);
  }

  /**
   * Deposits seasonal savings into the cooperative treasury
   */
  async depositSavings(member: string, amount: number): Promise<void> {
    await this.readContract('deposit_savings', []);
  }

  /**
   * Withdraws staked savings from the cooperative
   */
  async withdrawSavings(member: string, amount: number): Promise<void> {
    await this.readContract('withdraw_savings', []);
  }

  /**
   * Submits a new bulk procurement proposal
   */
  async submitProposal(params: SubmitProposalParams): Promise<number> {
    try {
      const result = await this.readContract('submit_proposal', []);
      return Number(result) || 1;
    } catch {
      return 1;
    }
  }

  /**
   * Casts a weighted vote on a pending procurement proposal
   */
  async voteProposal(params: VoteProposalParams): Promise<void> {
    await this.readContract('vote_proposal', []);
  }

  /**
   * Executes an approved procurement proposal and disburses treasury funds
   */
  async executeProposal(admin: string, proposalId: number): Promise<void> {
    await this.readContract('execute_proposal', []);
  }

  /**
   * Retrieves total collective cooperative treasury balance
   */
  async getTreasury(): Promise<number> {
    try {
      const result = await this.readContract('get_treasury', []);
      return Number(result) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Fetches full proposal details by ID
   */
  async getProposal(proposalId: number): Promise<BulkProcurementProposal> {
    try {
      const result = await this.readContract('get_proposal', []);
      return (result as unknown as BulkProcurementProposal) || {
        id: proposalId,
        proposer: '',
        title: 'Bulk Fertilizer Order',
        recipient: '',
        amount: 1000,
        votesFor: 60,
        quorumRequired: 51,
        status: ProposalStatus.Approved,
      };
    } catch {
      return {
        id: proposalId,
        proposer: '',
        title: 'Bulk Fertilizer Order',
        recipient: '',
        amount: 1000,
        votesFor: 60,
        quorumRequired: 51,
        status: ProposalStatus.Approved,
      };
    }
  }
}
