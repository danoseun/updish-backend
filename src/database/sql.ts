export const sql = {
  createUser:
    'INSERT INTO users (first_name, last_name, phone_number, email, password, age, state, city, address) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *',
  createAddress: 'INSERT INTO addresses (user_id, title, state, city, address) values ($1, $2, $3, $4, $5) returning *',
  //createUserWithGoogleAuth: 'INSERT INTO users (first)',
  deactivateUser:
    'UPDATE users SET is_active = false, deactivated_at = $1, deletion_scheduled_at = $2 WHERE id = $3 RETURNING email, first_name, phone_number, is_active',
  selectToReactivateUser: 'SELECT is_active, deletion_scheduled_at FROM users WHERE id = $1',
  accountsToBeDeleted: 'SELECT id, email, first_name FROM users WHERE deletion_scheduled_at <= $1',
  deleteAccountQuery: 'DELETE FROM users WHERE deletion_scheduled_at <= $1',
  reactivateUser:
    'UPDATE users SET is_active = true, deactivated_at = null, deletion_scheduled_at = null WHERE id = $1 RETURNING email, first_name, is_active',
  fetchUserByEmail: 'SELECT * FROM users WHERE email = $1',
  fetchAdminByEmail: 'SELECT * FROM admins WHERE email = $1',
  fetchUserById: 'SELECT * FROM users WHERE id = $1',
  updatePushToken: 'UPDATE users SET push_token = $1 WHERE id = $2 RETURNING id, email, push_token',
  updateIsEmailVerified: 'UPDATE users SET is_email_verified = $1, updated_at = NOW() WHERE id = $2 returning *',
  updateIsPhoneNumberVerified: 'UPDATE users SET is_phone_number_verified = $1, updated_at = NOW() WHERE id = $2 returning *',
  findPhoneNumber: 'SELECT phone_number FROM users WHERE phone_number = $1',
  updateUserPhoneNumber: 'UPDATE users SET phone_number = $1, is_phone_number_verified = $2, updated_at = NOW() WHERE id = $3 returning *',
  updateUserPassword: 'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 returning *',
  updateUserEmail: 'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 returning *',
  fetchUserImage: 'SELECT * FROM user_images WHERE user_id = $1',
  uploadUserImage: 'INSERT INTO user_images (user_id, public_id, image_url) values ($1, $2, $3) returning *',
  deleteUserImage: 'DELETE FROM user_images WHERE public_id = $1',
  createKYC:
    'INSERT INTO kycs (user_id, sex, health_goals, dietary_preferences, food_allergies, health_concerns) values($1, $2, $3::text[], $4, $5::text[], $6::text[]) returning *',
  findKYC: 'SELECT * FROM kycs WHERE user_id = $1',
  createItem:
    'INSERT INTO items (admin_id, name, uom, description, allergies, class_of_food, calories_per_uom, parent_item, is_active) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *',
  allItems: 'SELECT * FROM items',
  findItem: 'SELECT * FROM items WHERE id = $1',
  findItemByName: 'SELECT * FROM items WHERE name = $1',
  updateItemStatus: 'UPDATE items SET is_active = $1, updated_at = NOW() WHERE id = $2 returning *',
  createParentItem: 'INSERT INTO parent_items (admin_id, name) values ($1, $2) returning *',
  allParentItems: 'SELECT * FROM parent_items',
  findParentItem: 'SELECT * FROM parent_items WHERE id = $1',
  findParentItemByName: 'SELECT * FROM parent_items WHERE name = $1',
  getActiveBundles: `SELECT b.id, b.name, b.health_impact, b.price, b.is_active,
          json_agg(json_build_object('item', bi.item, 'qty', bi.qty)) AS mealBundles
      FROM 
          bundles b
      LEFT JOIN
          bundle_items bi ON b.id = bi.bundle_id
      WHERE 
          b.is_active = true
      GROUP BY b.id`,
  createImagesForBundle: 'INSERT INTO bundle_images (bundle_id, public_id, image_url) values ($1, $2, $3) returning *',
  itemsByCategory: `SELECT jsonb_object_agg(category, items) AS category_items
      FROM (
          SELECT category, JSONB_AGG(items.*) AS items
          FROM items
          GROUP BY category
      ) AS grouped_items`,
  fetchItemByIdDetailed: `SELECT 
      i.id AS item_id,
      i.name,
      i.uom,
      i.description,
      i.category,
      i.allergies,
      i.class_of_food,
      i.calories_per_uom,
      i.is_active,
      COALESCE(
          JSONB_AGG(
              JSONB_BUILD_OBJECT(
                  'id', img.id,
                  'public_id', img.public_id,
                  'url', img.image_url
              )
          ) FILTER (WHERE img.id IS NOT NULL), '[]'
      ) AS images
  FROM 
      items i
  LEFT JOIN 
      item_images img ON i.id = img.item_id
  WHERE 
      i.id = $1
  GROUP BY 
      i.id, i.name, i.uom, i.description, i.category, i.allergies, i.class_of_food, i.calories_per_uom, i.is_active;
  `,
  fetchPendingOrders: 'SELECT * FROM orders where status = $1',
  updateOrderStatusByTransactionRef: 'UPDATE orders SET status = $1, updated_at = $2 WHERE transaction_ref = $3 RETURNING *;',
  createOrder: 'INSERT INTO orders (user_id, start_date, end_date, payment_plan_id, number_of_meals, total_price, code, status) values ($1, $2, $3, $4, $5, $6, $7, $8) returning *',
  createOrderMeals: 'INSERT INTO order_meals (order_id, date, category, bundle_id, quantity, delivery_time, address, code) values ($1, $2, $3, $4, $5, $6, $7, $8)',
  createContactUS:
  'INSERT INTO contact_us (user_id, subject, message) values ($1, $2, $3) returning *'
};
