import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { config } from '../../config/env.js';

export default class LocalEncryptedStorageProvider {
  constructor(baseDir = null) {
    const defaultDataDir = [
      path.resolve(process.cwd(), '../data'),
      path.resolve(process.cwd(), 'data'),
      path.resolve(process.cwd(), 'udyam-one/data'),
    ].find((d) => fsSync.existsSync(d)) || path.resolve(process.cwd(), '../data');

    this.baseDir = baseDir || path.join(defaultDataDir, 'encrypted_uploads');
    this.encKey = Buffer.from(config.FILE_ENC_KEY, 'base64');
    if (this.encKey.length !== 32) {
      throw new Error(`Invalid FILE_ENC_KEY length: expected 32 bytes, got ${this.encKey.length}`);
    }
  }

  async init() {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  /**
   * Encrypt and store a file buffer using AES-256-GCM.
   * Format on disk: [12-byte IV][16-byte Auth Tag][Ciphertext]
   * @param {Buffer} buffer - Plaintext file bytes
   * @param {string} filename - Target filename or key
   * @returns {Promise<{ storageKey: string, sizeBytes: number }>}
   */
  async saveFile(buffer, filename) {
    await this.init();

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encKey, iv);

    const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const encryptedPayload = Buffer.concat([iv, authTag, ciphertext]);

    const sanitizedFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${Date.now()}_${sanitizedFilename}.enc`;
    const fullPath = path.join(this.baseDir, storageKey);

    await fs.writeFile(fullPath, encryptedPayload);

    return {
      storageKey,
      sizeBytes: buffer.length,
      encryptedSizeBytes: encryptedPayload.length,
    };
  }

  /**
   * Read and decrypt an encrypted file from disk.
   * Verifies GCM authentication tag before returning plaintext.
   * @param {string} storageKey
   * @returns {Promise<Buffer>} Plaintext file buffer
   */
  async readFile(storageKey) {
    const fullPath = path.join(this.baseDir, path.basename(storageKey));
    const encryptedPayload = await fs.readFile(fullPath);

    if (encryptedPayload.length < 28) {
      throw new Error('Corrupted encrypted file: payload too short');
    }

    const iv = encryptedPayload.subarray(0, 12);
    const authTag = encryptedPayload.subarray(12, 28);
    const ciphertext = encryptedPayload.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  /**
   * Delete an encrypted file.
   * @param {string} storageKey
   */
  async deleteFile(storageKey) {
    try {
      const fullPath = path.join(this.baseDir, path.basename(storageKey));
      await fs.unlink(fullPath);
    } catch {
      // Ignore if already deleted
    }
  }
}
