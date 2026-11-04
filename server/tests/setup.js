/**
 * Jest test environment setup
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.MONGO_URI =
  process.env.MONGO_URI || 'mongodb://localhost:27017/udyam?replicaSet=rs0&directConnection=true';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret-32-characters-minimum!';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-32-characters-minimum!';
process.env.OTP_MODE = 'simulated';
process.env.LLM_PROVIDER = 'mock';
process.env.KYC_REFERENCE_DATE = '2026-07-15';
process.env.FILE_ENC_KEY = '9GqoIJG6szGdKWhh+/ex0hvJN34j4P455jphaJ+QkA0=';
process.env.UPLOAD_MAX_BYTES = '5242880';
process.env.RETENTION_REJECTED_DAYS = '30';
process.env.RETENTION_APPROVED_DAYS = '180';
process.env.SIM_TIME_SCALE = '1';
process.env.QUOTE_TTL_DAYS = '7';
