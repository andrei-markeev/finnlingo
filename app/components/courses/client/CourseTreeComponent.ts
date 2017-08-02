@Decorators.vueComponent("course-tree", {
    props: ['course', 'mode'],
})
class CourseTreeComponent
{
    $route: Route;
    $router: VueRouter;
    course: Course;
    mode: 'edit' | 'study';

    showIconEditorForLesson: Lesson = null;
    lessonStatus = {};

    created() {
        var notAvailable = false;
        var isCompleted = l => Meteor.user().study.completedLessonIds.indexOf(l.id) > -1;

        for (var row of this.course.tree) {
            if (notAvailable)
                row.lessons.forEach(l => this.lessonStatus[l.id] = 'locked');
            else {
                row.lessons.forEach(l => this.lessonStatus[l.id] = isCompleted(l) ? 'completed' : '');
                if (!row.lessons.every(l => isCompleted(l)))
                    notAvailable = true;
            }
        }

    }

    mounted() {
        this.showIconEditorForLesson = null;
    }

    getLessonColor(lessonId) {
        if (this.mode === 'edit')
            return '';
        else
            return this.lessonStatus[lessonId];
    }

    removeLesson(row, lesson) {
        if (!confirm('Are you sure want to remove lesson "' + lesson.name + "'? This action cannot be undone!"))
            return;
        row.lessons.splice(row.lessons.indexOf(lesson),1);
        if (row.lessons.length == 0 && this.course.tree.indexOf(row) == this.course.tree.length - 1)
            this.course.tree.splice(this.course.tree.length - 1, 1);
        this.saveCourse();
    }

    clickLesson(lesson) {
        if (this.mode == 'edit')
            this.showIconEditorForLesson = lesson;
        else if (this.lessonStatus[lesson.id] != 'locked')
            this.$router.push('/study/' + this.course._id + '/lessons/' + lesson.id);
    }
    
    saveCourse() {
        CoursesApi.updateCourse(this.course);
    }
}
this.CourseTreeComponent = CourseTreeComponent;