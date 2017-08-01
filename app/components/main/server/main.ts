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

});

