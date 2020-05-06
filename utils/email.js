const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
  EMAIL_APP_URL,
  EMAIL_SENDER_NAME,
  EMAIL_SENDER_EMAIL,
} = require('../config');

const sendMail = async (to, templateName, variables, subject) => {
  // 1 Creating transport
  const transport = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    auth: {
      user: EMAIL_USERNAME,
      pass: EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // 1) Render HTML based on a pug template
  const html = pug.renderFile(
    `${__dirname}/../emails/${templateName}.pug`,
    variables
  );

  // 2) Define email options
  const mailOptions = {
    from: `${EMAIL_SENDER_NAME} <${EMAIL_SENDER_EMAIL}>`,
    to,
    subject: subject,
    html,
    text: htmlToText.fromString(html),
  };

  // 3) Create a transport and send email
  await transport.sendMail(mailOptions);
};

exports.sendFinishRegistration = async (to, token) => {
  await sendMail(
    to,
    'finishRegistration',
    { token, url: `${EMAIL_APP_URL}/signup/${token}` },
    'Finish registration'
  );
};

exports.sendResetPassword = async (to, token) => {
  await sendMail(
    to,
    'resetPassword',
    { token, url: `${EMAIL_APP_URL}/reset/${token}` },
    'Confirm reset password'
  );
};

exports.sendVotingToken = async (to, votingId, token) => {
  await sendMail(
    to,
    'newVotingToken',
    { votingId, token, url: `${EMAIL_APP_URL}/votings/${votingId}` },
    'Token for a new voting'
  );
};

exports.sendAdminToken = async (to, votingId, token) => {
  await sendMail(
    to,
    'newAdminToken',
    { votingId, token, url: `${EMAIL_APP_URL}/votings/${votingId}` },
    'Created new voting'
  );
};

exports.sendVotingStarted = async (to, votingId) => {
  await sendMail(
    to,
    'votingStarted',
    { url: `${EMAIL_APP_URL}/votings/${votingId}`, votingId },
    'Voting has been started!'
  );
};
