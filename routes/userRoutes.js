const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const emailController = require('../controllers/emailController');
const ticketController = require('../controllers/ticketController');

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

router.get('/me', userController.getMyData);
router.patch(
  '/me/data',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMyData
);
router.patch('/me/password', userController.updateMyPassword);

router.use(authController.restrictTo('admin'));

router.get('/search', userController.search);
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser, emailController.sendActivationToken)
  .delete(userController.deleteManyUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser, ticketController.removeTicketsBy('user'));

router.post(
  '/upload',
  userController.uploadUsersFile,
  userController.createManyUsers,
  emailController.sendActivationToken
);

module.exports = router;
