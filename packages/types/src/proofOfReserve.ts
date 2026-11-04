export type CommodityGrade = 'GRADE_1_PREMIUM' | 'GRADE_2_STANDARD' | 'GRADE_3_FEED';

export interface PhysicalSiloAuditAttestation {
  auditId: string;
  siloId: string;
  facilityName: string;
  locationCity: string;
  locationCountry: string;
  commoditySymbol: string;
  commodityGrade: CommodityGrade;
  verifiedMetricTonnes: number;
  inspectorAddress: string;
  auditDateTimestamp: number;
  certificateIpfsCid: string;
}

export interface ProofOfReserveFeedSnapshot {
  snapshotId: string;
  timestamp: number;
  commoditySymbol: string;
  tokenContractId: string;
  circulatingTokenSupply: number;
  verifiedPhysicalTonnes: number;
  collateralizationRatio: number;
  isSolvent: boolean;
  auditorCount: number;
}

export interface ProofOfReserveAuditSubmission {
  siloId: string;
  auditorPublicKey: string;
  measuredWeightTonnes: number;
  moisturePercentage: number;
  signature: string;
  timestamp: number;
}
