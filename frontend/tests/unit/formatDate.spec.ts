import { expect, test } from '@playwright/test'
import { formatDate } from '../../src/utils/formatDate.ts'
import { getTimeZoneForLocale } from '../../src/utils/timeZone.ts'

test('converte o mesmo instante para o fuso padrão de cada locale', () => {
  const instant = '2026-10-15T01:05:00.000Z'

  expect(formatDate(instant, 'pt-BR', '—')).toContain('22:05')
  expect(formatDate(instant, 'en-US', '—')).toContain('01:05')
  expect(formatDate(instant, 'en-US', '—')).toContain('GMT')
})

test('usa o fuso brasileiro para locales desconhecidos', () => {
  expect(getTimeZoneForLocale('pt-BR')).toBe('America/Sao_Paulo')
  expect(getTimeZoneForLocale('en-US')).toBe('Etc/GMT+0')
  expect(getTimeZoneForLocale('unknown')).toBe('America/Sao_Paulo')
})

test('permite manter o fuso escolhido independente do locale da interface', () => {
  const instant = '2026-10-15T01:05:00.000Z'
  expect(formatDate(instant, 'en-US', '—', 'America/Sao_Paulo')).toContain('10:05 PM')
})

test('preserva o texto alternativo quando não há data', () => {
  expect(formatDate(null, 'en-US', 'No observation')).toBe('No observation')
})
