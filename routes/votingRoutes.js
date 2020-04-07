const express = require('express');
const votingController = require('../controllers/votingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(votingController.getAllVotings)
  .post(votingController.createVoting);

router
  .route('/:id')
  .get(votingController.getVoting)
  .patch(votingController.updateVoting)
  .delete(votingController.deleteVoting);

module.exports = router;
