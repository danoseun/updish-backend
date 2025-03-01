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
  findItemById,
  getActiveMealBundles
} from '../repository/item';
import { sql } from '../database/sql';
import { BadRequestError, ConflictError, ResourceNotFoundError } from '../errors';
import type { Item, ParentItem, Bundle } from '../interfaces';
import { respond, upload, removeFolder } from '../utilities';
import { uoms } from '../constants';
import { validateItemArrayObjects } from '../utilities';

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
    const { name, items, health_impact, category, price, is_active, is_extra }: Bundle & { is_active: boolean; is_extra?: boolean } = req.body;

    const adminId = res.locals.admin.id;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check for item existence before allowing bundle creation
      const query = 'SELECT 1 FROM items LIMIT 1';
      const foundItems = await client.query(query);

      if (!foundItems.rowCount) {
        return respond(res, 'Create an item before creating meal bundles', HttpStatus.BAD_REQUEST);
      } else {
        const foundBundle = await client.query('SELECT COUNT(*) FROM bundles WHERE name = $1', [name]);
        console.log('2', foundBundle);

        if (foundBundle.rows[0].count > 0) {
          throw new ConflictError('A bundle with this name already exists.');
        }

        // If `is_extra` is provided, include it in the insert query, otherwise, default to `false`
        const bundleResult = await client.query(
          'INSERT INTO bundles (admin_id, name, health_impact, category, price, is_active, is_extra) VALUES ($1, $2, $3::text[], $4::text[], $5, $6, $7) RETURNING id',
          [adminId, name, health_impact, category, price, is_active, is_extra ?? false] // Default to false if is_extra is not provided
        );
        console.log('3', bundleResult);
        const bundleId = bundleResult.rows[0].id;

        const itemPromises = items.map(({ item, qty }) =>
          client.query('INSERT INTO bundle_items (bundle_id, item, qty) VALUES ($1, $2, $3)', [bundleId, item, qty])
        );
        await Promise.all(itemPromises);

        // Create image
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

      return respond(res, { message: 'Bundle  status toggled successfully', bundle: rows[0] }, HttpStatus.OK);
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
        HttpStatus.OK
      );
    } catch (error) {
      console.error(`Error fetching paginated bundles:, ${error}`);
      next(error);
    }
  },

  getActiveBundles: (): RequestHandler => async (req, res, next) => {
    const userId = res.locals.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchTerm = req.query.search as string | null;
    const category = req.query.category as string | null;

    try {
      const result = await getActiveMealBundles(userId, page, limit, searchTerm, category);
      return respond(res, { bundles: result.bundles, total: result.total, page, limit }, HttpStatus.OK);
    } catch (error) {
      console.error(`Failed to fetch meal bundles, ${error}`);
      next(error);
    }
  },

  getBundleById: (): RequestHandler => async (req, res, next) => {
    const bundleId = parseInt(req.params.id);

    const query = `
    SELECT 
    b.id AS bundle_id,
    b.admin_id,
    b.name AS bundle_name,
    b.health_impact,
    b.category,
    b.price,
    b.is_extra,
    b.is_active,
    b.created_at AS bundle_created_at,
    b.updated_at AS bundle_updated_at,
    bi.id AS bundle_item_id,
    bi.qty AS bundle_item_qty,
    bi.created_at AS bundle_item_created_at,
    bi.updated_at AS bundle_item_updated_at,
    bi.item AS bundle_item_item_id,
    bi.bundle_id AS bundle_item_bundle_id,
    i.name AS item_name,               
    bmi.id AS bundle_image_id,
    bmi.public_id AS bundle_image_public_id,
    bmi.image_url AS bundle_image_url,
    bmi.created_at AS bundle_image_created_at,
    bmi.updated_at AS bundle_image_updated_at
  FROM bundles b
  LEFT JOIN bundle_items bi ON bi.bundle_id = b.id
  LEFT JOIN items i ON i.id = bi.item        
  LEFT JOIN bundle_images bmi ON bmi.bundle_id = b.id
  WHERE b.id = $1
  `;

    try {
      // Execute the query
      const result = await pool.query(query, [bundleId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Bundle not found' });
      }

      // Format the response
      const bundle = result.rows.reduce((acc: any, row: any) => {
        if (!acc.id) {
          acc = {
            id: row.bundle_id,
            admin_id: row.admin_id,
            name: row.bundle_name,
            health_impact: row.health_impact,
            category: row.category,
            price: row.price,
            is_extra: row.is_extra,
            is_active: row.is_active,
            created_at: row.bundle_created_at,
            updated_at: row.bundle_updated_at,
            bundle_items: [],
            bundle_images: []
          };
        }

        // Add bundle items if present
        if (row.bundle_item_id) {
          acc.bundle_items.push({
            id: row.bundle_item_id,
            item_id: row.bundle_item_item_id,
            item_name: row.item_name,
            qty: row.bundle_item_qty,
            created_at: row.bundle_item_created_at,
            updated_at: row.bundle_item_updated_at
          });
        }

        // Add bundle images if present
        if (row.bundle_image_id) {
          acc.bundle_images.push({
            id: row.bundle_image_id,
            public_id: row.bundle_image_public_id,
            image_url: row.bundle_image_url,
            created_at: row.bundle_image_created_at,
            updated_at: row.bundle_image_updated_at
          });
        }

        return acc;
      }, {});

      return res.status(200).json(bundle);
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
