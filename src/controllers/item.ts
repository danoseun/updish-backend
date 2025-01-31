import { RequestHandler } from 'express';
import { QueryResult } from 'pg';
import pool from '../config/database.config';
import HttpStatus from 'http-status-codes';
import {
  createItem,
  findItemByName,
  findAllItems,
  findItem,
  updateItemStatus,
  createParentItem,
  findAllParentItems,
  findParentItem,
  findParentItemByName,
  getItemsByCategory,
  findItemById
} from '../repository/item';
import { sql } from '../database/sql';
import { BadRequestError, ConflictError, ResourceNotFoundError } from '../errors';
import type { Item, ParentItem, Bundle } from '../interfaces';
import { respond, upload, removeFolder } from '../utilities';
import { uoms } from '../constants';

export const ItemController = {
  createItem: (): RequestHandler => async (req, res, next) => {
    const client = await pool.connect();

    const adminId = res.locals.admin.id;
    let itemParams = [
      adminId,
      req.body.name,
      req.body.uom,
      req.body.description,
      req.body.allergies,
      req.body.class_of_food,
      req.body.calories_per_uom,
      req.body.parent_item,
      req.body.is_active
    ];
    console.log({ itemParams });
    try {
      await client.query('BEGIN');

      const query = 'SELECT 1 FROM parent_items LIMIT 1';
      const foundParentItems = await client.query(query);
      if (!foundParentItems.rowCount) {
        return respond(res, 'create a parent item to tie this item to before creating an item', HttpStatus.BAD_REQUEST);
      }

      const existingItem = await findItemByName([itemParams[1]] as Partial<Item>);
      if (existingItem?.name === itemParams[1]) {
        respond(res, 'attempt to create an existing item unsuccessful', HttpStatus.CONFLICT);
      } else {
        const newItem = await client.query(sql.createItem, itemParams);

        //create image
        // let images: QueryResult<any>;
        // let imagesArray = [];
        // if (req.files) {
        //   //@ts-ignore
        //   let uploads = await upload(req.files.image);
        //   if (Array.isArray(uploads)) {
        //     //@ts-ignore
        //     for (let i = 0; i < uploads.length; i++) {
        //       //@ts-ignore
        //       const imageParams = [newItem.rows[0].id, uploads[i].public_id, uploads[i].secure_url];
        //       images = await client.query(sql.createImagesForItem, imageParams);
        //       imagesArray.push(images.rows[0]);
        //     }
        //   } else {
        //       //@ts-ignore
        //     const imageParams = [newItem.rows[0].id, uploads.public_id, uploads.secure_url];
        //     images = await client.query(sql.createImagesForItem, imageParams);
        //     imagesArray.push(images.rows[0]);
        //   }
        // }
        // console.log('IMAGES', imagesArray);
        await client.query('COMMIT');

        return respond(res, { item: newItem.rows[0] }, HttpStatus.CREATED);
      }
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
      console.log([`CREATE ITEM: ${error}`]);
    }
  },

  getAllItemsByCategory: (): RequestHandler => async (req, res, next) => {
    try {
      const items = await getItemsByCategory();
      return respond(res, items, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  findItemByIdDetailed: (): RequestHandler => async (req, res, next) => {
    try {
      const item = await findItemById([Number(req.params.id)] as Partial<Item>);
      return respond(res, item, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  toggleItemStatus: (): RequestHandler => async (req, res, next) => {
    const itemId = req.params.id;
    try {
      const foundItem = await findItem([itemId] as Partial<Item>);
      if (!foundItem) {
        respond(res, 'item does not exist', HttpStatus.BAD_REQUEST);
      }
      const item = await updateItemStatus([req.body.is_active, foundItem.id] as Partial<Item>);
      respond<Item>(res, item, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  fetchAllItems: (): RequestHandler => async (req, res, next) => {
    try {
      const allItems = await findAllItems();

      respond(res, allItems, HttpStatus.OK);
      return;
    } catch (error) {
      next(error);
    }
  },

  fetchAllUoms: (): RequestHandler => async (req, res, next) => {
    try {
      respond(res, uoms, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  createParentItem: (): RequestHandler => async (req, res, next) => {
    const adminId = res.locals.admin.id;
    let params = [adminId, req.body.name];
    try {
      const existingParentItem = await findParentItemByName([params[1]] as Partial<Item>);
      if (existingParentItem?.name === params[1]) {
        respond(res, 'attempt to create an existing parent item unsuccessful', HttpStatus.CONFLICT);
      } else {
        const parentItem = await createParentItem(params as Partial<Item>);

        respond<ParentItem>(res, parentItem, HttpStatus.CREATED);
        return;
      }
    } catch (error) {
      next(error);
    }
  },

  fetchAllParentItems: (): RequestHandler => async (req, res, next) => {
    try {
      const allParentItems = await findAllParentItems();

      respond(res, allParentItems, HttpStatus.OK);
      return;
    } catch (error) {
      next(error);
    }
  },

  createBundle: (): RequestHandler => async (req, res, next) => {
    const { name, items, health_impact, category, price, is_active }: Bundle & { is_active: boolean } = req.body;

    const adminId = res.locals.admin.id;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      //check for item existence before allowing bundle creation
      const query = 'SELECT 1 FROM items LIMIT 1';
      const foundItems = await client.query(query);
      if (!foundItems.rowCount) {
        return respond(res, 'create an item before creating meal bundles', HttpStatus.BAD_REQUEST);
      } else {
        const foundBundle = await client.query('SELECT COUNT(*) FROM bundles WHERE name = $1', [name]);
        console.log('2', foundBundle);

        if (foundBundle.rows[0].count > 0) {
          throw new ConflictError('A bundle with this name already exists.');
        }

        const bundleResult = await client.query(
          'INSERT INTO bundles (admin_id, name, health_impact, category, price, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [adminId, name, health_impact, category, price, is_active]
        );
        console.log('3', bundleResult);
        const bundleId = bundleResult.rows[0].id;
        //console.log('ITEMS', items);
        // const items = [
        //   { "item": 1, "qty": 3 },
        //   { "item": 2, "qty": 2 },
        //   { "item": 3, "qty": 1 }
        // ]
        const itemPromises = items.map(({ item, qty }) =>
          client.query('INSERT INTO bundle_items (bundle_id, item, qty) VALUES ($1, $2, $3)', [bundleId, item, qty])
        );
        await Promise.all(itemPromises);

        //create image
        let images: QueryResult<any>;
        let imagesArray = [];
        if (req.files) {
          //@ts-ignore
          let uploads = await upload(req.files.image);
          if (Array.isArray(uploads)) {
            //@ts-ignore
            for (let i = 0; i < uploads.length; i++) {
              //@ts-ignore
              const imageParams = [bundleResult.rows[0].id, uploads[i].public_id, uploads[i].secure_url];
              images = await client.query(sql.createImagesForBundle, imageParams);
              imagesArray.push(images.rows[0]);
            }
          } else {
            //@ts-ignore
            const imageParams = [bundleResult.rows[0].id, uploads.public_id, uploads.secure_url];
            images = await client.query(sql.createImagesForBundle, imageParams);
            imagesArray.push(images.rows[0]);
          }
        }

        await client.query('COMMIT');
        removeFolder('tmp');
        console.log('BUNDLE DATA', { bundle: bundleResult.rows[0], images: imagesArray });
        respond(res, { message: 'Bundle created successfully', bundle: bundleResult.rows[0], images: imagesArray }, HttpStatus.CREATED);
      }
      removeFolder('tmp');
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  },

  toggleBundleStatus: (): RequestHandler => async (req, res, next) => {
    const { id } = req.params;
  
    if (!id) {
      return respond(res, 'Bundle ID required', HttpStatus.NOT_FOUND);
    }
  
    try {
      const query = `
        UPDATE bundles 
        SET is_active = NOT is_active 
        WHERE id = $1 
        RETURNING id, name, is_active;
      `;
  
      const { rows } = await pool.query(query, [id]);
  
      if (rows.length === 0) {
        return respond(res, 'Bundle not found', HttpStatus.NOT_FOUND);
      }
  
      return respond(res, { message: 'Bundle  status toggled successfully', bundle: rows[0]}, HttpStatus.OK);
    } catch (error) {
      console.error('Error toggling bundle status:', error);
      next(error);
    }
  },

  getAllBundles: (): RequestHandler => async (req, res, next) => {
    try {
      const { page = 1, pageSize = 10 } = req.query;

      // Convert query parameters to integers
      const limit = parseInt(pageSize as string, 10);
      const offset = (parseInt(page as string, 10) - 1) * limit;

      const query = `
        SELECT 
          b.id AS bundle_id,
          b.name AS bundle_name,
          b.health_impact,
          b.category,
          b.price,
          b.is_active,
          json_agg(
              DISTINCT jsonb_build_object(
                  'id', bi.id,
                  'item', bi.item,
                  'qty', bi.qty
              )
          ) AS bundle_items,
          json_agg(
              DISTINCT jsonb_build_object(
                  'id', img.id,
                  'public_id', img.public_id,
                  'image_url', img.image_url
              )
          ) AS bundle_images
        FROM 
          bundles b
        LEFT JOIN 
          bundle_items bi ON b.id = bi.bundle_id
        LEFT JOIN 
          bundle_images img ON b.id = img.bundle_id
        GROUP BY 
          b.id
        ORDER BY 
          b.created_at DESC
        LIMIT $1 OFFSET $2;
      `;

      const { rows } = await pool.query(query, [limit, offset]);

      respond(
        res,
        { message: 'Bundle created successfully', page: parseInt(page as string), pageSize: parseInt(pageSize as string), data: rows },
        HttpStatus.CREATED
      );
    } catch (error) {
      console.error(`Error fetching paginated bundles:, ${error}`);
      next(error);
    }
  },

  getActiveBundles: (): RequestHandler => async (req, res, next) => {
    try {
      // Extract user_id and other parameters
      const userId = res.locals.user.id;
      if (!userId) {
        return respond(res, 'User ID is required', HttpStatus.BAD_REQUEST);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const searchQuery = req.query.search as string | undefined;

      // Get user's health goals from the `kycs` table
      const healthGoalsQuery = `
          SELECT health_goals
          FROM kycs
          WHERE user_id = $1
        `;
      const healthGoalsResult = await pool.query(healthGoalsQuery, [userId]);
      const healthGoals = healthGoalsResult.rows[0]?.health_goals;

      if (!healthGoals) {
        return respond(res, 'No health goals found for the user', HttpStatus.NOT_FOUND);
      }

      // Base Query
      let query = `
        SELECT 
        b.id AS bundle_id,
        b.name AS bundle_name,
        b.health_impact,
        b.category,
        b.price,
        b.is_active,
        json_agg(
            DISTINCT jsonb_build_object(
                'id', bi.id,
                'item', bi.item,
                'qty', bi.qty
            )
        ) AS bundle_items,
        json_agg(
            DISTINCT jsonb_build_object(
                'id', img.id,
                'public_id', img.public_id,
                'image_url', img.image_url
            )
        ) AS bundle_images
      FROM 
        bundles b
      LEFT JOIN 
        bundle_items bi ON b.id = bi.bundle_id
      LEFT JOIN 
        bundle_images img ON b.id = img.bundle_id
      WHERE 
        b.is_active = true
        AND b.health_impact ILIKE $1
      GROUP BY 
        b.id;
        `;
      let countQuery = `
          SELECT COUNT(*) AS total
          FROM bundles
          WHERE is_active = true
          AND health_impact ILIKE $1
        `;

      const params: any[] = [`%${healthGoals}%`];
      if (searchQuery) {
        query += ` AND b.name ILIKE $${params.length + 1}`;
        countQuery += ` AND name ILIKE $${params.length + 1}`;
        params.push(`%${searchQuery}%`);
      }

      query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      // Fetch paginated data
      const { rows } = await pool.query(query, params);

      // Fetch total count
      const countResult = await pool.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      // Transform flat data into nested structure
      const bundles = rows.reduce((acc: any[], row) => {
        let bundle = acc.find((b) => b.id === row.bundle_id);

        if (!bundle) {
          bundle = {
            id: row.bundle_id,
            name: row.bundle_name,
            health_impact: row.health_impact,
            price: row.price,
            is_active: row.is_active,
            created_at: row.bundle_created_at,
            updated_at: row.bundle_updated_at,
            bundle_items: []
          };
          acc.push(bundle);
        }

        let bundleItem = bundle.bundle_items.find((bi: { id: any }) => bi.id === row.bundle_item_id);
        if (!bundleItem) {
          bundleItem = {
            id: row.bundle_item_id,
            qty: row.bundle_item_qty,
            item: {
              id: row.item_id,
              name: row.item_name,
              description: row.item_description,
              category: row.item_category,
              class_of_food: row.item_class_of_food,
              calories_per_uom: row.item_calories,
              images: []
            }
          };
          bundle.bundle_items.push(bundleItem);
        }

        if (row.image_id) {
          bundleItem.item.images.push({
            id: row.image_id,
            public_id: row.image_public_id,
            image_url: row.image_url
          });
        }

        return acc;
      }, []);

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);

      return respond(res, { bundles, page, limit, total, totalPages }, HttpStatus.OK);
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  getBundleById: (): RequestHandler => async (req, res, next) => {
    try {
      const bundleId = parseInt(req.params.id);

      const query = `
        SELECT 
            b.id AS bundle_id,
            b.name AS bundle_name,
            b.health_impact,
            b.price,
            b.is_active,
            b.created_at AS bundle_created_at,
            b.updated_at AS bundle_updated_at,
            bi.id AS bundle_item_id,
            bi.qty AS bundle_item_qty,
            i.id AS item_id,
            i.name AS item_name,
            i.description AS item_description,
            i.category AS item_category,
            i.class_of_food AS item_class_of_food,
            i.calories_per_uom AS item_calories,
            ii.id AS image_id,
            ii.public_id AS image_public_id,
            ii.image_url AS image_url
        FROM bundles b
        JOIN bundle_items bi ON b.id = bi.bundle_id
        JOIN items i ON bi.item = i.id
        LEFT JOIN item_images ii ON i.id = ii.item_id
        WHERE b.id = $1;
      `;

      const { rows } = await pool.query(query, [bundleId]);

      if (rows.length === 0) {
        return respond(res, 'bundle not found', HttpStatus.NOT_FOUND);
      }

      // Transform the result into a nested structure
      const bundle = {
        id: rows[0].bundle_id,
        name: rows[0].bundle_name,
        health_impact: rows[0].health_impact,
        price: rows[0].price,
        is_active: rows[0].is_active,
        created_at: rows[0].bundle_created_at,
        updated_at: rows[0].bundle_updated_at,
        bundle_items: []
      };

      rows.forEach((row) => {
        let bundleItem = bundle.bundle_items.find((bi) => bi.id === row.bundle_item_id);
        if (!bundleItem) {
          bundleItem = {
            id: row.bundle_item_id,
            qty: row.bundle_item_qty,
            item: {
              id: row.item_id,
              name: row.item_name,
              description: row.item_description,
              category: row.item_category,
              class_of_food: row.class_of_food,
              calories_per_uom: row.item_calories,
              images: []
            }
          };
          bundle.bundle_items.push(bundleItem);
        }

        if (row.image_id) {
          bundleItem.item.images.push({
            id: row.image_id,
            public_id: row.image_public_id,
            image_url: row.image_url
          });
        }
      });

      return respond(res, bundle, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  }
};

/**
 * fetch items by category(breakfast, lunch, dinner including image(s)) - ✅
 * test toggle item status - ✅
 * fetch item by ID(include images as well) - ✅
 * single order - ✅
 * search for meal
 * multiple order - ✅
 * add multiple addresses - ✅
 * check if bundle name exists before creation - ✅
 *
 * for selecting a meal plan, you can only do that minimum of 48hrs from now
 * meals must not exceed seven for each category
 */

// const bundle = {
//     name: 'abc',
//     items: [{item: 'white rice', qty: 2}, {item: 'stew', qty: 2}, {item: 'meat', qty: 2}],
//     health_impact: 'qes',
//     price: '4,500N'
// }
