export type PrometheusMetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export type MetricLabelSet = Record<string, string>;

export interface MetricSample {
  name: string;
  labels: MetricLabelSet;
  value: number;
  timestamp?: number;
}

export interface MetricFamily {
  name: string;
  help: string;
  type: PrometheusMetricType;
  samples: MetricSample[];
}

export interface SorobanNodeHealthTelemetry {
  isSynced: boolean;
  latestLedger: number;
  ledgerCloseTimeMs: number;
  rpcRoundtripMs: number;
  pendingTxCount: number;
  storageDiskUsedBytes: number;
  cpuLoadPercent: number;
  memoryUsageMb: number;
  timestamp: number;
}

export interface TelemetryExportOptions {
  includeNodeHealth?: boolean;
  prefix?: string;
  defaultLabels?: MetricLabelSet;
}
