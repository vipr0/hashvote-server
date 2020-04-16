const express = require('express');
const votingController = require('../controllers/votingController');
const authController = require('../controllers/authController');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(votingController.getAllVotings)
  .post(votingController.checkConnection, votingController.createVoting)
  .delete(votingController.resetVotingSystem);

router
  .route('/:id')
  .get(votingController.checkConnection, votingController.getVoting)
  .post(votingController.checkConnection, votingController.vote)
  .patch(votingController.updateVoting)
  .delete(
    votingController.deleteVoting,
    ticketController.removeTicketsBy('voting')
  );

router.post(
  '/:id/start',
  votingController.checkConnection,
  votingController.startVoting
);
router.post('/:id/archive', votingController.archiveVoting);
router.post(
  '/:id/group/:group',
  votingController.checkConnection,
  votingController.addGroupToVoting
);

module.exports = router;
