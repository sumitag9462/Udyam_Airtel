import mongoose from 'mongoose';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from '../src/config/env.js';
import logger from '../src/config/logger.js';
import {
  Product,
  CityTier,
  GstinRegistry,
  UdyamRegistry,
  Lead,
  User,
} from '../src/models/index.js';
import fsSync from 'node:fs';
import {
  parseProductCatalogue,
  parseGstinRegistry,
  parseUdyamRegistry,
  parseSmbLeads,
} from './parse.js';

const DATA_DIR = [
  path.resolve(process.cwd(), '../data'),
  path.resolve(process.cwd(), 'data'),
  path.resolve(process.cwd(), 'udyam-one/data'),
].find((d) => fsSync.existsSync(d)) || path.resolve(process.cwd(), '../data');

/**
 * Compute phone hash (HMAC-SHA256 with JWT secret as pepper)
 */
export function hashPhone(phone) {
  const digits = String(phone).replace(/\D/g, '').slice(-10);
  return crypto.createHmac('sha256', config.JWT_ACCESS_SECRET).update(digits).digest('hex');
}

/**
 * Seed all collections idempotently
 */
export async function seed(options = {}) {
  const dataDir = options.dataDir || DATA_DIR;
  const isConnected = mongoose.connection.readyState === 1;

  if (!isConnected) {
    logger.info('Connecting to MongoDB for seeding...');
    await mongoose.connect(config.MONGO_URI);
  }

  logger.info({ dataDir }, 'Starting database seed...');

  // 1. Products
  const productsData = parseProductCatalogue(path.join(dataDir, 'product_catalogue.csv'));
  const productOps = productsData.map((p) => ({
    updateOne: {
      filter: { productId: p.productId },
      update: { $set: p },
      upsert: true,
    },
  }));
  const productRes = await Product.bulkWrite(productOps);
  logger.info(
    {
      total: productsData.length,
      upserted: productRes.upsertedCount,
      modified: productRes.modifiedCount,
    },
    'Products seeded'
  );

  // 2. GSTIN Registry
  const gstinData = parseGstinRegistry(path.join(dataDir, 'mock_gstin_registry.csv'));
  const gstinOps = gstinData.map((g) => ({
    updateOne: {
      filter: { gstin: g.gstin },
      update: { $set: g },
      upsert: true,
    },
  }));
  const gstinRes = await GstinRegistry.bulkWrite(gstinOps);
  logger.info(
    { total: gstinData.length, upserted: gstinRes.upsertedCount, modified: gstinRes.modifiedCount },
    'GSTIN registry seeded'
  );

  // 3. Udyam Registry
  const udyamData = parseUdyamRegistry(path.join(dataDir, 'mock_udyam_registry.csv'));
  const udyamOps = udyamData.map((u) => ({
    updateOne: {
      filter: { udyamNumber: u.udyamNumber },
      update: { $set: u },
      upsert: true,
    },
  }));
  const udyamRes = await UdyamRegistry.bulkWrite(udyamOps);
  logger.info(
    { total: udyamData.length, upserted: udyamRes.upsertedCount, modified: udyamRes.modifiedCount },
    'Udyam registry seeded'
  );

  // 4. Leads & CityTiers
  const { leads: leadsData, cityTiers: cityTiersData } = parseSmbLeads(
    path.join(dataDir, 'smb_leads.csv')
  );

  // CityTiers
  const cityOps = cityTiersData.map((c) => ({
    updateOne: {
      filter: { city: c.city },
      update: { $set: c },
      upsert: true,
    },
  }));
  const cityRes = await CityTier.bulkWrite(cityOps);
  logger.info(
    {
      total: cityTiersData.length,
      upserted: cityRes.upsertedCount,
      modified: cityRes.modifiedCount,
    },
    'City tiers seeded'
  );

  // Leads (batch in chunks of 1000 for efficient bulkWrite)
  const CHUNK_SIZE = 1000;
  let leadsUpserted = 0;
  let leadsModified = 0;

  for (let i = 0; i < leadsData.length; i += CHUNK_SIZE) {
    const chunk = leadsData.slice(i, i + CHUNK_SIZE);
    const leadOps = chunk.map((lead) => ({
      updateOne: {
        filter: { leadId: lead.leadId },
        update: { $set: lead },
        upsert: true,
      },
    }));
    const leadRes = await Lead.bulkWrite(leadOps);
    leadsUpserted += leadRes.upsertedCount;
    leadsModified += leadRes.modifiedCount;
  }
  logger.info(
    { total: leadsData.length, upserted: leadsUpserted, modified: leadsModified },
    'Leads seeded'
  );

  // 5. Seed Demo Staff and Owner Users
  const staffPassword = config.STAFF_SEED_PASSWORD || 'DemoPassword123!';
  const passwordHash = await bcrypt.hash(staffPassword, 12);

  const demoUsers = [
    {
      role: 'admin',
      email: 'admin@airtel.com',
      passwordHash,
      language: 'en',
    },
    {
      role: 'advisor',
      email: 'advisor@airtel.com',
      passwordHash,
      language: 'en',
    },
    {
      role: 'partner',
      email: 'partner@airtel.com',
      partnerOrg: 'City Networks',
      passwordHash,
      language: 'en',
    },
    {
      role: 'owner',
      phoneHash: hashPhone('9876543210'),
      phoneLast4: '3210',
      language: 'hi',
    },
  ];

  for (const u of demoUsers) {
    const filter = u.email ? { email: u.email } : { phoneHash: u.phoneHash };
    await User.updateOne(filter, { $set: u }, { upsert: true });
  }
  logger.info('Demo staff and owner accounts seeded');

  logger.info('Database seeding completed successfully');
}

// Execute directly if run as main script
if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
  try {
    await seed();
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    logger.fatal({ err }, 'Seeding failed');
    process.exit(1);
  }
}
