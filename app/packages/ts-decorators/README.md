Typescript Decorators
=====================

On server:

    class MyPage {
        @Decorators.publish
        public static Subscribe() {
            return MyCollection.find({});
        }

        @Decorators.method
        public static DoSomething(param1, param2, callback) {
            // do something
        }
    }

And then on client:

    MyPage.Subscribe();
    MyPage.DoSomething(1, 2, function(err, res) {
        if (err)
            alert("ERROR!");
    })

