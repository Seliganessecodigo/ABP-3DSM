import { expect, test } from '@playwright/test'
import { createInstance } from 'i18next'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { supportedLocales } from '../../src/i18n/types.ts'
import { getTimeZoneForLocale } from '../../src/utils/timeZone.ts'

function readTranslations(root: string, locale: string): Record<string, string> {
  const parsed: unknown = JSON.parse(readFileSync(new URL(`../../src/${root}/locales/${locale}.json`, import.meta.url), 'utf8'))
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error(`Invalid locale ${root}/${locale}`)
  return Object.fromEntries(Object.entries(parsed).map(([key, value]) => {
    if (typeof value !== 'string') throw new Error(`Invalid translation ${root}/${locale}/${key}`)
    return [key, value]
  }))
}

const pageRoots = readdirSync(new URL('../../src/pages/', import.meta.url))
  .filter(page => existsSync(new URL(`../../src/pages/${page}/i18n.ts`, import.meta.url)))
  .map(page => `pages/${page}`)

for (const root of ['i18n', ...pageRoots]) {
  test(`${root} has nonempty translations and preserves interpolation in all locales`, () => {
    const placeholders = (text: string) => [...text.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map(match => match[1]).sort()
    for (const locale of supportedLocales) {
      const resources = readTranslations(root, locale)
      for (const [key, value] of Object.entries(readTranslations(root, 'en-US'))) {
        const translated = resources[key]
        expect(translated?.trim(), `${root}.${locale}.${key}`).toBeTruthy()
        expect(placeholders(translated), `${root}.${locale}.${key}`).toEqual(placeholders(value))
        expect(translated, `${root}.${locale}.${key}`).not.toMatch(/\?{2,}|\p{L}\?\p{L}|\uFFFD/u)
      }
    }
  })
}

test('authentication and history controls are translated without copied English or romanized Japanese', () => {
  for (const locale of supportedLocales.filter(locale => locale !== 'en-US')) {
    for (const root of ['pages/login', 'pages/detail']) {
      const english = readTranslations(root, 'en-US')
      const translated = readTranslations(root, locale)
      const keys = root === 'pages/login' ? Object.keys(english) : [
        'analysisSeriesFrom', 'analysisSeriesTo', 'analysisSeriesTimeZone', 'analysisSeriesInvalidDateRange',
        'analysisSeriesApply', 'analysisSeriesCloseFilters', 'historyNoFilters', 'historyActiveFilters',
      ]
      for (const key of keys) {
        // “Password” is also the conventional Italian label.
        if (!(root === 'pages/login' && locale === 'it-IT' && key === 'password')) {
          expect(translated[key], `${root}.${locale}.${key}`).not.toBe(english[key])
        }
        expect(translated[key], `${root}.${locale}.${key}`).not.toMatch(/US-\d+|Shuukei/)
      }
    }
  }
})

test('new locales use their configured time zone and valid Intl formatting', () => {
  for (const [locale, zone] of [['ko-KR', 'Asia/Seoul'], ['ru-RU', 'Europe/Moscow'], ['hi-IN', 'Asia/Kolkata'], ['id-ID', 'Asia/Jakarta']]) {
    expect(getTimeZoneForLocale(locale)).toBe(zone)
    expect(new Intl.DateTimeFormat(locale, { timeZone: zone }).format(new Date('2026-10-15T01:05:00Z'))).toBeTruthy()
    expect(new Intl.NumberFormat(locale).format(1234.5)).toBeTruthy()
  }
})

test('Russian application counts use singular, few and many forms', async () => {
  const i18n = createInstance()
  await i18n.init({ lng: 'ru-RU', resources: { 'ru-RU': { translation: readTranslations('pages/catalog', 'ru-RU') } }, keySeparator: false })
  expect(i18n.t('total', { count: 1 })).toBe('1 приложение')
  expect(i18n.t('total', { count: 2 })).toBe('2 приложения')
  expect(i18n.t('total', { count: 5 })).toBe('5 приложений')
})
