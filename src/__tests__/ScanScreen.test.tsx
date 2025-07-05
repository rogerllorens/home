import React from 'react';
import { render } from '@testing-library/react-native';
import ScanScreen from '../screens/ScanScreen';

jest.mock('../services/safeBrowsing', () => ({ verifyUrl: jest.fn(() => true) }));
jest.mock('../services/productLookup', () => ({ lookupUPC: jest.fn(() => Promise.resolve(null)) }));

it('renders camera controls', () => {
  const { getByLabelText } = render(<ScanScreen />);
  expect(getByLabelText('Toggle flash')).toBeTruthy();
});
