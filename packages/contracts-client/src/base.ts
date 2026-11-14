import {
  rpc,
  TransactionBuilder,
  Operation,
  xdr,
  Transaction,
} from '@stellar/stellar-sdk';
import {
  STELLAR_TESTNET_CONFIG,
  STELLAR_SOROBAN_RPC_URL,
  STELLAR_BASE_FEE_STROOPS,
  getHorizonServer,
  parseStellarError,
} from '@agriflow/stellar';
import {
  classifySorobanRpcError,
  SorobanLedgerTimeoutError,
  SorobanRpcError,
} from './errors';

export interface BaseClientConfig {
  contractId: string;
  rpcUrl?: string;
  networkPassphrase?: string;
}

export abstract class BaseSorobanClient {
  public contractId: string;
  public rpcUrl: string;
  public networkPassphrase: string;
  protected server: rpc.Server;

  constructor(config: BaseClientConfig) {
    if (!config.contractId || !config.contractId.startsWith('C') || config.contractId.length !== 56) {
      throw new Error(`Invalid Soroban contract ID: "${config.contractId}". Must start with C and be 56 characters.`);
    }
    this.contractId = config.contractId;
    this.rpcUrl = config.rpcUrl || STELLAR_SOROBAN_RPC_URL;
    this.networkPassphrase = config.networkPassphrase || STELLAR_TESTNET_CONFIG.networkPassphrase;
    this.server = new rpc.Server(this.rpcUrl, { allowHttp: false });
  }

  getContractId(): string {
    return this.contractId;
  }

  protected async executeContractCall(
    invokerAddress: string,
    functionName: string,
    args: xdr.ScVal[],
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<{ result: xdr.ScVal; txHash: string; status: rpc.Api.GetTransactionStatus }> {
    return this.invokeContract(
      functionName,
      args,
      invokerAddress,
      signer,
      onStateChange
    );
  }

  protected async invokeContract(
    functionName: string,
    args: xdr.ScVal[],
    invokerAddress: string,
    signer: (xdr: string) => Promise<string>,
    onStateChange?: (state: string) => void
  ): Promise<{ result: xdr.ScVal; txHash: string; status: rpc.Api.GetTransactionStatus }> {
    try {
      onStateChange?.('preparing');

      const horizon = getHorizonServer();
      const account = await horizon.loadAccount(invokerAddress);

      const contractOperation = Operation.invokeContractFunction({
        contract: this.contractId,
        function: functionName,
        args,
      });

      const initialTx = new TransactionBuilder(account, {
        fee: STELLAR_BASE_FEE_STROOPS,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(contractOperation)
        .setTimeout(300)
        .build();

      onStateChange?.('simulating');
      const simulation = await this.server.simulateTransaction(initialTx);

      if (rpc.Api.isSimulationError(simulation)) {
        throw classifySorobanRpcError(simulation, {
          contractId: this.contractId,
          functionName,
        });
      }

      const preparedTx = rpc.assembleTransaction(initialTx, simulation).build();

      onStateChange?.('awaiting_signature');
      const preparedXdr = preparedTx.toXDR();
      let signedXdr: string;
      try {
        signedXdr = await signer(preparedXdr);
      } catch (signErr) {
        onStateChange?.('rejected');
        throw classifySorobanRpcError(signErr, {
          contractId: this.contractId,
          functionName,
        });
      }

      onStateChange?.('submitting');
      const signedTx = new Transaction(signedXdr, this.networkPassphrase);
      const sendResponse = await this.server.sendTransaction(signedTx);

      if (sendResponse.status === 'ERROR') {
        const errDetails = (sendResponse as { errorResult?: unknown }).errorResult || sendResponse;
        throw classifySorobanRpcError(
          `Transaction submission failed: ${JSON.stringify(errDetails)}`,
          { contractId: this.contractId, functionName }
        );
      }

      const txHash = sendResponse.hash;

      onStateChange?.('pending');
      const confirmed = await this.pollTransaction(txHash);

      if (confirmed.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        onStateChange?.('confirmed');
        const simResult = rpc.Api.isSimulationSuccess(simulation) ? simulation.result?.retval : undefined;
        const result = (confirmed.returnValue as xdr.ScVal) || simResult || xdr.ScVal.scvVoid();
        return { result, txHash, status: confirmed.status };
      } else {
        onStateChange?.('failed');
        throw classifySorobanRpcError(
          `Transaction failed with status: ${confirmed.status}`,
          { contractId: this.contractId, functionName }
        );
      }
    } catch (err: any) {
      if (!['rejected', 'confirmed'].includes(err?.state)) {
        onStateChange?.('failed');
      }
      if (err instanceof SorobanRpcError) {
        throw err;
      }
      throw classifySorobanRpcError(parseStellarError(err), {
        contractId: this.contractId,
        functionName,
      });
    }
  }

  async readContract(functionName: string, args: xdr.ScVal[] = []): Promise<xdr.ScVal | any> {
    const dummyAccount = new (await import('@stellar/stellar-sdk')).Account(
      'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
      '0'
    );
    const tx = new TransactionBuilder(dummyAccount, {
      fee: STELLAR_BASE_FEE_STROOPS,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: this.contractId,
          function: functionName,
          args,
        })
      )
      .setTimeout(300)
      .build();

    const simulation = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(simulation) && simulation.result?.retval) {
      return simulation.result.retval;
    }
    throw classifySorobanRpcError(
      rpc.Api.isSimulationError(simulation) ? simulation : `Simulation failed for ${functionName}`,
      { contractId: this.contractId, functionName }
    );
  }

  protected async pollTransaction(
    txHash: string,
    maxRetries: number = 25,
    intervalMs: number = 1500
  ): Promise<rpc.Api.GetTransactionResponse> {
    for (let i = 0; i < maxRetries; i++) {
      const response = await this.server.getTransaction(txHash);
      if (response.status !== rpc.Api.GetTransactionStatus.NOT_FOUND) {
        return response;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new SorobanLedgerTimeoutError(
      `Transaction confirmation timed out after ${maxRetries * (intervalMs / 1000)}s`,
      { contractId: this.contractId }
    );
  }
}
