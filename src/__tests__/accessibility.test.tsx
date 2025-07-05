import React from 'react';
import { render } from '@testing-library/react-native';
import { axe } from 'jest-axe';
import ScanScreen from '../screens/ScanScreen.tsx';

test('scan screen accessible', async () => {
  const { container } = render(<ScanScreen />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
