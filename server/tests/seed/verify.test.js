import mongoose from 'mongoose';
import { verifySeed } from '../../seed/verify.js';
import { config } from '../../src/config/env.js';

describe('Phase 1: Seed and Registry Verification Suite', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.MONGO_URI);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  it('passes all Section 3 and Section 7 assertions with zero failures', async () => {
    const { valid, failures } = await verifySeed();
    if (!valid) {
      console.error('Seed verification failures:', failures);
    }
    expect(failures).toEqual([]);
    expect(valid).toBe(true);
  });
});
