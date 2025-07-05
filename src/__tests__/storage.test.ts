import { saveScan, loadHistory } from '../utils/storage'
import * as storageService from '../services/storageService'

beforeEach(() => {
  jest.spyOn(storageService, 'get').mockResolvedValue(null)
  jest.spyOn(storageService, 'set').mockResolvedValue()
})

test('saveScan stores record', async () => {
  await saveScan({content:'abc', type:'URL', date:1})
  expect(storageService.set).toHaveBeenCalled()
})

