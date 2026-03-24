/**
 * Formatea un número como moneda MXN
 */
export function formatCurrency(amount: number, currency: string = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formatea un número corto para mostrar en tarjetas
 */
export function formatCurrencyShort(amount: number, currency: string = 'MXN'): string {
  const absAmount = Math.abs(amount)
  if (absAmount >= 1000000) {
    return `${amount < 0 ? '-' : ''}$${(absAmount / 1000000).toFixed(1)}M`
  }
  if (absAmount >= 1000) {
    return `${amount < 0 ? '-' : ''}$${(absAmount / 1000).toFixed(1)}K`
  }
  return formatCurrency(amount, currency)
}

/**
 * Parsea un string de moneda a número
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}
