export interface WarehouseReceipt {
  id: number;
  owner: string;
  commodityType: string;
  quantityKg: number;
  qualityGrade: number | string;
  moisturePercent: number;
  warehouseAddress: string;
  depositTimestamp: number;
  status: 'Active' | 'Pledged' | 'Redeemed';
  encumberedTo?: string;
  receiptId?: number;
  warehouseId?: string;
  commodity?: string;
  grade?: string;
  harvestYear?: number;
  isPledged?: boolean;
  pledgee?: string;
  isRedeemed?: boolean;
  createdAt?: number;
}

export interface WarehouseReceiptRecord {
  receiptId: number;
  owner: string;
  warehouseId: string;
  commodity: string;
  quantityKg: number;
  grade: string;
  moisturePercent: number; // in percentage e.g. 13.50
  harvestYear: number;
  isPledged: boolean;
  pledgee?: string;
  isRedeemed: boolean;
  createdAt: number;
}

export interface MintWarehouseReceiptParams {
  custodian: string;
  farmer: string;
  warehouseId: string;
  commodity: string;
  quantityKg: number;
  grade: string;
  moisturePercent: number;
  harvestYear: number;
}

export interface MintReceiptParams {
  custodian?: string;
  farmer: string;
  warehouseId?: string;
  warehouseAddress?: string;
  commodity?: string;
  commodityType?: string;
  quantityKg: number;
  grade?: string;
  qualityGrade?: number | string;
  moisturePercent: number;
  harvestYear?: number;
}

export interface PledgeReceiptParams {
  owner: string;
  receiptId: number;
  pledgee: string;
}

export interface RedeemReceiptParams {
  receiptId: number;
  owner: string;
  destinationWarehouse?: string;
}

export interface TransferReceiptParams {
  currentOwner: string;
  receiptId: number;
  newOwner: string;
}
