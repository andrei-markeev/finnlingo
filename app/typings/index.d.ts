declare module Meteor {
    interface User extends FinnlingoUser { }
}

declare var Decorators;
declare var VueTemplate;

interface NodeModule {
    dynamicImport(path: string): Promise<any>
}
