import db from '../database/query';
import pool from '../config/database.config';
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

export const updateItemStatus = async(filters: Partial<Item>): Promise<Item> => {
    const item = await db.query(sql.updateItemStatus, filters);
    return item.rows[0];
}

export const createParentItem = async (filters: Partial<Item>): Promise<Item> => {
    const newItem = await db.query(sql.createParentItem, filters);
    return newItem.rows[0];
 };
  
  export const findAllParentItems = async (filters?: Partial<Item>): Promise<Item[]> => {
    const items = await db.query(sql.allParentItems, filters);
    return items.rows;
  };
  
  export const findParentItem = async (filters: Partial<Item>): Promise<Item> => {
    const item = await db.query(sql.findParentItem, filters);
    return item.rows[0];
  };
  
  export const findParentItemByName = async (filters: Partial<Item>): Promise<Item> => {
      const item = await db.query(sql.findParentItemByName, filters);
      return item.rows[0];
  };

  export const getItemsByCategory = async (filters?: Partial<Item>): Promise<Item[]> => {
    const items = await db.query(sql.itemsByCategory, filters);
    return items.rows;
  };

  export const findItemById = async (filters: Partial<Item>): Promise<Item> => {
    const item = await db.query(sql.fetchItemByIdDetailed, filters);
    return item.rows[0];
};

export async function getActiveMealBundles(
  userId: number,
  page: number,
  limit: number,
  searchTerm?: string | null,
  category?: string | null
) {
  const offset = (page - 1) * limit;

  try {
    // Get user health goals from the KYC table
    const userGoalsResult = await pool.query(
      'SELECT health_goals FROM kycs WHERE user_id = $1',
      [userId]
    );

    if (userGoalsResult.rows.length === 0) {
      return { bundles: [], total: 0 };
    }

    const healthGoals = userGoalsResult.rows[0].health_goals;

    // Build dynamic query with search and category filters
    const bundlesQuery = `
      SELECT b.id, b.name, b.health_impact, b.category, b.price, 
             json_agg(DISTINCT bi.*) AS bundle_items,
             json_agg(DISTINCT img.*) AS bundle_images
      FROM bundles b
      LEFT JOIN bundle_items bi ON b.id = bi.bundle_id
      LEFT JOIN bundle_images img ON b.id = img.bundle_id
      WHERE b.is_active = true
        AND (b.health_impact && $1)
        ${searchTerm ? `AND b.name ILIKE '%${searchTerm}%'` : ''}
        ${category ? `AND b.category = '${category}'` : ''}
      GROUP BY b.id
      ORDER BY b.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const bundlesResult = await pool.query(bundlesQuery, [healthGoals, limit, offset]);

    // Get total count of matching bundles
    const countQuery = `
      SELECT COUNT(*)
      FROM bundles b
      WHERE b.is_active = true
        AND (b.health_impact && $1)
        ${searchTerm ? `AND b.name ILIKE '%${searchTerm}%'` : ''}
        ${category ? `AND b.category = '${category}'` : ''};
    `;
    const countResult = await pool.query(countQuery, [healthGoals]);

    const total = parseInt(countResult.rows[0].count, 10);

    return { bundles: bundlesResult.rows, total };
  } catch (error) {
    console.error('Error fetching active meal bundles:', error);
    throw error;
  }
}



