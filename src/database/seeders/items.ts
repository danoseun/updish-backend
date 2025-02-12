import pool from '../../config/database.config';
import format from 'pg-format';
import { logger } from '../../utilities';

const items = [
  [1, 'Jollof Rice', 'Plate', 'Spicy tomato rice with vegetables', 'None', 'Carbohydrate', '400', 1, true],
  [1, 'Fried Rice', 'Plate', 'Stir-fried rice with vegetables and protein', 'None', 'Carbohydrate', '500', 1, true],
  [1, 'Ofada Rice', 'Plate', 'Local rice served with spicy sauce', 'None', 'Carbohydrate', '450', 1, true],
  [1, 'White Rice & Stew', 'Plate', 'Boiled rice served with tomato stew', 'None', 'Carbohydrate', '350', 1, true],
  
  [1, 'Suya', 'Piece', 'Spicy grilled meat skewers', 'Peanuts', 'Protein', '300', 2, true],
  [1, 'Meat Stew', 'Plate', 'Rich tomato-based stew with beef', 'None', 'Protein', '450', 2, true],
  [1, 'Peppered Goat Meat', 'Plate', 'Spicy goat meat', 'None', 'Protein', '500', 2, true],
  [1, 'Grilled Chicken', 'Piece', 'Grilled chicken with spices', 'None', 'Protein', '350', 2, true],
  
  [1, 'Grilled Fish', 'Piece', 'Fresh grilled fish with spices', 'None', 'Protein', '350', 3, true],
  [1, 'Peppered Fish', 'Plate', 'Spicy fish dish', 'None', 'Protein', '400', 3, true],
  [1, 'Fried Fish', 'Plate', 'Crispy fried fish', 'None', 'Protein', '420', 3, true],
  [1, 'Stockfish', 'Piece', 'Dry fish used in soups', 'None', 'Protein', '360', 3, true],
  
  [1, 'Pounded Yam', 'Plate', 'Smooth yam dough served with soup', 'None', 'Carbohydrate', '500', 4, true],
  [1, 'Yam Porridge', 'Plate', 'Yam cooked with vegetables and palm oil', 'None', 'Carbohydrate', '450', 4, true],
  [1, 'Fried Yam', 'Plate', 'Crispy fried yam slices', 'None', 'Carbohydrate', '550', 4, true],
  [1, 'Boiled Yam', 'Plate', 'Simply boiled yam with pepper sauce', 'None', 'Carbohydrate', '480', 4, true],
  
  [1, 'Moi Moi', 'Portion', 'Steamed bean pudding', 'None', 'Protein', '250', 5, true],
  [1, 'Akara', 'Piece', 'Fried bean cakes', 'None', 'Protein', '150', 5, true],
  [1, 'Stewed Beans', 'Plate', 'Beans stewed with palm oil and spices', 'None', 'Protein', '300', 5, true],
  [1, 'Beans & Plantain', 'Plate', 'Stewed beans served with fried plantain', 'None', 'Protein', '350', 5, true],
  
  [1, 'Fried Plantain', 'Plate', 'Sweet ripe plantain slices', 'None', 'Carbohydrate', '300', 6, true],
  [1, 'Plantain Porridge', 'Plate', 'Unripe plantain cooked with palm oil', 'None', 'Carbohydrate', '350', 6, true],
  
  [1, 'Efo Riro', 'Plate', 'Spinach stew cooked with meat and fish', 'None', 'Vegetable', '250', 7, true],
  [1, 'Okra Soup', 'Plate', 'Thick okra soup with meat and fish', 'None', 'Vegetable', '200', 7, true],
  [1, 'Ogbono Soup', 'Plate', 'Thickened soup made with ogbono seeds', 'None', 'Vegetable', '220', 7, true],
  
  [1, 'Chin Chin', 'Portion', 'Crunchy fried dough', 'None', 'Snack', '400', 8, true],
  [1, 'Boli', 'Piece', 'Roasted plantain', 'None', 'Snack', '300', 8, true],
  [1, 'Puff Puff', 'Piece', 'Fried sweet dough balls', 'None', 'Snack', '350', 8, true],
  
  [1, 'Egusi Soup', 'Plate', 'Melon seed soup with vegetables', 'None', 'Soup', '350', 9, true],
  [1, 'Banga Soup', 'Plate', 'Palm nut soup', 'None', 'Soup', '400', 9, true],
  
  [1, 'Zobo', 'Bottle', 'Hibiscus tea drink', 'None', 'Drink', '120', 10, true],
  [1, 'Kunu', 'Bottle', 'Millet-based traditional drink', 'None', 'Drink', '100', 10, true],
  
  [1, 'Boiled Eggs', 'Plate', 'Simple boiled eggs served with pepper sauce', 'None', 'Protein', '150', 11, true],
  [1, 'Fried Eggs', 'Plate', 'Eggs fried to perfection, served with vegetables', 'None', 'Protein', '200', 11, true],
  [1, 'Omelette', 'Plate', 'Egg omelette with vegetables and cheese', 'None', 'Protein', '220', 11, true],
  [1, 'Egg Sandwich', 'Piece', 'Sandwich made with eggs, lettuce, and tomato', 'None', 'Protein', '300', 11, true],
  
  [1, 'White Bread', 'Slice', 'Soft white bread', 'None', 'Carbohydrate', '80', 12, true],
  [1, 'Brown Bread', 'Slice', 'Whole grain brown bread', 'None', 'Carbohydrate', '90', 12, true],
  [1, 'Garlic Bread', 'Slice', 'Toasted garlic bread with butter', 'None', 'Carbohydrate', '200', 12, true]
];

const sql = format(
  'INSERT INTO items (admin_id, name, uom, description, allergies, class_of_food, calories_per_uom, parent_item, is_active) VALUES %L returning id',
  items
);

/**
 * Function representing the seeder for items.
 */
export async function seedItems(): Promise<void> {
  try {
    const result = await pool.query(sql);
    console.log(`items ${result.command}ED`);
    logger.info(`items ${result.command}ED`);
  } catch (error) {
    console.error(`seedItems: ${error}`);
    logger.error(`seedItems: ${error}`);
  }
}
