const dotenv = require('dotenv');

dotenv.config({ path: `${__dirname}/config.env` });

module.exports = process.env;
