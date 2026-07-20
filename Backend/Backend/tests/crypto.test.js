import { decryptSecret, encryptSecret, isEncryptedSecret, maskSecret } from '../src/utils/crypto.js';

describe('settings crypto', () => {
  test('round-trips a secret through encrypt/decrypt', () => {
    const secret = process.env.CryptoTestsJSfile;
    const encrypted = encryptSecret(secret);

    expect(encrypted.startsWith('v1:')).toBe(true);
    expect(encrypted).not.toContain(secret);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  test('produces a different ciphertext each time (random IV)', () => {
    const secret = 'whsec_abc123';

    expect(encryptSecret(secret)).not.toBe(encryptSecret(secret));
  });

  test('rejects tampered ciphertext', () => {
    const encrypted = encryptSecret('sk_test_secret');
    const parts = encrypted.split(':');
    const corrupted = Buffer.from(parts[3], 'base64');
    corrupted[0] ^= 0xff;
    parts[3] = corrupted.toString('base64');

    expect(() => decryptSecret(parts.join(':'))).toThrow('could not be decrypted');
  });

  test('rejects malformed payloads', () => {
    expect(() => decryptSecret('not-encrypted')).toThrow('invalid format');
    expect(() => decryptSecret('')).toThrow('invalid format');
    expect(() => decryptSecret('v2:a:b:c')).toThrow('invalid format');
  });

  test('detects encrypted values', () => {
    expect(isEncryptedSecret(encryptSecret('x'))).toBe(true);
    expect(isEncryptedSecret('sk_test_plain')).toBe(false);
    expect(isEncryptedSecret(null)).toBe(false);
  });

  test('masks secrets down to the last four characters', () => {
    expect(maskSecret('sk_test_51AbCd1234')).toBe('••••1234');
    expect(maskSecret('')).toBe('');
  });
});
