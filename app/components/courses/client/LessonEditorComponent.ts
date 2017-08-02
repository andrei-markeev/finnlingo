@Decorators.vueComponent("lesson-editor")
class LessonEditorComponent
{
    $route: Route;

    words: Word[] = [];
    sentences: Sentence[] = [];

    selectedWord: Word = null;
    selectedSentence: Sentence = null;

    created() {
        WordsApi.subscribeToWords(this.$route.params.lessonid);
        SentencesApi.subscribeToSentences();
        Tracker.autorun(() => {
            this.words = Words.find().fetch();
            this.sentences = Sentences.find().fetch();
        });
    }

    selectWord(word) {
        this.selectedWord = word;
        this.selectedSentence = null;
    }

    selectSentence(sentence) {
        this.selectedSentence = sentence;
    }

    removeTranslation(translation) {
        if (this.selectedWord.translations.indexOf(translation) > -1)
            this.selectedWord.translations.splice(this.selectedWord.translations.indexOf(translation),1);
        else if (this.selectedSentence && this.selectedSentence.translations.indexOf(translation) > -1)
            this.selectedSentence.translations.splice(this.selectedSentence.translations.indexOf(translation),1);
    }

}
this.LessonEditorComponent = LessonEditorComponent;