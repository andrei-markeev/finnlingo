@Decorators.vueComponent('dashboard')
class DashboardComponent {

    $route: Route;
    $router: VueRouter;

    course: Course = null;
    loggingIn: boolean = true;
    user: User = null;
    todayLeaders = [];
    allTimeLeaders = [];
    showSideBar = false;
    windowWidth = 1200;

    created() {
        this.windowWidth = document.documentElement.clientWidth;
        window.addEventListener('resize', e => {
            this.windowWidth = document.documentElement.clientWidth;
        });
        DashboardApi.getDashboardPageData((err, res) => {
            this.course = res.course;
            this.todayLeaders = res.todayLeaders;
            this.allTimeLeaders = res.allTimeLeaders;
            Tracker.autorun(() => {
                this.loggingIn = Meteor.loggingIn();
                this.user = Meteor.user();
            })
        });
    }
}
this.DashboardComponent = DashboardComponent;