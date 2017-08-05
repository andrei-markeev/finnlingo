class DashboardApi {
    @Decorators.method
    static getDashboardPageData(callback?) {
        var user = ACL.getUserOrThrow(this);
        var today = new Date();
        today.setHours(0, 0, 0);
        var todayLeaders = Meteor.users.find(
            { "study.lastDateStudied": { $gte: today.getTime() } }, 
            { sort: { "study.lastDateXP": -1 }, limit: 10, fields: { "profile.name": 1, "study.lastDateXP": 1, "services.facebook.id": 1 } })
            .fetch()
            .map(tl => ({ 
                name: tl.profile.name,
                xp: tl.study.lastDateXP,
                avatarUrl: "http://graph.facebook.com/" + tl.services.facebook.id + "/picture"
            }));
        var allTimeLeaders = Meteor.users.find(
            { }, 
            { sort: { "study.xp": -1 }, limit: 10, fields: { "profile.name": 1, "study.xp": 1, "services.facebook.id": 1 } })
            .fetch()
            .map(tl => ({ 
                name: tl.profile.name,
                xp: tl.study.xp,
                avatarUrl: "http://graph.facebook.com/" + tl.services.facebook.id + "/picture"
            }));
        return {
            course: Courses.findOne(user.selectedCourseId),
            todayLeaders: todayLeaders,
            allTimeLeaders: allTimeLeaders
        };
    }
}
this.DashboardApi = DashboardApi;