// we only want to run the engine based on these env variables
if (process.env.TYPE != 'engine') {
  Meteor.publish('errorsMeta.single', function (appId, name, type) {
    check(appId, String);
    check(name, String);
    check(type, String);
    this.unblock();

    KadiraData._authorize(this.userId, null, { appId: [appId] });
    return ErrorsMeta.find({ appId: appId, name: name, type: type });
  });
}