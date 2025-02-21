import crypto, { randomBytes } from 'crypto';

export const generateRandomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

export const generateRandomPassword = (length: number = 12): string => {
  const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*()+[]{};:,<>?';
  let password = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    const index = randomBytes[i] % allowedChars.length;
    password += allowedChars[index];
  }

  return password;
};

export const generateRandomId = () => {
  return randomBytes(4).toString('hex');
};

export const generateDeliveryNoteCode = () => {
  return `DN-${generateRandomId()}`;
};

export const generateDeliveryTripCode = () => {
  return `DT-${generateRandomId()}`;
};
