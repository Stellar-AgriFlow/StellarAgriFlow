import { describe, it, expect } from 'vitest';
import {
  AGRI_DICTIONARIES,
  LocalizationManager,
  getDictionary,
  resolveLocale,
  translate,
} from '../apps/web/src/i18n';

describe('Agricultural Terminology Localization (i18n)', () => {
  it('provides baseline English, French (fr), and Spanish (es) dictionaries for core agricultural terms', () => {
    expect(AGRI_DICTIONARIES.en.farmPassport).toBe('Farm Passport');
    expect(AGRI_DICTIONARIES.fr.farmPassport).toBe('Passeport Agricole');
    expect(AGRI_DICTIONARIES.es.farmPassport).toBe('Pasaporte Agricola');

    expect(AGRI_DICTIONARIES.en.escrow).toBe('Escrow');
    expect(AGRI_DICTIONARIES.fr.escrow).toBe('Sequestre');
    expect(AGRI_DICTIONARIES.es.escrow).toBe('Deposito en Garantia');

    expect(AGRI_DICTIONARIES.en.produceMarketplace).toBe('Produce Marketplace');
    expect(AGRI_DICTIONARIES.fr.produceMarketplace).toBe('Marche Agricole');
    expect(AGRI_DICTIONARIES.es.produceMarketplace).toBe('Mercado Agricola');

    expect(AGRI_DICTIONARIES.en.harvestFinancing).toBe('Harvest Financing');
    expect(AGRI_DICTIONARIES.fr.harvestFinancing).toBe('Financement de Recolte');
    expect(AGRI_DICTIONARIES.es.harvestFinancing).toBe('Financiamiento de Cosecha');
  });

  it('normalizes regional locale tags and falls back safely to English', () => {
    expect(resolveLocale('fr-SN')).toBe('fr');
    expect(resolveLocale('es_MX')).toBe('es');
    expect(resolveLocale('en-US')).toBe('en');
    expect(resolveLocale('pt-BR')).toBe('en');
    expect(resolveLocale(undefined)).toBe('en');
  });

  it('switches language strings dynamically via LocalizationManager without breaking components', () => {
    const manager = new LocalizationManager('en');
    const observedLocales: string[] = [];
    const unsubscribe = manager.subscribe((loc) => observedLocales.push(loc));

    expect(manager.t('farmPassport')).toBe('Farm Passport');

    manager.setLocale('fr');
    expect(manager.getLocale()).toBe('fr');
    expect(manager.t('farmPassport')).toBe('Passeport Agricole');
    expect(manager.t('escrow')).toBe('Sequestre');
    expect(manager.t('produceMarketplace')).toBe('Marche Agricole');
    expect(manager.t('harvestFinancing')).toBe('Financement de Recolte');

    manager.setLocale('es-CO');
    expect(manager.getLocale()).toBe('es');
    expect(manager.t('farmPassport')).toBe('Pasaporte Agricola');
    expect(manager.t('escrow')).toBe('Deposito en Garantia');
    expect(manager.t('produceMarketplace')).toBe('Mercado Agricola');
    expect(manager.t('harvestFinancing')).toBe('Financiamiento de Cosecha');

    expect(observedLocales).toEqual(['fr', 'es']);
    unsubscribe();

    expect(getDictionary('fr').farmPassport).toBe('Passeport Agricole');
    expect(translate('escrow', 'es')).toBe('Deposito en Garantia');
  });
});
