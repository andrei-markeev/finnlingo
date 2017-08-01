@Decorators.vueComponent('list-editor', {
    props: ['items', 'canEdit', 'canRemove', 'newItemText']
})
class ListEditorComponent {
    $emit: Function;
    $nextTick: Function;
    $el: HTMLElement;
    canEdit: string | Function;

    editingInline = null;
    selectedItem = null;

    mounted() {
        this.editingInline = null;
        this.selectedItem = null;
    }

    selectItem(item) {
        this.$emit('select', item);
        this.selectedItem = item;
    }

    startInlineEditing(item) {
        this.$emit('edit', item);
        this.editingInline = null;
    }

    editItem(item) {
        if (this.canEdit && this.canEdit !== 'true' && typeof this.canEdit === 'string') {
            this.editingInline = item;
            this.$nextTick(() => {
                (<HTMLElement>this.$el.querySelector('input[type="text"]')).focus();
            });
        } else
            this.$emit('edit', item);
    }

    removeItem(itemId) {
        if (!confirm("Are you sure want to delete this item? Action cannot be undone!"))
            return;
        this.$emit('remove', itemId);
    }

}
this.ListEditorComponent = ListEditorComponent;