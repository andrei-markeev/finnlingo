Meteor.startup(() => {

    ServiceConfiguration.configurations.upsert(
        { service: 'facebook' },
        {
            $set: {
                loginStyle: "redirect",
                appId: process.env.FB_APP_ID,
                secret: process.env.FB_APP_SECRET
            }
        }
    );

    Meteor.publish('userData', function() {
        return Meteor.users.find({ _id: this.userId }, { fields: { study: 1 } });
    });

});

