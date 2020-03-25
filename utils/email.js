const EmailTemplate = require('email-templates');

class Email {
  constructor(to) {
    this.to = to;
  }

  async send(template, subject, locals) {
    const email = new EmailTemplate({
      message: {
        from: 'h1@example.com',
      },
      send: true,
      transport: {
        host: 'smtp.mailtrap.io',
        port: 2525,
        ssl: false,
        tls: true,
        auth: {
          user: '26112db3fbac79',
          pass: '2777e20b050abe',
        },
      },
    });

    await email.send({
      template,
      message: {
        to: this.to,
        subject,
      },
      locals,
    });
  }

  async sendWelcome(locals) {
    await this.send('welcome', 'Реєстрація', locals);
  }

  async sendResetPassword(locals) {
    await this.send('resetPassword', 'Відновлення паролю', locals);
  }
}

module.exports = Email;
