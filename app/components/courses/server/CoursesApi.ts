class CoursesApi {
    @Decorators.publish
    static subscribeToCourses(): Mongo.Cursor<Course> {
        var user = ACL.getUserOrThrow(this);
        return Courses.find();
    }

    @Decorators.method
    static addCourse(name: string, callback?) {
        var user = ACL.getUserOrThrow(this);
        Courses.insert({
            name: name,
            tree: [],
            admin_ids: [user._id]
        });
    }

    @Decorators.method
    static updateCourse(courseModel, callback?) {
        var user = ACL.getUserOrThrow(this);
        Courses.update(
            { _id: courseModel._id, admin_ids: user._id }, 
            { $set: { name: courseModel.name, tree: courseModel.tree } }
        );
    }

    @Decorators.method
    static selectCourse(courseId, callback?) {
        var user = ACL.getUserOrThrow(this);
        Meteor.users.update(user._id, {
            $set: { selectedCourseId: courseId }
        });
    }

    @Decorators.method
    static removeCourse(courseId, callback?) {
        var user = ACL.getUserOrThrow(this);
        Courses.remove(
            { _id: courseId, admin_ids: user._id }
        );
    }

}
this.CoursesApi = CoursesApi;