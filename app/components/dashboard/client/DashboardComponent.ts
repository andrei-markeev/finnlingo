@Decorators.vueComponent('dashboard')
class DashboardComponent {

    $route: Route;
    $router: VueRouter;

    course: Course = null;
    loggingIn: boolean = true;
    user: User = null;

    created() {
        DashboardApi.getDashboardPageData((err, res) => {
            this.course = res.course;
            Tracker.autorun(() => {
                this.loggingIn = Meteor.loggingIn();
                this.user = Meteor.user();
            })
        });
    }
}
this.DashboardComponent = DashboardComponent;