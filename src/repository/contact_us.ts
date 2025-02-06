import db from '../database/query';
import { sql } from '../database/sql';
import type { Contact_US } from '../interfaces';

export const createContactUS = async (filters: Partial<Contact_US>): Promise<Contact_US> => {
  const newContactUS = await db.query(sql.createContactUS, filters);
  return newContactUS.rows[0];
};
