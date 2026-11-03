import { scValToNative, xdr } from '@stellar/stellar-sdk';

export interface ParsedSorobanEvent {
  contractId: string;
  topic: string;
  subTopic?: string;
  data: any;
  ledger: number;
  ledgerClosedAt: string;
  id: string;
}

export class SorobanEventParser {
  /**
   * Parses raw Soroban RPC event response into typed domain event
   */
  static parseEvent(rawEvent: {
    contractId: string;
    topic: string[];
    value: string;
    ledger: number;
    ledgerClosedAt: string;
    id: string;
  }): ParsedSorobanEvent {
    let topicName = 'Unknown';
    let subTopic: string | undefined;

    if (rawEvent.topic && rawEvent.topic.length > 0) {
      try {
        const topicScVal = xdr.ScVal.fromXDR(rawEvent.topic[0], 'base64');
        topicName = String(scValToNative(topicScVal));

        if (rawEvent.topic.length > 1) {
          const subTopicScVal = xdr.ScVal.fromXDR(rawEvent.topic[1], 'base64');
          subTopic = String(scValToNative(subTopicScVal));
        }
      } catch {
        topicName = rawEvent.topic[0];
      }
    }

    let parsedData: any = null;
    if (rawEvent.value) {
      try {
        const valueScVal = xdr.ScVal.fromXDR(rawEvent.value, 'base64');
        parsedData = scValToNative(valueScVal);
      } catch {
        parsedData = rawEvent.value;
      }
    }

    return {
      contractId: rawEvent.contractId,
      topic: topicName,
      subTopic,
      data: parsedData,
      ledger: rawEvent.ledger,
      ledgerClosedAt: rawEvent.ledgerClosedAt,
      id: rawEvent.id,
    };
  }
}
