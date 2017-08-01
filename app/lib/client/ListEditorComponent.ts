@Decorators.vueComponent('list-editor', {
    props: ['items', 'canEdit', 'newItemText']
})
class ListEditorComponent {
    $emit: Function;

    removeItem(itemId) {
        if (!confirm("Are you sure want to delete this item? Action cannot be undone!"))
            return;
        this.$emit('remove', itemId);
    }

}
this.ListEditorComponent = ListEditorComponent;