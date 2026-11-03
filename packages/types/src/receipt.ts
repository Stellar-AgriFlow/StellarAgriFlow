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

export interface PledgeReceiptParams {
  owner: string;
  receiptId: number;
  pledgee: string;
}

export interface TransferReceiptParams {
  currentOwner: string;
  receiptId: number;
  newOwner: string;
}
