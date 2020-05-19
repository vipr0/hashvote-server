const express = require('express');
const blockchainController = require('../controllers/blockchainController');

const router = express.Router();

router.get('/wallet', blockchainController.getWalletInfo);

module.exports = router;
