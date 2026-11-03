import { describe, it, expect } from 'vitest';
import { runCooperativeSimulation } from '../scripts/simulate-cooperative-flow';

describe('Cooperative Flow End-to-End Simulation', () => {
  it('executes full cooperative simulation pipeline deterministically', () => {
    const result = runCooperativeSimulation();

    expect(result.initialTreasury).toBe(25000);
    expect(result.finalTreasury).toBe(13000);
    expect(result.proposalId).toBe(1);
    expect(result.proposalStatus).toBe('Executed');
    expect(result.steps.length).toBe(6);

    for (const step of result.steps) {
      expect(step.status).toBe('SUCCESS');
    }
  });

  it('records correct step details in chronological order', () => {
    const result = runCooperativeSimulation();

    expect(result.steps[0].action).toBe('INITIALIZE_COOPERATIVE');
    expect(result.steps[1].action).toBe('REGISTER_MEMBERS');
    expect(result.steps[2].action).toBe('DEPOSIT_SAVINGS');
    expect(result.steps[3].action).toBe('SUBMIT_PROPOSAL');
    expect(result.steps[4].action).toBe('VOTE_PROPOSAL');
    expect(result.steps[5].action).toBe('EXECUTE_PROPOSAL');

    expect(result.steps[3].details.quorumRequired).toBe(51);
    expect(result.steps[4].details.votesFor).toBe(60);
    expect(result.steps[5].details.disbursed).toBe(12000);
  });
});
