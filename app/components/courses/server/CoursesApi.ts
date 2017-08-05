class CoursesApi {
    @Decorators.publish
    static subscribeToCourses(): Mongo.Cursor<Course> {
        var user = ACL.getUserOrThrow(this);
        return Courses.find();
    }

    @Decorators.method
    static getSentencesCount(courseId, callback?) {
        let tree = Courses.findOne(courseId, { fields: { tree: 1 }}).tree;
        let lessonIds = [];
        for (let row of tree)
            lessonIds = lessonIds.concat(row.lessons.map(l => l.id));
        
        return Sentences.find({ lessonId: { $in: lessonIds } }).count();
    }
    @Decorators.method
    static getAvatarUrl(userId, callback?) {
        let user = Meteor.users.findOne(userId, { fields: { "services.facebook.id": 1} });
        return "http://graph.facebook.com/" + user.services.facebook.id + "/picture";
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
    static removeCourse(course, callback?) {
        var user = ACL.getUserOrThrow(this);
        Courses.remove(
            { _id: course._id, admin_ids: user._id }
        );
    }

}
this.CoursesApi = CoursesApi;