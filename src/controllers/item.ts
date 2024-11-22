import { RequestHandler } from 'express';
import pool from '../config/database.config';
import HttpStatus from 'http-status-codes';
import { createItem, findItemByName, findAllItems, findItem, updateItemStatus, createParentItem, findAllParentItems, findParentItem, findParentItemByName } from '../repository/item';
import {
  BadRequestError,
  ConflictError,
  ResourceNotFoundError,
} from '../errors';
import type { Item, ParentItem, Bundle } from '../interfaces';
import { respond } from '../utilities';
import { uoms } from '../constants'

export const ItemController = {
  createItem: (): RequestHandler => async (req, res, next) => {
    const adminId = 1 || res.locals.user.id;
    let params = [
      adminId,
      req.body.name,
      req.body.uom,
      req.body.allergies,
      req.body.class_of_food,
      req.body.calories_per_uom,
      req.body.parent_item,
    ];
    try {
      const existingItem = await findItemByName([params[1]] as Partial<Item>);
      if (existingItem?.name === params[1]) {
        respond(
          res,
          "attempt to create an existing item unsuccessful",
          HttpStatus.CONFLICT,
        );
      } else {
        const item = await createItem(params as Partial<Item>);

        respond<Item>(res, item, HttpStatus.CREATED);
        return;
      }
    } catch (error) {
      next(error);
    }
  },

  toggleItemStatus: (): RequestHandler => async (req, res, next) => {
    const itemId = req.params.id;
    try {
      const foundItem = await findItem([itemId] as Partial<Item>);
      if (!foundItem) {
        respond(res, "item does not exist", HttpStatus.BAD_REQUEST);
      }
      const item = await updateItemStatus([
        req.body.is_active,
      ] as Partial<Item>);
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
    const adminId = 1 || res.locals.user.id;
    let params = [adminId, req.body.name];
    try {
      const existingParentItem = await findParentItemByName([
        params[1],
      ] as Partial<Item>);
      if (existingParentItem?.name === params[1]) {
        respond(
          res,
          "attempt to create an existing parent item unsuccessful",
          HttpStatus.CONFLICT,
        );
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
    const {
      name,
      items,
      health_impact,
      price,
      is_active,
    }: Bundle & { is_active: boolean } = req.body;

    try {
      const client = await pool.connect();

      try {
        // Begin a transaction
        await client.query("BEGIN");

        // Insert into bundles table
        const bundleResult = await client.query(
          "INSERT INTO bundles (name, health_impact, price, is_active) VALUES ($1, $2, $3, $4) RETURNING id",
          [name, health_impact, price, is_active],
        );

        const bundleId = bundleResult.rows[0].id;

        // Insert items into bundle_items table
        const itemPromises = items.map(({ item, qty }) =>
          client.query(
            "INSERT INTO bundle_items (bundle_id, item, qty) VALUES ($1, $2, $3)",
            [bundleId, item, qty],
          ),
        );
        await Promise.all(itemPromises);

        // Commit transaction
        await client.query("COMMIT");
        // res.status(201).json({ message: "Bundle created successfully" });
        respond(res, "Bundle created successfully", HttpStatus.CREATED);
      } catch (err) {
        // Rollback on error
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  getActiveBundles: (): RequestHandler => async (req, res, next) => {
    try {
      // Extract page and limit from query parameters, with defaults
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Query to fetch paginated bundles
      const result = await pool.query(
        `
          SELECT b.id, b.name, b.health_impact, b.price, b.is_active,
                 json_agg(json_build_object('item', bi.item, 'qty', bi.qty)) AS items
          FROM bundles b
          LEFT JOIN bundle_items bi ON b.id = bi.bundle_id
          WHERE b.is_active = true
          GROUP BY b.id
          ORDER BY b.id
          LIMIT $1 OFFSET $2
        `,
        [limit, offset],
      );

      // Query to get the total count of active bundles for pagination metadata
      const countResult = await pool.query(`
          SELECT COUNT(*) AS total
          FROM bundles
          WHERE is_active = true
        `);

      const total = parseInt(countResult.rows[0].total, 10);

      // Return paginated results with metadata
      return respond(res, result.rows, HttpStatus.OK, null, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
};


// const bundle = {
//     name: 'abc',
//     items: [{item: 'white rice', qty: 2}, {item: 'stew', qty: 2}, {item: 'meat', qty: 2}],
//     health_impact: 'qes',
//     price: '4,500N'
// }