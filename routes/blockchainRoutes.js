const express = require('express');
const blockchainController = require('../controllers/blockchainController');

const router = express.Router();

router.use(blockchainController.checkConnection);

router.get('/wallet', blockchainController.getWalletInfo);
router.get('/contract', blockchainController.getContractInfo);

module.exports = router;
