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
  ): Promise<{ txHash: string; status: rpc.Api.GetTransactionStatus }> {
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
        throw new Error(`Contract simulation failed: ${simulation.error}`);
      }

      const preparedTx = rpc.assembleTransaction(initialTx, simulation).build();

      onStateChange?.('awaiting_signature');
      const preparedXdr = preparedTx.toXDR();
      let signedXdr: string;
      try {
        signedXdr = await signer(preparedXdr);
      } catch (signErr) {
        onStateChange?.('rejected');
        throw signErr;
      }

      onStateChange?.('submitting');
      const signedTx = new Transaction(signedXdr, this.networkPassphrase);
      const sendResponse = await this.server.sendTransaction(signedTx);

      if (sendResponse.status === 'ERROR') {
        const errDetails = (sendResponse as { errorResult?: unknown }).errorResult || sendResponse;
        throw new Error(`Transaction submission failed: ${JSON.stringify(errDetails)}`);
      }

      const txHash = sendResponse.hash;

      onStateChange?.('pending');
      const confirmed = await this.pollTransaction(txHash);

      if (confirmed.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        onStateChange?.('confirmed');
        return { txHash, status: confirmed.status };
      } else {
        onStateChange?.('failed');
        throw new Error(`Transaction failed with status: ${confirmed.status}`);
      }
    } catch (err: any) {
      if (!['rejected', 'confirmed'].includes(err.state)) {
        onStateChange?.('failed');
      }
      throw new Error(parseStellarError(err));
    }
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
    throw new Error(`Transaction confirmation timed out after ${maxRetries * (intervalMs / 1000)}s`);
  }
}
