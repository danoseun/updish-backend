import db from '../database/query';
import { sql } from '../database/sql';
import type { KYC } from '../interfaces';

export const createKYC = async (filters: Partial<KYC>): Promise<KYC> => {
  const newKyc = await db.query(sql.createKYC, filters);
  return newKyc.rows[0];
};

export const findUserKYC = async (filters: Partial<KYC>): Promise<KYC> => {
  const foundKyc = await db.query(sql.findKYC, filters);
  return foundKyc.rows[0];
};