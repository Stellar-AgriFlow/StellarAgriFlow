export type SupportedLocale = 'en' | 'fr' | 'es';

export type AgriTranslationKey =
  | 'farmPassport'
  | 'escrow'
  | 'produceMarketplace'
  | 'harvestFinancing'
  | 'reputationScore'
  | 'oracleFeeds'
  | 'warehouseReceipt'
  | 'parametricInsurance'
  | 'cooperativeVault'
  | 'connectWallet'
  | 'disconnectWallet'
  | 'verifyOnChain'
  | 'metricTon'
  | 'harvestSeason'
  | 'cropVariety';

export type AgriDictionary = Readonly<Record<AgriTranslationKey, string>>;

export const AGRI_DICTIONARIES: Readonly<Record<SupportedLocale, AgriDictionary>> = Object.freeze({
  en: Object.freeze({
    farmPassport: 'Farm Passport',
    escrow: 'Escrow',
    produceMarketplace: 'Produce Marketplace',
    harvestFinancing: 'Harvest Financing',
    reputationScore: 'Reputation Score',
    oracleFeeds: 'Oracle Commodity Feeds',
    warehouseReceipt: 'Warehouse Receipt',
    parametricInsurance: 'Parametric Weather Insurance',
    cooperativeVault: 'Cooperative Vault',
    connectWallet: 'Connect Wallet',
    disconnectWallet: 'Disconnect Wallet',
    verifyOnChain: 'Verify on Stellar Explorer',
    metricTon: 'Metric Ton',
    harvestSeason: 'Harvest Season',
    cropVariety: 'Crop Variety',
  }),
  fr: Object.freeze({
    farmPassport: 'Passeport Agricole',
    escrow: 'Sequestre',
    produceMarketplace: 'Marche Agricole',
    harvestFinancing: 'Financement de Recolte',
    reputationScore: 'Score de Reputation',
    oracleFeeds: 'Flux Oracles des Matieres Premieres',
    warehouseReceipt: 'Recu d Entrepot',
    parametricInsurance: 'Assurance Climatique Parametrique',
    cooperativeVault: 'Coffre Cooperatif',
    connectWallet: 'Connecter le Portefeuille',
    disconnectWallet: 'Deconnecter le Portefeuille',
    verifyOnChain: 'Verifier sur Stellar Explorer',
    metricTon: 'Tonne Metrique',
    harvestSeason: 'Saison de Recolte',
    cropVariety: 'Variete de Culture',
  }),
  es: Object.freeze({
    farmPassport: 'Pasaporte Agricola',
    escrow: 'Deposito en Garantia',
    produceMarketplace: 'Mercado Agricola',
    harvestFinancing: 'Financiamiento de Cosecha',
    reputationScore: 'Puntaje de Reputacion',
    oracleFeeds: 'Oraculos de Precios Agricolas',
    warehouseReceipt: 'Certificado de Almacen',
    parametricInsurance: 'Seguro Climatico Parametrico',
    cooperativeVault: 'Boveda Cooperativa',
    connectWallet: 'Conectar Billetera',
    disconnectWallet: 'Desconectar Billetera',
    verifyOnChain: 'Verificar en Stellar Explorer',
    metricTon: 'Tonelada Metrica',
    harvestSeason: 'Temporada de Cosecha',
    cropVariety: 'Variedad de Cultivo',
  }),
});

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = Object.freeze(['en', 'fr', 'es']);

export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * Checks whether a string is a supported locale code (`'en' | 'fr' | 'es'`).
 */
export function isSupportedLocale(locale: unknown): locale is SupportedLocale {
  return typeof locale === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

/**
 * Resolves a raw locale tag (e.g. `'fr-SN'`, `'es-MX'`, `'en-US'`) to a `SupportedLocale`,
 * falling back to `DEFAULT_LOCALE` (`'en'`).
 */
export function resolveLocale(rawLocale?: string | null): SupportedLocale {
  if (!rawLocale || typeof rawLocale !== 'string') {
    return DEFAULT_LOCALE;
  }
  const normalized = rawLocale.trim().toLowerCase().split(/[-_]/)[0];
  if (isSupportedLocale(normalized)) {
    return normalized;
  }
  return DEFAULT_LOCALE;
}

/**
 * Returns the full dictionary for a given locale, falling back to English.
 */
export function getDictionary(locale: SupportedLocale = DEFAULT_LOCALE): AgriDictionary {
  return AGRI_DICTIONARIES[isSupportedLocale(locale) ? locale : DEFAULT_LOCALE];
}

/**
 * Translates a key for the given locale with safe fallback to the English dictionary
 * so components never break on unknown locales or missing entries.
 */
export function translate(
  key: AgriTranslationKey,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  const dict = getDictionary(locale);
  return dict[key] ?? AGRI_DICTIONARIES.en[key] ?? String(key);
}

/**
 * Stateful localization controller allowing applications and components to switch
 * active languages (`en`, `fr`, `es`) and subscribe to locale updates.
 */
export class LocalizationManager {
  private currentLocale: SupportedLocale;
  private listeners = new Set<(locale: SupportedLocale) => void>();

  constructor(initialLocale: SupportedLocale | string = DEFAULT_LOCALE) {
    this.currentLocale = resolveLocale(initialLocale);
  }

  public getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  public setLocale(nextLocale: SupportedLocale | string): SupportedLocale {
    const resolved = resolveLocale(nextLocale);
    if (resolved !== this.currentLocale) {
      this.currentLocale = resolved;
      for (const listener of this.listeners) {
        listener(this.currentLocale);
      }
    }
    return this.currentLocale;
  }

  public t(key: AgriTranslationKey): string {
    return translate(key, this.currentLocale);
  }

  public getDictionary(): AgriDictionary {
    return getDictionary(this.currentLocale);
  }

  public subscribe(listener: (locale: SupportedLocale) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const defaultLocalization = new LocalizationManager();
