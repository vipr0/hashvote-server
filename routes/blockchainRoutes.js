const express = require('express');
const blockchainController = require('../controllers/blockchainController');

const router = express.Router();

router.get(
  '/wallet',
  blockchainController.checkConnection,
  blockchainController.getWalletInfo
);

module.exports = router;
