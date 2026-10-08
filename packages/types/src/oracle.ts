export interface CommodityPrice {
  commodity: 'Maize' | 'Soybeans' | 'Wheat' | 'Coffee' | 'Cocoa';
  priceUsdPerTon: number;
  priceXlmPerTon: number;
  change24hPercent: number;
  lastUpdated: number;
  source: string;
}

export interface WeatherRiskIndex {
  region: string;
  country: string;
  rainfallMm: number;
  temperatureCelsius: number;
  droughtRisk: 'Low' | 'Moderate' | 'Elevated' | 'High';
  harvestOutlook: 'Favorable' | 'Average' | 'Stressed';
  lastUpdated: number;
}

export interface OracleFeedData {
  prices: CommodityPrice[];
  weather: WeatherRiskIndex[];
  xlmUsdRate: number;
  oracleProvider: string;
  isExternalData: boolean;
}
