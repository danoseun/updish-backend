import pool from '../../config/database.config';
import format from 'pg-format';
import { logger } from '../../utilities';

const bundleImagesData = [
  [1, 'morning_delight_img', 'https://res.cloudinary.com/deun9d8uj/image/upload/v1739348574/Chole-Bhature_ep7abp.jpg'],
  [2, 'lunch_combo_img', 'https://res.cloudinary.com/deun9d8uj/image/upload/v1739281841/gxpkndj6ex427j5zzoli.jpg'],
  [3, 'dinner_special_img', 'https://res.cloudinary.com/deun9d8uj/image/upload/v1739281496/ahh1hif9qrzd00ltqnpy.jpg'],
  [4, 'all_day_meal_img', 'https://res.cloudinary.com/deun9d8uj/image/upload/v1739348572/1590373-biryani-1513939158_ixkvrr.gif'],
  [5, 'quick_bite_img', 'https://res.cloudinary.com/deun9d8uj/image/upload/v1739348574/Chole-Bhature_ep7abp.jpg'],
  [6, 'evening_feast_img', 'https://res.cloudinary.com/deun9d8uj/image/upload/v1739281841/gxpkndj6ex427j5zzoli.jpg'],
  [7, 'early_bird_img', 'https://res.cloudinary.com/deun9d8uj/image/upload/v1739281496/ahh1hif9qrzd00ltqnpy.jpg'],
  [8, 'family_meal_img', 'https://res.cloudinary.com/deun9d8uj/image/upload/v1739348572/1590373-biryani-1513939158_ixkvrr.gif'],
  [9, 'vegetarian_special_img', 'https://res.cloudinary.com/deun9d8uj/image/upload/v1739348574/Chole-Bhature_ep7abp.jpg'],
  [10, 'gourmet_dinner_img', 'https://res.cloudinary.com/deun9d8uj/image/upload/v1739281841/gxpkndj6ex427j5zzoli.jpg']
];

const sql = format('INSERT INTO bundle_images (bundle_id, public_id, image_url) VALUES %L returning id', bundleImagesData);

/**
 * Seed function for bundle_images.
 */
export async function seedBundleImages(): Promise<void> {
  try {
    const result = await pool.query(sql);
    console.log(`bundle_images ${result.command}ED`);
    logger.info(`bundle_images ${result.command}ED`);
  } catch (error) {
    console.error(`seedBundleImages: ${error}`);
    logger.error(`seedBundleImages: ${error}`);
  }
}
