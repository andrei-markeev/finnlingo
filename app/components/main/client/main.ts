Meteor.startup(() => {

    var router = new VueRouter({
        mode: 'history',
        routes: [
            { path: '/', component: new DashboardComponent() },
            { path: '/login', component: { template: VueTemplate['login'] } },
            { path: '/courses', component: new CoursesComponent() },
            { path: '/courses/:id', component: new CoursesComponent() }
        ]
    });

    router.beforeEach((to, from, next) => {
        Tracker.autorun(() => {
            if (to.path == '/login')
                next();
            else if (!Meteor.loggingIn()) {
                if (Meteor.user())
                    next();
                else
                    next('/login');
            }
        });
    });

    new CourseTreeComponent();

    new Vue({
        el: '#app',
        router: router
    });

});