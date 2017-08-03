@Decorators.vueComponent('list-editor', {
    props: ['items', 'canEdit', 'canRemove', 'newItemText', 'itemClass']
})
class ListEditorComponent {
    $emit: Function;
    $nextTick: Function;
    $el: HTMLElement;
    canEdit: string | Function;

    editingInline = null;

    mounted() {
        this.editingInline = null;
    }

    getItemText(item) {
        if (this.canEdit && typeof this.canEdit === 'string' && this.canEdit !== 'true')
            return item[this.canEdit];
        else
            return item.name;
    }

    selectItem(item) {
        this.$emit('select', item);
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

    endInlineEditing(item) {
        this.$emit('edit', item);
        this.editingInline = null;
    }

    removeItem(item) {
        if (!confirm("Are you sure want to delete this item? Action cannot be undone!"))
            return;
        this.$emit('remove', item);
    }

}
this.ListEditorComponent = ListEditorComponent;