import sharp from 'sharp';
import logger from '../../config/logger.js';

const BLUR_VARIANCE_THRESHOLD = 50.0;

/**
 * Assess image quality and detect blur using the Laplacian variance algorithm.
 * @param {Buffer|string} input - Image buffer or file path
 * @returns {Promise<{ isBlurred: boolean, variance: number, width: number, height: number }>}
 */
export async function assessImageQuality(input) {
  try {
    const image = sharp(input);
    const metadata = await image.metadata();

    const { data, info } = await image
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const w = info.width;
    const h = info.height;
    let sum = 0;
    let sumSq = 0;
    let count = 0;

    // Sample pixels using 3x3 discrete Laplacian operator:
    // [  0,  1,  0 ]
    // [  1, -4,  1 ]
    // [  0,  1,  0 ]
    for (let y = 1; y < h - 1; y += 2) {
      for (let x = 1; x < w - 1; x += 2) {
        const val =
          data[(y - 1) * w + x] +
          data[(y + 1) * w + x] +
          data[y * w + (x - 1)] +
          data[y * w + (x + 1)] -
          4 * data[y * w + x];
        sum += val;
        sumSq += val * val;
        count++;
      }
    }

    const mean = sum / count;
    const variance = sumSq / count - mean * mean;

    return {
      isBlurred: variance < BLUR_VARIANCE_THRESHOLD,
      variance: Math.round(variance * 100) / 100,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (err) {
    logger.warn({ err }, 'Image quality evaluation failed, assuming acceptable');
    return {
      isBlurred: false,
      variance: 100.0,
      width: 0,
      height: 0,
    };
  }
}
