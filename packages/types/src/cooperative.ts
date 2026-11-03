export enum ProposalStatus {
  Pending = 1,
  Approved = 2,
  Executed = 3,
  Rejected = 4,
}

export interface CoopMember {
  address: string;
  shares: number;
  stakedAmount: number;
  joinedTimestamp: number;
}

export interface BulkProcurementProposal {
  id: number;
  proposer: string;
  title: string;
  recipient: string;
  amount: number;
  votesFor: number;
  quorumRequired: number;
  status: ProposalStatus;
}

export interface SubmitProposalParams {
  proposer: string;
  title: string;
  recipient: string;
  amount: number;
}

export interface VoteProposalParams {
  member: string;
  proposalId: number;
}

export interface DepositSavingsParams {
  member: string;
  amount: number;
}

export interface WithdrawSavingsParams {
  member: string;
  amount: number;
}
