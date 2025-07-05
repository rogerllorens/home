import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ScanScreen from '../screens/ScanScreen';
import HistoryScreen from '../screens/HistoryScreen';
import * as safe from '../services/safeBrowsing';
import * as lookup from '../services/productLookup';
import * as storage from '../utils/storage';

jest.mock('../services/safeBrowsing');
jest.mock('../services/productLookup');

const mockHistory: any[] = [];

jest.spyOn(storage, 'saveScan').mockImplementation(async rec => { mockHistory.push(rec); });
jest.spyOn(storage, 'loadHistory').mockImplementation(async () => mockHistory);

it('scans and appears in history', async () => {
  // mock services
  (safe.verifyUrl as jest.Mock).mockResolvedValue(true);
  (lookup.lookupUPC as jest.Mock).mockResolvedValue({ title: 'Test Product' });

  const { getByLabelText, getByText } = render(<ScanScreen />);
  // simulate barcode read
  fireEvent(getByLabelText('camera'), 'onBarCodeRead', {
    data: '123456',
    type: 'EAN',
  });

  await waitFor(() => {
    expect(mockHistory.length).toBe(1);
  });

  const history = render(<HistoryScreen />);
  await waitFor(() => {
    expect(history.getByText('123456')).toBeTruthy();
  });
});
