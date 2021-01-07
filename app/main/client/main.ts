import VueRouter from "vue-router";
import Vue from "vue/dist/vue.min.js";

Meteor.startup(() => {

    Vue.use(VueRouter);

    const dashboardComponent = () => module.dynamicImport('../../imports/dashboard/client/DashboardComponent').then(c => new c.DashboardComponent());
    const studyComponent = () => module.dynamicImport('../../imports/study/client/StudyComponent').then(c => new c.StudyComponent());
    const coursesComponent = () => module.dynamicImport('../../imports/courses/client/CoursesComponent').then(c => new c.CoursesComponent());
    const lessonEditorComponent = () => module.dynamicImport('../../imports/courses/client/LessonEditorComponent').then(c => new c.LessonEditorComponent());

    var router = new VueRouter({
        mode: 'history',
        routes: [
            { path: '/', component: dashboardComponent },
            { path: '/login', component: { template: VueTemplate['login'] } },
            { path: '/study/:courseid/lessons/:lessonid', component: studyComponent },
            { path: '/courses', component: coursesComponent },
            { path: '/courses/:id', component: coursesComponent },
            { path: '/courses/:id/lessons/:lessonid', component: lessonEditorComponent }
        ]
    });

    router.beforeEach((to, from, next) => {
        Tracker.autorun(() => {
            if (!Meteor.loggingIn()) {
                if (Meteor.user() && to.path == '/login')
                    next('/');
                else if (Meteor.user())
                    next();
                else if (to.path == '/login')
                    next();
                else
                    next('/login');
            }
        });
    });


    new Vue({
        el: "#app",
        router: router
    });

    Meteor.subscribe('userData');

});