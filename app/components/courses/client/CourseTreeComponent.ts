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

    mounted() {
        this.showIconEditorForLesson = null;
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
            this.$router.push('/courses/' + this.course._id + '/lessons/' + lesson.id);
    }
    rightClickLesson(lesson) {
        if (this.mode == 'edit')
            this.showIconEditorForLesson = lesson;
    }
    
    saveCourse() {
        CoursesApi.updateCourse(this.course);
    }
}
this.CourseTreeComponent = CourseTreeComponent;