import crypto from 'crypto';

const HMAC_SECRET = process.env.PIN_HMAC_SECRET || 'change_this_hmac_secret_in_env';
const ENC_KEY = process.env.PIN_ENC_KEY || '00000000000000000000000000000000'; // must be 32+ bytes

function hmacPin(pin) {
  return crypto.createHmac('sha256', HMAC_SECRET).update(String(pin)).digest('hex');
}

function encryptPin(pin) {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(ENC_KEY, 'utf8').slice(0, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(pin), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptPin(blob) {
  try {
    const data = Buffer.from(blob, 'base64');
    const iv = data.slice(0, 12);
    const tag = data.slice(12, 28);
    const encrypted = data.slice(28);
    const key = Buffer.from(ENC_KEY, 'utf8').slice(0, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    return null;
  }
}

export { hmacPin, encryptPin, decryptPin };
