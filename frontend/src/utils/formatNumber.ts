export function formatNumber(value: number, locale: string) {
  const options = value !== 0 && Math.abs(value) < 0.005
    ? { maximumSignificantDigits: 3 }
    : { maximumFractionDigits: 2 }
  return new Intl.NumberFormat(locale, options).format(value)
}
