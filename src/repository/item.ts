import db from '../database/query';
import { sql } from '../database/sql';
import type { Item } from '../interfaces';

export const createItem = async (filters: Partial<Item>): Promise<Item> => {
  const newItem = await db.query(sql.createItem, filters);
  return newItem.rows[0];
};

export const findAllItems = async (filters?: Partial<Item>): Promise<Item[]> => {
  const items = await db.query(sql.allItems, filters);
  return items.rows;
};

export const findItem = async (filters: Partial<Item>): Promise<Item> => {
  const item = await db.query(sql.findItem, filters);
  return item.rows[0];
};

export const findItemByName = async (filters: Partial<Item>): Promise<Item> => {
    const item = await db.query(sql.findItemByName, filters);
    return item.rows[0];
  };


