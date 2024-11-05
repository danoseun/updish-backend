export const sql = {
    createUser: 'INSERT INTO users (first_name, last_name, phone_number, email, password, age, state, city, address) values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *',
    createUserWithGoogleAuth: 'INSERT INTO users (first)',
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
    deleteUserImage: 'DELETE FROM user_images WHERE public_id = $1'
  };
  