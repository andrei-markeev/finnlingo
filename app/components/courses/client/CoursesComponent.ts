@Decorators.vueComponent("courses")
class CoursesComponent
{
    $route: Route;
    $router: VueRouter;
    $set: Function;

    courses: Course[] = null;
    course: Course = null;
    loggingIn: boolean = true;
    user: User = null;
    avatarUrls: { [key: string]: string } = {};

    created() {
        CoursesApi.subscribeToCourses();
        Tracker.autorun(() => {
            this.loggingIn = Meteor.loggingIn();
            this.user = Meteor.user();
            this.courses = Courses.find().fetch();
            if (this.$route.params.id)
                this.course = this.courses.filter(c => c._id == this.$route.params.id)[0];

            for (let c of this.courses) {
                for (let id of c.admin_ids) {
                    if (!this.avatarUrls[id]) {
                        CoursesApi.getAvatarUrl(id, (err, url) => {
                            this.$set(this.avatarUrls, id, url);
                        });
                    }
                }
            }

        })
    }

    selectCourse(course) {
        CoursesApi.selectCourse(course._id, (err, res) => {
            if (!err)
                this.$router.push("/");
            else
                alert("Error occured: " + err);
        });
    }

    canEdit(course) {
        return course.admin_ids.indexOf(this.user._id) > -1;
    }

    editCourse(course) {
        this.course = this.courses.filter(c => c._id == course._id)[0];
        this.$router.push("/courses/" + course._id);
    }

}
this.CoursesComponent = CoursesComponent;