import { verifyUrl } from '../services/safeBrowsing'

test('verifyUrl returns object with isSafe', async () => {
  const result = await verifyUrl('https://example.com')
  expect(typeof result.isSafe).toBe('boolean')
})
