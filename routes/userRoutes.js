const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/forgot', authController.forgotPassword);
router.post('/reset/:token', authController.resetPassword);
router.get('/verify/:token', authController.verifyAccount);

router.use(authController.protect);

router.patch('/update/data', userController.updateProfileData);
router.patch('/update/password', userController.updateProfilePassword);

router.use(authController.restrictTo('admin'));

router.get('/search', userController.search);
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
