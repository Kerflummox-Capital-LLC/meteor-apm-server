import { Accounts } from 'meteor/accounts-base';

Meteor.startup(() => {
  if (!Meteor.users.findOne({ 'emails.address': 'don@kerflummoxcapital.com' })) {
    console.log('Creating a user to get started!')
    Accounts.createUser({
      username: 'admin',
      email: 'don@kerflummoxcapital.com',
      password: 'admin',
      plan: 'business'
    });
  }
});
