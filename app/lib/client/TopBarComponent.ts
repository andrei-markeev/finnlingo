import { vueComponent } from "./Decorators";

@vueComponent('top-bar', {
    props: ['backLink', 'backLinkText']
})
export class TopBarComponent {
    user = { study: {} };
    created() {
        Tracker.autorun(() => {
            this.user = Meteor.user();
            Meteor.subscribe('userData');
        });
    }
}