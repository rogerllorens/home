import { lookupUPC } from '../services/productLookup'
import * as fetchMod from 'react-native-ssl-pinning'

jest.spyOn(fetchMod, 'fetch').mockResolvedValue({ json: () => Promise.resolve({ items: [{ title: 'Product' }] }) } as any)

test('lookupUPC returns product info', async () => {
  const res = await lookupUPC('000000')
  expect(res?.title).toBe('Product')
})
