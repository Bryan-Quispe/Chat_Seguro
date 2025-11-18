// Setup file para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/chatapp-test';

// Silenciar mensajes de consola durante tests para evitar ruido en la salida.
// Si necesitas ver los logs mientras depuras, exporta DEBUG_TEST_LOGS=true.
const _origError = console.error;
const _origWarn = console.warn;
const _origLog = console.log;
console.error = (...args) => {
	if (process.env.DEBUG_TEST_LOGS === 'true') return _origError(...args);
};
console.warn = (...args) => {
	if (process.env.DEBUG_TEST_LOGS === 'true') return _origWarn(...args);
};
console.log = (...args) => {
	if (process.env.DEBUG_TEST_LOGS === 'true') return _origLog(...args);
};

// Al finalizar los tests Jest restaurará el entorno del proceso, pero si quieres
// restaurar manualmente puedes usar estas referencias.
export const __restoreConsole = () => {
	console.error = _origError;
	console.warn = _origWarn;
	console.log = _origLog;
};
