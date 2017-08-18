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
        var now = Date.now();
        var msInHour = 60 * 60 * 1000;
        var isCompleted = l => l.disabled || Meteor.user().study && Meteor.user().study.completedLessonIds.indexOf(l.id) > -1;
        var wordDecayFactor = w => Math.max(0, (now - w.lastDate) / msInHour - RepetitionIntervals["Level" + w.bucket]) / RepetitionIntervals["Level" + w.bucket];
        var decayIndex = l => {
            if (!isCompleted(l))
                return 5;
            let words = Meteor.user().study.learnedWords.filter(w => w.lessonId == l.id);
            let sum = words.reduce((a, w) => a + Math.min(5, wordDecayFactor(w)), 0);
            return Math.floor(sum / words.length);
        };

        for (var row of this.course.tree) {
            if (notAvailable)
                row.lessons.forEach(l => this.lessonStatus[l.id] = 'locked');
            else {
                row.lessons.forEach(l => this.lessonStatus[l.id] = 'decay' + decayIndex(l));
                if (!row.lessons.every(l => isCompleted(l)))
                    notAvailable = true;
            }
        }

    }

    mounted() {
        this.showIconEditorForLesson = null;
    }

    getLessonColor(lesson) {
        if (this.mode === 'edit') {
            if (lesson.disabled)
                return 'locked';
            return '';
        } else
            return this.lessonStatus[lesson.id];
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