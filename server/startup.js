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

WebApp.rawConnectHandlers.use((req, res, next) => {
  if (process.env.TYPE != 'both' && process.env.TYPE != 'client') {
    res.writeHeader(401);
    res.end('[401] Invalid port name');
  }
  else { next(); }
});

Meteor.onConnection((session) => {
  if (process.env.TYPE != 'both' && process.env.TYPE != 'client') {
    session.close()
  }
})
