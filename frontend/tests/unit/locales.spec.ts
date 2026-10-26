import { expect, test } from '@playwright/test'
import { createInstance } from 'i18next'
import { readFileSync } from 'node:fs'
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

for (const root of ['i18n', 'pages/catalog', 'pages/detail', 'pages/dashboard', 'pages/methodology']) {
  test(`${root} has nonempty translations and preserves interpolation in all locales`, () => {
    const placeholders = (text: string) => [...text.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map(match => match[1]).sort()
    for (const locale of supportedLocales) {
      const resources = readTranslations(root, locale)
      for (const [key, value] of Object.entries(readTranslations(root, 'en-US'))) {
        const translated = resources[key]
        expect(translated, `${root}.${locale}.${key}`).toBeTruthy()
        expect(placeholders(translated), `${root}.${locale}.${key}`).toEqual(placeholders(value))
      }
    }
  })
}

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
