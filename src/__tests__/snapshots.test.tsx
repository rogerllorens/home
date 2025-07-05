import React from 'react';
import renderer from 'react-test-renderer';
import ScanScreen from '../screens/ScanScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HistoryScreen from '../screens/HistoryScreen';

jest.mock('lottie-react-native', () => 'LottieView');

it('renders ScanScreen', () => {
  const tree = renderer.create(<ScanScreen />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('renders OnboardingScreen', () => {
  const tree = renderer.create(<OnboardingScreen onDone={() => {}} />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('renders HistoryScreen', () => {
  const tree = renderer.create(<HistoryScreen />).toJSON();
  expect(tree).toMatchSnapshot();
});
