import EncryptedStorage from 'react-native-encrypted-storage';
import * as token from '../services/tokenService';

jest.mock('react-native-encrypted-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('axios', () => ({ post: jest.fn(() => Promise.resolve({ data: { token: 'new', newRefresh: 'newR' } })) }));

const es = EncryptedStorage as jest.Mocked<typeof EncryptedStorage>;

beforeEach(() => {
  jest.clearAllMocks();
});

test('stores and retrieves token', async () => {
  es.getItem.mockResolvedValue('abc');
  await token.storeToken('abc');
  expect(es.setItem).toHaveBeenCalledWith('auth_token', 'abc');
  const t = await token.getToken();
  expect(t).toBe('abc');
});

test('refreshToken updates storage', async () => {
  es.getItem.mockResolvedValue('r1');
  await token.refreshToken();
  expect(es.setItem).toHaveBeenCalledWith('auth_token', 'new');
  expect(es.setItem).toHaveBeenCalledWith('refresh_token', 'newR');
});
