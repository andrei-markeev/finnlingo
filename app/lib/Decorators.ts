var Decorators = this.Decorators || {};

Decorators.vueComponent = function(name: string, options?: any): (target: any) => any {
    return function(target: any) {
        // save a reference to the original constructor
        var original = target;
        // a utility function to generate instances of a class
        function construct(constructor, args) {
            var c: any = function () {
                return constructor.apply(this, args);
            }
            c.prototype = constructor.prototype;
            return new c();
        }
        var vueInstanceFunctions = [
            "init",
            "beforeCreate",
            "created",
            "beforeMount",
            "mounted",
            "beforeUpdate",
            "updated",
            "beforeDestroy",
            "destroyed"
        ];
        if (!options) options = {};
        options.template = VueTemplate[name];
        if (!options.props) options.props = {};
        if (!options.watch) options.watch = {};
        if (!options.computed) options.computed = {};
        if (options.data) {
            if (typeof options.data == 'function'){
                var data_rtn = (<any>options).data();
                options.data = data_rtn;
            }
        } else options.data = {};
        if (!options.methods) options.methods = {};
        if (options['style']) delete options['style'];

        var newi = construct(original, {});

        for(var key in newi){
            if (key.charAt(0) != '$' && key.charAt(0) != '_'){
                var prop_desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(newi), key);
                if (prop_desc && prop_desc.get) {
                    var computed_obj:any = {};
                    if(prop_desc.set){
                        computed_obj.get = prop_desc.get;
                        computed_obj.set = prop_desc.set;
                    } else {
                        computed_obj = prop_desc.get;
                    }
                    options.computed[key] = computed_obj;
                }
                else if (typeof(newi[key]) == 'function'){
                    if (vueInstanceFunctions.indexOf(key) > -1){
                        options[key] = newi[key]
                    } else {
                        if (key != 'constructor')
                            options.methods[key] = newi[key];
                    }
                } else {
                    options.data[key] = newi[key];
                }
            }
        }

        var data = options.data;
        options.data = function() { return data; };
        return function() { return Vue.component(name, options); };
    };     
}

this.Decorators = Decorators;