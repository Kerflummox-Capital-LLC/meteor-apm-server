Accounts.emailTemplates.siteName = i18n('common.site_name');
Accounts.emailTemplates.from = 'Alerts <no-reply@kerflummoxcapital.com>';
Accounts.emailTemplates.resetPassword.subject = function () {
  return i18n('emails.reset_password_subject');
};
Accounts.config({
  restrictCreationByEmailDomain: 'kerflummoxcapital.com',
  ambiguousErrorMessages: true,
  forbidClientAccountCreation: true,
  sendVerificationEmail: false
});
