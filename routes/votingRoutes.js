const express = require('express');
const votingController = require('../controllers/votingController');
const authController = require('../controllers/authController');
const ticketController = require('../controllers/ticketController');
const emailController = require('../controllers/emailController');
const blockchainController = require('../controllers/blockchainController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(votingController.getAllVotings)
  .post(
    blockchainController.checkConnection,
    votingController.createVoting,
    emailController.sendAdminToken
  )
  .delete(votingController.resetVotingSystem);

router
  .route('/:id')
  .get(votingController.getVoting)
  .post(blockchainController.checkConnection, votingController.vote)
  .patch(votingController.updateVoting)
  .delete(
    votingController.deleteVoting,
    ticketController.removeTicketsBy('voting')
  );

router.get(
  '/:id/contractinfo',
  blockchainController.checkConnection,
  votingController.getVotingResult
);
router.post(
  '/:id/start',
  blockchainController.checkConnection,
  votingController.startVoting,
  emailController.sendVotingStarted
);
router.post('/:id/archive', votingController.archiveVoting);
router.post(
  '/:id/users',
  blockchainController.checkConnection,
  votingController.uploadCSVFile,
  votingController.addUsers,
  ticketController.createTickets,
  emailController.sendVotingTokens
);

module.exports = router;
