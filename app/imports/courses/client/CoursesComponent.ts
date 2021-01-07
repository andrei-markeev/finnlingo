import VueRouter, { Route } from "vue-router";
import { vueComponent } from "../../../lib/client/Decorators";
import { CoursesApi } from "../server/CoursesApi";

@vueComponent("courses")
export class CoursesComponent
{
    $route: Route;
    $router: VueRouter;
    $set: Function;

    courses: Course[] = null;
    course: Course = null;
    loggingIn: boolean = true;
    user: FinnlingoUser = null;
    avatarUrls: { [key: string]: string } = {};
    sentencesCount: { [key: string]: number } = {};

    created() {
        CoursesApi.subscribeToCourses();
        Tracker.autorun(() => {
            this.loggingIn = Meteor.loggingIn();
            this.user = Meteor.user();
            this.courses = Courses.find().fetch();
            if (this.$route.params.id)
                this.course = this.courses.filter(c => c._id == this.$route.params.id)[0];

            this.processCourses();
        })
    }

    async processCourses() {
        for (let c of this.courses) {
            const count = await CoursesApi.getSentencesCount(c._id)
            this.sentencesCount[c._id] = count;
            this.courses = this.courses.sort((a, b) => this.sentencesCount[b._id] - this.sentencesCount[a._id]);
            for (let id of c.admin_ids) {
                if (!this.avatarUrls[id]) {
                    const url = await CoursesApi.getAvatarUrl(id);
                    this.$set(this.avatarUrls, id, url);
                }
            }
        }
    }
    async selectCourse(course) {
        try {
            await CoursesApi.selectCourse(course._id);
            this.$router.push("/");
        } catch(err) {
            alert("Error occured: " + err.toString());
        }
    }

    canEdit(course) {
        return course.admin_ids.indexOf(this.user._id) > -1;
    }

    editCourse(course) {
        this.course = this.courses.filter(c => c._id == course._id)[0];
        this.$router.push("/courses/" + course._id);
    }

}