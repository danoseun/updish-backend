import { Router } from 'express';
import passport from 'passport';
import fileUpload from 'express-fileupload';

import { checkPhoneNumberSchema, verifyUserPhoneNumberSchema } from '../validations/user';

import { UserController } from '../controllers/user';
// import { authenticate } from '../middleware/authenticate';

export const userRouter = Router();

// userRouter.post('/auth/signup', createUserSchema, UserController.createUser());
// userRouter.post('/auth/login', loginUserSchema, UserController.loginUser());
// userRouter.patch('/auth/verify/:token', verfiyUserEmailSchema, UserController.verifyUserEmail());
userRouter.patch('/auth/send/phone', checkPhoneNumberSchema, UserController.sendOtpToPhoneNumber());
userRouter.patch('/auth/phone/verify', verifyUserPhoneNumberSchema, UserController.verifyUserPhoneNumber());

// handles social media authentication

// Google login inital route - localhost:3000/v1/auth/google
userRouter.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Gooogle login callback that manages the returned user object
userRouter.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: 'https://milesrental.netlify.app/login' }), UserController.handleGoogleAuth());

//userRouter.get('/auth/facebook', passport.authenticate('facebook'));

//userRouter.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: 'https://milesrental.netlify.app/login' }), UserController.handleFacebookAuth());


// userRouter.patch('/uploads', authenticate(), fileUpload({ useTempFiles: true, limits: { fileSize: 10 * 1024 * 1024 } }), UserController.uploadPhoto());

// userRouter.patch('/send-forgot-password', forgotPasswordSchema, UserController.forgotPassword());

// userRouter.patch('/forgot-password', acceptNewPasswordSchema, UserController.acceptNewPassword());

// userRouter.patch('/update-password', authenticate(), updatePasswordSchema, UserController.updatePassword());

// userRouter.patch('/update-email', authenticate(), updateEmailSchema, UserController.updateUser());

// userRouter.get('/token', authenticate(), UserController.getToken());

// userRouter.post('/smile-callback', UserController.getVerificationData());

// userRouter.patch('/deactivate', authenticate(), UserController.deactivateAccount());

// userRouter.patch('/reactivate', authenticate(), UserController.reactivateAccount());

