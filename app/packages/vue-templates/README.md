Vue templates
=============

Light-weight replacement for **blaze-html-templates** for working with Vue.js templates.
Vue templates can be defined similarly to blaze templates using **template** tags, e.g.:

    <template name="myVueTemplate">
        <!-- you can use Vue syntax here -->
    </template>

Also you can as usually define **body** and **head** tags, they will be merged together into the static html file.

Template contents are then accessible via VueTemplate variable:

    Vue.component("myComponent", { template: VueTemplate["myVueTemplate"] });

