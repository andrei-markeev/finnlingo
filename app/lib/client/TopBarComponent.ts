@Decorators.vueComponent('top-bar', {
    props: ['backLink', 'backLinkText']
})
class TopBarComponent {
    user = { study: {} };
    created() {
        Tracker.autorun(() => {
            this.user = Meteor.user();
            Meteor.subscribe('userData');
        });
    }
}
this.TopBarComponent = TopBarComponent;