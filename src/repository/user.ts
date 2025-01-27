import db from '../database/query';
import { sql } from '../database/sql';
import type { User, Address, User_Image, Admin } from '../interfaces';

export const createUser = async (filters: Partial<User>): Promise<User> => {
  const newUser = await db.query(sql.createUser, filters);
  return newUser.rows[0];
};

export const createAddress = async (filters: Partial<Address>): Promise<Address> => {
  const newAddress = await db.query(sql.createAddress, filters);
  return newAddress.rows[0];
};

export const findUserByEmail = async (filters: Partial<User>): Promise<User> => {
  const foundUser = await db.query(sql.fetchUserByEmail, filters);
  return foundUser.rows[0];
};

export const findAdminByEmail = async (filters: Partial<Admin>): Promise<Admin> => {
  const foundAdmin = await db.query(sql.fetchAdminByEmail, filters);
  return foundAdmin.rows[0];
};

export const findAdminById = async (filters: Partial<Admin>): Promise<Admin> => {
  const foundAdmin = await db.query(sql.fetchUserById, filters);
  return foundAdmin.rows[0];
};

export const findUserById = async (filters: Partial<User>): Promise<User> => {
  const foundUser = await db.query(sql.fetchUserById, filters);
  return foundUser.rows[0];
};

export const updateIsEmailVerified = async (filters: Partial<User>): Promise<User> => {
  const foundUser = await db.query(sql.updateIsEmailVerified, filters);
  return foundUser.rows[0];
};

export const updateIsPhoneVerified = async (filters: Partial<User>): Promise<User> => {
  const foundUser = await db.query(sql.updateIsPhoneNumberVerified, filters);
  return foundUser.rows[0];
};

export const updateUserPushToken = async (filters: Partial<User>): Promise<User> => {
  const foundUser = await db.query(sql.updatePushToken, filters);
  return foundUser.rows[0];
};

export const findPhoneNumber = async (filters: Partial<User>): Promise<User> => {
  const foundUser = await db.query(sql.findPhoneNumber, filters);
  return foundUser.rows[0];
};

export const updateUserPhoneNumber = async (filters: Partial<User>): Promise<User> => {
  const foundUser = await db.query(sql.updateUserPhoneNumber, filters);
  return foundUser.rows[0];
};

export const updateUserPassword = async (filters: Partial<User>): Promise<User> => {
  const foundUser = await db.query(sql.updateUserPassword, filters);
  return foundUser.rows[0];
};

export const updateUserEmail = async (filters: Partial<User>): Promise<User> => {
  const foundUser = await db.query(sql.updateUserEmail, filters);
  return foundUser.rows[0];
};

export const updateImgageURL = async (filters: Partial<User_Image>): Promise<User_Image> => {
  const foundUser = await db.query(sql.uploadUserImage, filters);
  return foundUser.rows[0];
};

export const fetchUserImage = async (filters: Partial<User_Image>): Promise<User_Image> => {
  const foundUser = await db.query(sql.fetchUserImage, filters);
  return foundUser.rows[0];
};

export const deleteUserImage = async (filters: Partial<User_Image>): Promise<User_Image> => {
  const foundUser = await db.query(sql.deleteUserImage, filters);
  return foundUser.rows[0];
};

export const deactivateUser = async (filters: Partial<User>): Promise<User> => {
  const foundUser = await db.query(sql.deactivateUser, filters);
  return foundUser.rows[0];
}

export const reactivateUser = async (filters: Partial<User>): Promise<User> => {
  const foundUser = await db.query(sql.reactivateUser, filters);
  return foundUser.rows[0];
}

export const selectToReactivateUser = async (filters: Partial<User>): Promise<User> => {
  const foundUser = await db.query(sql.selectToReactivateUser, filters);
  return foundUser.rows[0];
}

export const accountsToBeDeleted = async (filters: Partial<User>): Promise<User[]> => {
  const users = await db.query(sql.accountsToBeDeleted, filters);
  return users.rows;
}

export const deleteAccountQuery = async (filters: Partial<User>): Promise<User> => {
  const user = await db.query(sql.deleteAccountQuery, filters);
  return user.rows[0];
}
