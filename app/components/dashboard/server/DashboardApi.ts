class DashboardApi {
    @Decorators.method
    static getDashboardPageData(callback?) {
        var user = ACL.getUserOrThrow(this);
        return {
            course: Courses.findOne(user.selectedCourseId)
        };
    }
}
this.DashboardApi = DashboardApi;