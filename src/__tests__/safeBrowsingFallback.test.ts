import { verifyUrl } from '../services/safeBrowsing'
import * as fetchMod from 'react-native-ssl-pinning'

test('verifyUrl returns safe=true if API request fails', async () => {
  jest.spyOn(fetchMod, 'fetch').mockRejectedValueOnce(new Error('network'))
  const result = await verifyUrl('https://example.com')
  expect(result.isSafe).toBe(true)
})
