Meteor.startup(() => {

    ServiceConfiguration.configurations.upsert(
        { service: 'facebook' },
        {
            $set: {
                loginStyle: "redirect",
                appId: "your-fb-app-id-here",
                secret: "your-fb-app-secret-here"
            }
        }
    );

    Meteor.publish('userData', function() {
        return Meteor.users.find({ _id: this.userId }, { fields: { study: 1 } });
    });

});

