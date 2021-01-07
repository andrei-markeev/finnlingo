export class ACL {
    static getUserOrThrow(methodContext) {
        if (methodContext.userId)
            return Meteor.users.findOne(methodContext.userId);
        throw new Meteor.Error("ACCESS_DENIED", "Access denied!");
    }
}