import { encrypt, decrypt, encryptObject, decryptObject, generateEncryptionKey } from "../src/utils/encryption.js";

// For deterministic behaviour during tests
const ORIGINAL_KEY = process.env.ENCRYPTION_KEY;
process.env.ENCRYPTION_KEY = 'a'.repeat(64);

describe('encryption utils', () => {
  test('encrypt and decrypt roundtrip', () => {
    const plain = 'hello world';
    const cipher = encrypt(plain);
    expect(typeof cipher).toBe('string');
    expect(cipher).toContain(':');

    const round = decrypt(cipher);
    expect(round).toBe(plain);
  });

  test('encryptObject and decryptObject roundtrip', () => {
    const obj = { a: 1, b: 'x' };
    const cipher = encryptObject(obj);
    expect(typeof cipher).toBe('string');

    const parsed = decryptObject(cipher);
    expect(parsed).toEqual(obj);
  });

  test('generateEncryptionKey returns 64 hex chars', () => {
    const key = generateEncryptionKey();
    expect(typeof key).toBe('string');
    expect(key).toHaveLength(64);
    // should be valid hex
    expect(/^[0-9a-f]+$/.test(key)).toBe(true);
  });
});

describe('encryption error cases', () => {
  let prevKey;
  beforeAll(() => {
    prevKey = process.env.ENCRYPTION_KEY;
  });
  afterAll(() => {
    process.env.ENCRYPTION_KEY = prevKey;
  });

  test('encrypt returns original on invalid key', () => {
    // set invalid (short) hex key to trigger getKey error
    process.env.ENCRYPTION_KEY = '00'.repeat(10); // 20 bytes hex -> 10 bytes buffer -> will throw
    const plain = 'somedata';
    const out = encrypt(plain);
    expect(out).toBe(plain);
  });

  test('decrypt returns input when decryption fails', () => {
    process.env.ENCRYPTION_KEY = '00'.repeat(10);
    const fake = 'notaniv:deadbeef';
    const out = decrypt(fake);
    expect(out).toBe(fake);
  });
});
