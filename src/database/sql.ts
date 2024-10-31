export const sql = {
    createUser: 'INSERT INTO users (first_name, last_name, email, password, age, state, city, address) values ($1, $2, $3, $4, $5, $6, $7, $8) returning *',
    deactivateUser: 'UPDATE users SET is_active = false, deactivated_at = $1, deletion_scheduled_at = $2 WHERE id = $3 RETURNING email, first_name, phone_number, is_active',
    selectToReactivateUser: 'SELECT is_active, deletion_scheduled_at FROM users WHERE id = $1',
    accountsToBeDeleted: 'SELECT id, email, first_name FROM users WHERE deletion_scheduled_at <= $1',
    deleteAccountQuery: 'DELETE FROM users WHERE deletion_scheduled_at <= $1',
    reactivateUser: 'UPDATE users SET is_active = true, deactivated_at = null, deletion_scheduled_at = null WHERE id = $1 RETURNING email, first_name, is_active',
    fetchUserByEmail: 'SELECT * FROM users WHERE email = $1',
    fetchUserById: 'SELECT * FROM users WHERE id = $1',
    updateIsEmailVerified: 'UPDATE users SET is_email_verified = $1, updated_at = NOW() WHERE id = $2 returning *',
    updateIsPhoneNumberVerified: 'UPDATE users SET is_phone_number_verified = $1, updated_at = NOW() WHERE id = $2 returning *',
    findPhoneNumber: 'SELECT phone_number FROM users WHERE phone_number = $1',
    updateUserPhoneNumber: 'UPDATE users SET phone_number = $1, is_phone_number_verified = $2, updated_at = NOW() WHERE id = $3 returning *',
    updateUserPassword: 'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 returning *',
    updateUserEmail: 'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 returning *',
    fetchUserImage: 'SELECT * FROM user_images WHERE user_id = $1',
    uploadUserImage: 'INSERT INTO user_images (user_id, public_id, image_url) values ($1, $2, $3) returning *',
    deleteUserImage: 'DELETE FROM user_images WHERE public_id = $1',
    createListing:
      'INSERT INTO listings (product_name, lister_id, category_id, sub_category_id, item_location, state, city, latitude, longitude, description, quantity_listed, quantity_available, estimated_value, price_per_day, status) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) returning *',
    createImagesForListing: 'INSERT INTO item_images (listing_id, public_id, image_url) values ($1, $2, $3) returning *',
    createScheduleForSingleListing: 'INSERT INTO schedules (listing_id, single_date) values ($1, $2) returning *',
    createScheduleForRangeListing: 'INSERT INTO schedules (listing_id, start_date, end_date) values ($1, $2, $3) returning *',
    createScheduleForMultipleListing: 'INSERT INTO schedules (listing_id, multiple_date_ranges) values ($1, $2) returning *',
    createScheduleForRecurrentListing:
      'INSERT INTO schedules (listing_id, recurring_days_of_week, recurring_start_date, recurring_end_date) values ($1, $2, $3, $4) returning *',
    fetchUserListings: `SELECT l.id AS listing_id, l.product_name, l.lister_id, l.category_id, l.sub_category_id, l.item_location, l.state, l.city, l.latitude, l.longitude, l.description, l.quantity_listed, l.quantity_available, l.estimated_value, l.price_per_day, l.status, s.id AS schedule_id, s.single_date, s.start_date, s.end_date, s.multiple_date_ranges, s.recurring_days_of_week, s.recurring_start_date, s.recurring_end_date, c.name AS category_name, sc.name AS sub_category_name,
  json_agg(
      json_build_object(
          'image_id', ii.id,
          'public_id', ii.public_id,
          'image_url', ii.image_url
      )
  ) AS item_images
  FROM 
      listings l
  LEFT JOIN 
      schedules s ON l.id = s.listing_id
  LEFT JOIN 
      item_images ii ON l.id = ii.listing_id
  LEFT JOIN 
      categories c ON c.id = l.category_id
  LEFT JOIN 
      sub_categories sc ON sc.id = l.sub_category_id
  WHERE 
      l.lister_id = $1
  GROUP BY
  l.id, s.id, c.name, sc.name, s.single_date, s.start_date, s.end_date, 
  s.multiple_date_ranges, s.recurring_days_of_week, s.recurring_start_date, s.recurring_end_date
  ORDER BY
      l.created_at DESC -- a unique ordering column
  OFFSET 
      $2 -- Calculate the offset based on page number and page size
  LIMIT 
      $3; -- Limit the number of rows returned per page
      `,
    deleteListing: 'DELETE FROM listings WHERE id = $1 AND lister_id = $2',
    findListing: 'SELECT * FROM listings WHERE id = $1 AND lister_id = $2',
    findSpecificListing: 'SELECT * FROM listings WHERE id = $1',
    findListingAndCo: `SELECT
    CONCAT(u.last_name, ' ', u.first_name) AS full_name,
    l.id AS listing_id,
    l.product_name,
    l.lister_id,
    l.category_id,
    l.sub_category_id,
    l.item_location,
    l.state,
    l.city,
    l.latitude,
    l.longitude,
    l.description,
    l.quantity_listed,
    l.quantity_available,
    l.estimated_value,
    l.price_per_day,
    l.status,
    c.name AS category_name,
    sc.name AS sub_category_name,
    s.id AS schedule_id,
    s.single_date,
    s.start_date AS schedule_start_date,
    s.end_date AS schedule_end_date,
    s.multiple_date_ranges,
    s.recurring_days_of_week,
    s.recurring_start_date,
    s.recurring_end_date,
    json_agg(
        json_build_object(
            'image_id', ii.id,
            'public_id', ii.public_id,
            'image_url', ii.image_url
        )
    ) AS item_images
  FROM
    listings l
  LEFT JOIN 
    users u ON l.lister_id = u.id
  LEFT JOIN
    categories c ON l.category_id = c.id
  LEFT JOIN
    sub_categories sc ON l.sub_category_id = sc.id
  LEFT JOIN
    schedules s ON l.id = s.listing_id
  LEFT JOIN
    item_images ii ON l.id = ii.listing_id
  WHERE
    l.id = $1
  GROUP BY
    l.id, u.first_name, u.last_name, c.name, sc.name, s.id
  ORDER BY
    l.created_at DESC;
  `,
  fetchRandomListingsByCategory: 'SELECT * FROM listings WHERE category_id = $1 AND id != $2 ORDER BY RANDOM()',
  countListingsForUser: `SELECT COUNT(*) FROM listings WHERE lister_id = $1`,
  updateListing: `UPDATE listings
    SET 
        product_name = $1,
        category_id = $2,
        sub_category_id = $3,
        item_location = $4,
        state = $5,
        city = $6,
        latitude = $7,
        longitude = $8,
        description = $9,
        quantity_listed = $10,
        estimated_value = $11,
        price_per_day = $12,
        updated_at = NOW()
    WHERE 
        id = $13 returning *`,
    fetchAllListings: `
    SELECT
      CONCAT(users.last_name, ' ', users.first_name) AS full_name,
      listings.id AS listing_id,
      listings.lister_id,
      listings.product_name,
      listings.category_id,
      listings.sub_category_id,
      listings.item_location,
      listings.state,
      listings.city,
      listings.latitude,
      listings.longitude,
      listings.description,
      listings.quantity_listed,
      listings.quantity_available,
      listings.estimated_value,
      listings.price_per_day,
      listings.status,
      listings.created_at,
      schedules.single_date,
      schedules.start_date,
      schedules.end_date,
      schedules.multiple_date_ranges,
      schedules.recurring_days_of_week,
      schedules.recurring_start_date,
      schedules.recurring_end_date,
      json_agg(
          json_build_object(
              'image_id',  item_images.id,
              'public_id', item_images.public_id,
              'image_url', item_images.image_url
          )
      ) AS item_images,
      categories.name AS category_name,
      sub_categories.name AS sub_category_name
  FROM 
      listings
  LEFT JOIN
      users ON users.id = listings.lister_id
  LEFT JOIN 
      schedules ON listings.id = schedules.listing_id
  LEFT JOIN 
      item_images ON listings.id = item_images.listing_id
  LEFT JOIN 
      categories ON categories.id = listings.category_id
  LEFT JOIN 
      sub_categories ON sub_categories.id = listings.sub_category_id
  WHERE
      listings.status = $1 -- Fetch only listings available for booking
  GROUP BY
      listings.id, users.first_name, users.last_name, categories.name, sub_categories.name, schedules.single_date, schedules.start_date, schedules.end_date, 
      schedules.multiple_date_ranges, schedules.recurring_days_of_week, schedules.recurring_start_date, schedules.recurring_end_date
  ORDER BY 
      listings.created_at DESC -- Or any other appropriate sorting criteria
  OFFSET 
      $2 -- Offset for pagination
  LIMIT 
      $3; -- Number of rows to fetch per page
    `,
    createCategory: 'INSERT INTO categories (name) values ($1) returning *',
    createSubCategory: 'INSERT INTO sub_categories (name, category_id) values ($1, $2) returning *',
    fetchCategories: `SELECT
    c.id AS category_id,
    c.name AS category_name,
    json_agg(sc.name) AS subcategories
  FROM
    categories c
  LEFT JOIN
    sub_categories sc ON c.id = sc.category_id
  GROUP BY
    c.id, c.name
  ORDER BY
    c.id ASC;
    `,
    findCategoryByName: 'SELECT * FROM categories WHERE name = $1',
    findCategoryById: 'SELECT * FROM categories WHERE id = $1',
    findSubCategory: 'SELECT * FROM sub_categories WHERE name = $1',
    findSubCategories: 'SELECT * FROM sub_categories WHERE category_id = $1',
    findSchedule: `SELECT
    id,
    listing_id,
    single_date,
    start_date,
    end_date,
    multiple_date_ranges,
    recurring_days_of_week,
    recurring_start_date,
    recurring_end_date
  FROM
    schedules
  WHERE
    id = $1
  `,
    fetchListingImage: 'SELECT * FROM item_images WHERE id = $1',
    updateListingImage: 'UPDATE item_images SET public_id = $1, image_url = $2, updated_at = NOW() WHERE listing_id = $3 returning *',
    deleteListingImage: 'DELETE FROM item_images WHERE public_id = $1',
    createBooking: 'INSERT INTO bookings (listing_id, renter_id, quantity, price, no_of_days, service_charge, vat, listing_status, rental_status, start_date, end_date) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) returning *',
    createRoom: 'INSERT INTO rooms (unique_room_no, booking_id, lister_id, renter_id) values ($1, $2, $3, $4) returning *',
    findRoom: 'SELECT * FROM rooms WHERE id = $1',
    findBooking: 'SELECT * FROM bookings WHERE id = $1',
    findUserListings: 'SELECT * FROM listings WHERE lister_id = $1',
    findBookingsForUser: 'SELECT * FROM bookings WHERE renter_id = $1',
    updateBooking: `UPDATE bookings
    SET 
        listing_status = $1,
        rental_status = $2,
        updated_at = NOW()
    WHERE 
        id = $3 returning *`,
    updateListingStatus: `UPDATE listings
        SET 
            status = $1,
            updated_at = NOW()
        WHERE 
            id = $2 returning *`,
    updateListingQuantity: 'UPDATE listings SET quantity_available = $1 WHERE id = $2;',
    getBookingsWithEndDatePassed: `SELECT * FROM bookings WHERE end_date < $1 AND listing_status = $2`,
    fetchPendingTransactions: 'SELECT * FROM transactions where status = $1',
    fetchTransactionByRef: 'SELECT * FROM transactions where reference = $1'
  };
  