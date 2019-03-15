Meteor.startup(() => {
  if (!Meteor.users.findOne({})) {
    console.log('Create a user to get started!')
    // Accounts.createUser({
    //   username: 'admin',
    //   email: 'admin@admin.com',
    //   password: 'admin',
    //   plan: 'business'
    // });
  }
});
