import type { CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'

import { USD } from '@payloadcms/plugin-ecommerce'

export const ecommerceCurrenciesConfig: CurrenciesConfig = {
  defaultCurrency: 'USD',
  supportedCurrencies: [USD],
}
