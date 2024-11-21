import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import { createItem, findItemByName, findAllItems } from '../repository/item';
import {
  BadRequestError,
  ConflictError,
  ResourceNotFoundError,
} from '../errors';
import type { Item } from '../interfaces';
import { respond } from '../utilities';

export const ItemController = {
  createItem: (): RequestHandler => async (req, res, next) => {
    const adminId = 1 || res.locals.user.id;
    let params = [
      adminId,
      req.body.item_name,
      req.body.uom,
      req.body.allergies,
      req.body.class_of_food,
      req.body.calories_per_uom,
      req.body.parent_item,
    ];
    try {
      const existingItem = await findItemByName([params[1]] as Partial<Item>);
      if (existingItem?.item_name === params[1]) {
        respond(
          res,
          'attempt to create an existing item unsuccessful',
          HttpStatus.CONFLICT
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

  fetchAllItems: (): RequestHandler => async (req, res, next) => {
    try {
      const allItems = await findAllItems();

      respond(res, allItems, HttpStatus.OK);
      return;
    } catch (error) {
      next(error);
    }
  },
};
