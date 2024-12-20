import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs-extra';
import variables from '../variables';

cloudinary.config({
  cloud_name: variables.services.cloudinary.cloudName,
  api_key: variables.services.cloudinary.apiKey,
  api_secret: variables.services.cloudinary.apiSecret
});

/**
 * utility to handle file upload
 */

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
}

export const upload = async (file: { map: (arg0: (img: any) => Promise<CloudinaryResponse | CloudinaryResponse[]>) => any; tempFilePath: any }) => {
  //let result: CloudinaryResponse[];
  try {
    if (Array.isArray(file)) {
      let uploads = file.map(async (img) => {
        return await cloudinary.uploader.upload(img.tempFilePath, { resource_type: 'auto' });
      });
      let resolvedUploads = await Promise.all(uploads);
      let result = resolvedUploads.map((obj) => ({ secure_url: obj.secure_url, public_id: obj.public_id }));
      return result;
    } else {
      let result: CloudinaryResponse = await cloudinary.uploader.upload(file.tempFilePath, { resource_type: 'auto' });
      return {
        public_id: result.public_id,
        secure_url: result.secure_url
      };
    }
  } catch (error) {
    throw error;
  }
};

export const deleteImage = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === 'ok') {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Utility to remove tmp folder after each upload
 */
export const removeFolder = async (folder: string) => {
  try {
    await fs.remove(folder);
    console.log('tmp folder successfully removed!');
  } catch (err) {
    console.error(err);
  }
};
