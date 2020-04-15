const express = require('express');
const groupController = require('../controllers/groupController');
const authController = require('../controllers/authController');
const membershipController = require('../controllers/membershipController');

const router = express.Router();

router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router.get('/search', groupController.search);

router
  .route('/')
  .get(groupController.getAllGroups)
  .post(groupController.createGroup);

router
  .route('/:id')
  .get(groupController.getGroup)
  .patch(groupController.updateGroup)
  .delete(
    groupController.deleteGroup,
    membershipController.removeMembershipsBy('group')
  );

router
  .route('/:group/users/:user')
  .post(membershipController.addMembership)
  .delete(membershipController.removeMembership);

module.exports = router;
