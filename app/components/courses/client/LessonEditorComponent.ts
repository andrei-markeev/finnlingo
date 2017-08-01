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
        Tracker.autorun(() => {
            this.words = Words.find().fetch();
            this.sentences = Sentences.find().fetch();
        });
    }

    selectWord(word) {
        this.selectedWord = word;
        this.selectedSentence = null;
        SentencesApi.subscribeToSentences(word._id);
    }

    selectSentence(sentence) {
        this.selectedSentence = sentence;
    }

    removeTranslation(translation) {
        this.selectedWord.translations.splice(this.selectedWord.translations.indexOf(translation),1);
    }

}
this.LessonEditorComponent = LessonEditorComponent;