export type TelemetryMetricType = 'counter' | 'gauge' | 'histogram';

export interface MetricRecord {
  name: string;
  help: string;
  type: TelemetryMetricType;
  labels: Record<string, string>;
  value: number;
  timestamp: number;
}

export class TelemetryCollector {
  private metrics: Map<string, MetricRecord> = new Map();
  private histogramBuckets: Map<string, { buckets: number[]; counts: number[]; sum: number; count: number }> =
    new Map();

  private getMetricKey(name: string, labels: Record<string, string>): string {
    const sortedPairs = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${sortedPairs}}`;
  }

  public incrementCounter(
    name: string,
    delta: number = 1,
    labels: Record<string, string> = {},
    help: string = 'Counter metric'
  ): void {
    if (delta < 0) throw new Error('Counter delta must be non-negative');
    const key = this.getMetricKey(name, labels);
    const existing = this.metrics.get(key);
    const currentVal = existing ? existing.value : 0;

    this.metrics.set(key, {
      name,
      help,
      type: 'counter',
      labels,
      value: currentVal + delta,
      timestamp: Date.now(),
    });
  }

  public setGauge(
    name: string,
    value: number,
    labels: Record<string, string> = {},
    help: string = 'Gauge metric'
  ): void {
    const key = this.getMetricKey(name, labels);
    this.metrics.set(key, {
      name,
      help,
      type: 'gauge',
      labels,
      value,
      timestamp: Date.now(),
    });
  }

  public observeHistogram(
    name: string,
    value: number,
    labels: Record<string, string> = {},
    buckets: number[] = [10, 50, 100, 250, 500, 1000, 2500, 5000],
    help: string = 'Histogram metric'
  ): void {
    const key = this.getMetricKey(name, labels);
    let hist = this.histogramBuckets.get(key);

    if (!hist) {
      hist = {
        buckets: [...buckets].sort((a, b) => a - b),
        counts: new Array(buckets.length).fill(0),
        sum: 0,
        count: 0,
      };
      this.histogramBuckets.set(key, hist);
    }

    hist.sum += value;
    hist.count++;

    for (let i = 0; i < hist.buckets.length; i++) {
      if (value <= hist.buckets[i]) {
        hist.counts[i]++;
      }
    }

    this.metrics.set(key, {
      name,
      help,
      type: 'histogram',
      labels,
      value: hist.sum,
      timestamp: Date.now(),
    });
  }

  public exportPrometheusFormat(): string {
    const lines: string[] = [];
    const groupedByName = new Map<string, MetricRecord[]>();

    for (const record of this.metrics.values()) {
      const list = groupedByName.get(record.name) || [];
      list.push(record);
      groupedByName.set(record.name, list);
    }

    for (const [name, records] of groupedByName.entries()) {
      const first = records[0];
      lines.push(`# HELP ${name} ${first.help}`);
      lines.push(`# TYPE ${name} ${first.type}`);

      for (const rec of records) {
        const labelPairs = Object.entries(rec.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        const labelStr = labelPairs ? `{${labelPairs}}` : '';

        if (rec.type === 'histogram') {
          const key = this.getMetricKey(rec.name, rec.labels);
          const hist = this.histogramBuckets.get(key);
          if (hist) {
            for (let i = 0; i < hist.buckets.length; i++) {
              const bLabels = labelPairs ? `${labelPairs},le="${hist.buckets[i]}"` : `le="${hist.buckets[i]}"`;
              lines.push(`${name}_bucket{${bLabels}} ${hist.counts[i]}`);
            }
            const infLabels = labelPairs ? `${labelPairs},le="+Inf"` : `le="+Inf"`;
            lines.push(`${name}_bucket{${infLabels}} ${hist.count}`);
            lines.push(`${name}_sum${labelStr} ${hist.sum}`);
            lines.push(`${name}_count${labelStr} ${hist.count}`);
          }
        } else {
          lines.push(`${name}${labelStr} ${rec.value}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  public reset(): void {
    this.metrics.clear();
    this.histogramBuckets.clear();
  }
}
