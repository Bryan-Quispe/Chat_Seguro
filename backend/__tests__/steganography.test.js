import fs from 'fs';
import os from 'os';
import path from 'path';
import { detectSteganography, quickValidation } from '../src/utils/steganographyDetector.js';
import { jest } from '@jest/globals';

describe('steganography detector basic cases', () => {
  const tmpDir = os.tmpdir();

  test('detects trailing appended ZIP after JPEG EOI', async () => {
    // JPEG minimal header + EOI
    const jpegHeader = Buffer.from([0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01]);
    const eoi = Buffer.from([0xFF,0xD9]);
    const zipSig = Buffer.from([0x50,0x4B,0x03,0x04]);

    const fileBuf = Buffer.concat([jpegHeader, eoi, Buffer.alloc(1024,0x00), zipSig, Buffer.from('PK...')]);
    const tmp = path.join(tmpDir, `test_jpeg_trailing_${Date.now()}.jpg`);
    fs.writeFileSync(tmp, fileBuf);

    const res = await detectSteganography(tmp);
    expect(res).toHaveProperty('trailingData');
    expect(res.trailingData).not.toBeNull();
    expect(res.trailingData.suspicious).toBeTruthy();

    // cleanup
    fs.unlinkSync(tmp);
  });

  test('returns safe for minimal PNG with IEND and no trailing', async () => {
    // PNG signature + IHDR minimal + IEND
    const pngSig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
    // fake IHDR chunk (length 0 + type IHDR + crc) and IEND
    const ihdr = Buffer.from([0x00,0x00,0x00,0x00, 0x49,0x48,0x44,0x52, 0x00,0x00,0x00,0x00]);
    const iend = Buffer.from([0x00,0x00,0x00,0x00, 0x49,0x45,0x4E,0x44, 0xAE,0x42,0x60,0x82]);
    const buf = Buffer.concat([pngSig, ihdr, iend]);
    const tmp = path.join(tmpDir, `test_png_minimal_${Date.now()}.png`);
    fs.writeFileSync(tmp, buf);

    const res = await detectSteganography(tmp);
    expect(res.safe).toBeTruthy();

    fs.unlinkSync(tmp);
  });

  test('quickValidation blocks .exe extension', () => {
    const out = quickValidation('application/octet-stream', 'malicious.exe');
    expect(out.safe).toBe(false);
  });
});
