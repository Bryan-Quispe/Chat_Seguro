import { secureLog, errorLog, systemLog, setSensitiveLogging } from "../src/utils/logger.js";
import { jest } from '@jest/globals';

describe('logger utils', () => {
  let logSpy;
  let errSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Ensure default safe mode
    setSensitiveLogging(false);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errSpy.mockRestore();
    setSensitiveLogging(false);
  });

  test('secureLog masks sensitive fields', () => {
    secureLog('🔒', 'action', { nickname: 'nick', roomId: 'r1', message: 'hola' });
    expect(logSpy).toHaveBeenCalled();
    const calledWith = logSpy.mock.calls[0][0];
    expect(typeof calledWith).toBe('string');
    expect(calledWith).toContain('🔒');
    // masked nickname
    expect(calledWith).toContain('[OCULTO]');
  });

  test('secureLog with no data produces empty data string', () => {
    secureLog('🔒', 'nodata', {});
    expect(logSpy).toHaveBeenCalled();
    const calledWith = logSpy.mock.calls[0][0];
    // Should be string like '<emoji> <action> '
    expect(typeof calledWith).toBe('string');
  });

  test('secureLog with all fields masks and includes allowed keys', () => {
    const data = {
      roomId: 'r1', socketId: 's1', type: 't', mimetype: 'm', messageId: 'mid', timestamp: 123,
      cooldownMs: 10, inactiveTime: 5, nickname: 'n', sender: 's', content: 'c', message: 'm',
      targetNickname: 'tn', adminNickname: 'an', fileName: 'f', username: 'u'
    };
    secureLog('🔒', 'all', data);
    expect(logSpy).toHaveBeenCalled();
    const calledWith = logSpy.mock.calls[0][0];
    // contains masked fields marker
    expect(calledWith).toContain('[OCULTO]');
    // ensure allowed non-sensitive key appears in JSON string
    expect(calledWith).toContain('roomId');
  });

  test('errorLog prints safe context', () => {
    const err = new Error('boom');
    errorLog('do', err, { roomId: 'r2' });
    expect(errSpy).toHaveBeenCalled();
    const arg = errSpy.mock.calls[0][1];
    expect(arg).toHaveProperty('error');
    expect(arg).toHaveProperty('roomId', 'r2');
  });

  test('systemLog prints message', () => {
    systemLog('ℹ️', 'hi');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ️'));
  });

  test('secureLog prints full object when sensitive logging enabled', () => {
    setSensitiveLogging(true);
    const data = { nickname: 'nick', roomId: 'r3', content: 'hello' };
    secureLog('🔓', 'debug', data);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('🔓'), data);
  });
});
