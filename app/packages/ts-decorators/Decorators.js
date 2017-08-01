Decorators = this.Decorators || {};
Decorators.publish = function (target, propertyKey, descriptor) {
    var originalMethod = descriptor.value;
    var publicationName = target.toString().match("function ([A-Za-z0-9_]+)")[1] + "." + propertyKey;
    
    Meteor.publish(publicationName, originalMethod);

    return descriptor;
}
    
Decorators.method = function (target, propertyKey, descriptor) {
    var originalMethod = descriptor.value;
    var methodName = target.toString().match("function ([A-Za-z0-9_]+)")[1] + "." + propertyKey;

    var methodsObj = {};
    methodsObj[methodName] = originalMethod;
    Meteor.methods(methodsObj);

    return descriptor;
}

this.Decorators = Decorators;