const express = require('express');
const votingController = require('../controllers/votingController');
const authController = require('../controllers/authController');
const ticketController = require('../controllers/ticketController');
const emailController = require('../controllers/emailController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(votingController.getAllVotings)
  .post(
    votingController.checkConnection,
    votingController.createVoting,
    emailController.sendAdminToken
  )
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

router.get(
  '/:id/contractinfo',
  votingController.checkConnection,
  votingController.getVotingFromContract
);
router.post(
  '/:id/start',
  votingController.checkConnection,
  votingController.startVoting,
  emailController.sendVotingStarted
);
router.post('/:id/archive', votingController.archiveVoting);
router.post(
  '/:id/group/:group',
  votingController.checkConnection,
  votingController.addGroupToVoting,
  ticketController.createTickets,
  emailController.sendVotingTokens
);

module.exports = router;
