Meteor.startup(() => {

    new CourseTreeComponent();

    new Vue({
        el: '#app',
        router: new VueRouter({
            mode: 'history',
            routes: [
                { path: '/', component: new DashboardComponent() },
                { path: '/courses', component: new CoursesComponent() },
                { path: '/courses/:id', component: new CoursesComponent() }
            ]
        })
    });

});