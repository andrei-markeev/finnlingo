import VueRouter, { Route } from "vue-router";
import { vueComponent } from "../../../lib/client/Decorators";
import { DashboardApi } from "../server/DashboardApi";

@vueComponent('dashboard')
export class DashboardComponent {

    $route: Route;
    $router: VueRouter;

    course: Course = null;
    loggingIn: boolean = true;
    user: FinnlingoUser = null;
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