import { lookupUPC } from '../services/productLookup'
import * as fetchMod from 'react-native-ssl-pinning'

const first = {json: async () => {throw new Error('fail')}}
const second = {json: async () => ({name: 'demo'})}

it('falls back to barcode.monster when UPCitemdb fails', async () => {
  const spy = jest.spyOn(fetchMod, 'fetch')
  spy.mockResolvedValueOnce(first as any)
  spy.mockResolvedValueOnce(second as any)
  const res = await lookupUPC('123')
  expect(res).toEqual({name: 'demo'})
})
