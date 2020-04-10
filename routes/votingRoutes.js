const express = require('express');
const votingController = require('../controllers/votingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(votingController.getAllVotings)
  .post(votingController.createVoting)
  .delete(votingController.resetVotingSystem);

router
  .route('/:id')
  .get(votingController.getVoting)
  .post(votingController.vote)
  .patch(votingController.updateVoting)
  .delete(votingController.deleteVoting);

router.post('/:id/start', votingController.startVoting);
router.post('/:id/archive', votingController.archiveVoting);
router.post('/:id/group/:group', votingController.addGroupToVoting);

module.exports = router;
