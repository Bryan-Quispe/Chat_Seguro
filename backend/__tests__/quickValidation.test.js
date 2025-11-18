import { quickValidation } from "../src/utils/steganographyDetector.js";

describe('steganographyDetector quickValidation', () => {
  test('blocks dangerous extension', () => {
    const res = quickValidation('application/octet-stream', 'bad.exe');
    expect(res.safe).toBe(false);
  });

  test('allows benign pdf', () => {
    const res = quickValidation('application/pdf', 'doc.pdf');
    expect(res.safe).toBe(true);
  });

  test('blocks dangerous mimetype', () => {
    const res = quickValidation('application/x-msdownload', 'file.bin');
    expect(res.safe).toBe(false);
  });
});
