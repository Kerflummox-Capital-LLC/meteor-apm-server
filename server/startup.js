Meteor.startup(() => {
  if (!Meteor.users.findOne({})) {
    Accounts.createUser({
      username: 'Don',
      email: 'don@kerflummoxcapital.com',
      password: 'admin',
      plan: 'business'
    });
  }
});
