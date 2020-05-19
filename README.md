# Requirements

* OS: Ubuntu 19.10+ or other **Linux Distribution** (Not  tested on Windows or MacOS) with at least 2Gb RAM
* Installed: **Node.js, NPM, Git**
* Database: **MongoDB**
* **Ethereum wallet** with > 0.2 ETH (For **Kovan** testnet)
* **Infura** API key



# Installation

#### 1. Check if you have installed Node.js, npm and git

To check if you have Node.js installed, run this command in your terminal:

```shell
node -v
```

To confirm that you have npm installed you can run this command in your terminal:

```shell
npm -v
```

[See the instruction](https://nodejs.org/en/download/package-manager/) of how to install **node.js** and **npm** if you don't have installed.

To check git:

```shell
git --help
```

#### 2. Clone this repository to your directory

```
git clone https://github.com/vipr0/knuba-evoting-server.git
```

#### 3. Install all packages for project

```
npm install
```

#### 4. Create config.env and pass required variables

```bash
NODE_ENV=# development - to run with local (ganache) blockchain; production - to run with infura provider #
PORT=# port to run application #

DB=# mongoDB connection string to your database #

JWT_SECRET=# private key to encrypt user auth tokens (JWT) #
JWT_EXPIRES_IN=# time when auth token will expire (example: 2d) #
JWT_COOKIE_EXPIRES_IN=# same as JWT_EXPIRES_IN but for cookies and accepts only number value (example: 2) #

INFURA_KEY=# api key for infura provider (you can find it in your profile on infura.io) #
MNEMONIC=# mnemonic of your ethereum wallet #

EMAIL_HOST=# host of your smtp server #
EMAIL_PORT=# port of your smtp server #
EMAIL_USERNAME=# login of your smtp server user #
EMAIL_PASSWORD=# password of your smtp server user #
EMAIL_SENDER_NAME=# your smtp server sender name #
EMAIL_SENDER_EMAIL=# your smtp server sender email #
EMAIL_APP_URL=# url to redirect to your front-end (example: http://localhost:3000; https://evoting.online) #
```

#### 5. Make folder for users avatar

```bash
mkdir public/img/users
```

#### 6. Deploy smart contract to blockchain

For local (ganache) blockchain:

```shell
npm run migrate:dev
```

For production (infura) blockchain:

```
npm run migrate:prod
```

#### 7. Start server

##### Through npm:

```
npm run dev
```

##### Through pm2:

Install globally **pm2**:

```
npm i -g pm2
```

Start server through pm2:

```
pm2 start server.js
```



# Testing

To test smart contract: 

```bash
npm run test:contract
```

