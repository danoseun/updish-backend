import { Router } from 'express';
import passport from 'passport';
import fileUpload from 'express-fileupload';

import { checkPhoneNumberSchema, verifyUserPhoneNumberSchema, loginUserSchema, createUserWithPhoneNumberSchema, createUserWithGoogleAuthSchema, forgotPasswordSchema, acceptNewPasswordSchema, createKYCSchema, fetchKYCSchema, addressCreationSchema, savePushTokenSchema, googleAuthSchema, createContactUsSchema } from '../validations/user';

import { UserController } from '../controllers/user';
import { authenticate } from '../middleware/authenticate';

export const userRouter = Router();

// userRouter.post('/auth/signup', createUserSchema, UserController.createUser());
userRouter.post('/auth/login', loginUserSchema, UserController.loginUser());
// userRouter.patch('/auth/verify/:token', verfiyUserEmailSchema, UserController.verifyUserEmail());
userRouter.post('/auth/send/phone', checkPhoneNumberSchema, UserController.sendOtpToPhoneNumber());
userRouter.post('/auth/phone/verify', verifyUserPhoneNumberSchema, UserController.verifyUserPhoneNumber());
userRouter.post('/auth/signup-with-phone', createUserWithPhoneNumberSchema, UserController.createUserWithPhoneNumber());
userRouter.post('/kycs', createKYCSchema, UserController.saveKYCDetails());
userRouter.get('/kyc', authenticate(), UserController.foundKYCDetails());

// handles social media authentication

// Google login inital route - localhost:3000/v1/auth/google
userRouter.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Gooogle login callback that manages the returned user object
userRouter.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: 'https://milesrental.netlify.app/login' }), UserController.handleGoogleAuth());
userRouter.post('/signup-with-google', createUserWithGoogleAuthSchema, UserController.createUserWithGoogleAuth());

userRouter.post('/google-auth', googleAuthSchema, UserController.googleAuth());


// userRouter.patch('/uploads', authenticate(), fileUpload({ useTempFiles: true, limits: { fileSize: 10 * 1024 * 1024 } }), UserController.uploadPhoto());

userRouter.post('/send-forgot-password', forgotPasswordSchema, UserController.forgotPassword());

userRouter.patch('/update-push-token', savePushTokenSchema, UserController.savePushToken());
userRouter.patch('/accept-new-password', acceptNewPasswordSchema, UserController.acceptNewPassword());
userRouter.post('/addresses', authenticate(), addressCreationSchema, UserController.createAddress());
userRouter.post('/contact-us', authenticate(), createContactUsSchema, UserController.createContactUS());

// userRouter.patch('/update-password', authenticate(), updatePasswordSchema, UserController.updatePassword());

// userRouter.patch('/update-email', authenticate(), updateEmailSchema, UserController.updateUser());


// userRouter.patch('/deactivate', authenticate(), UserController.deactivateAccount());

// userRouter.patch('/reactivate', authenticate(), UserController.reactivateAccount());

