const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const emailController = require('../controllers/emailController');
const membershipController = require('../controllers/membershipController');

const router = express.Router();

router.post('/login', authController.login);
router.post('/signup/:token', authController.signup);

router.post(
  '/forgot',
  authController.forgotPassword,
  emailController.sendResetPassword
);
router.post('/reset/:token', authController.resetPassword);

router.use(authController.protect);

router.patch('/me/data', userController.updateMyData);
router.patch('/me/password', userController.updateMyPassword);

router.use(authController.restrictTo('admin'));

router.get('/search', userController.search);
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser, emailController.sendFinishRegistration);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(
    userController.deleteUser,
    membershipController.removeMembershipsBy('user')
  );

router
  .route('/:user/groups/:group')
  .post(membershipController.addMembership)
  .delete(membershipController.removeMembership);

module.exports = router;
