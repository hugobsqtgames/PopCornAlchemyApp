import { getLocales } from 'expo-localization';

import { deviceLang, langOf } from '../device';

jest.mock('expo-localization', () => ({ getLocales: jest.fn() }));
const locales = (...codes: (string | null)[]) => (getLocales as jest.Mock).mockReturnValue(codes.map((languageCode) => ({ languageCode })));

describe('phone language', () => {
  it('speaks the phone language when the app knows it', () => {
    locales('es');
    expect(deviceLang()).toBe('es');
    locales('fr');
    expect(deviceLang()).toBe('fr');
  });
  it('takes the first known language in the phone order', () => {
    locales('de', 'fr', 'en');
    expect(deviceLang()).toBe('fr');
  });
  it('falls back to English for any other language', () => {
    locales('ja');
    expect(deviceLang()).toBe('en');
    locales();
    expect(deviceLang()).toBe('en');
    locales(null);
    expect(deviceLang()).toBe('en');
  });
  it('falls back to English when the phone gives no locale', () => {
    (getLocales as jest.Mock).mockImplementation(() => {
      throw new Error('no locales');
    });
    expect(deviceLang()).toBe('en');
  });
  it('keeps the language the player picked', () => {
    locales('es');
    expect(langOf('fr')).toBe('fr');
    expect(langOf(null)).toBe('es');
  });
});
