@Decorators.vueComponent("lesson-editor")
class LessonEditorComponent
{
    $route: Route;
    $refs: { [ key: string ]: HTMLElement };
    $nextTick: Function;

    words: Word[] = [];
    sentences: Sentence[] = [];
    editSentence: Sentence = null;

    selectedWord: Word = null;
    selectedSentence: Sentence = null;
    windowWidth = 1200;
    showTab = 'sentences';
    wordPictures = {};
    displayStatus = false;

    created() {
        this.windowWidth = document.documentElement.clientWidth;
        window.addEventListener('resize', e => {
            this.windowWidth = document.documentElement.clientWidth;
        });
        WordsApi.subscribeToWords(this.$route.params.lessonid);
        SentencesApi.subscribeToSentences(this.$route.params.lessonid);
        Tracker.autorun(() => {
            this.words = Words.find().fetch();
            this.sentences = Sentences.find({}, { sort: { order: 1 } }).fetch();
        });
        WordsApi.getWordPictures((err, res) => this.wordPictures = res);
    }

    mounted() {
        this.editSentence = null;
        this.selectedWord = null;
        this.selectedSentence = null;
        this.showTab = 'sentences';
        this.displayStatus = false;
    }

    selectWord(word) {
        this.selectedWord = word;
        this.$nextTick(() => this.selectedSentence = null);
    }

    get wordsCount() {
        return this.words.filter(w => w.lessonId == this.$route.params.lessonid).length;
    }
    get reusedCount() {
        return this.words.filter(w => w.lessonId == this.$route.params.lessonid).length;
    }
    get sentencesCount() {
        return this.sentences.filter(w => w.lessonId == this.$route.params.lessonid).length;
    }
    get incompleteCount() {
        let incompleteWordsCount = this.words.filter(w => w.lessonId == this.$route.params.lessonid && !w.translations.length).length;
        let incompleteSentencesCount = this.sentences.filter(s => s.lessonId == this.$route.params.lessonid && !s.translations.length).length;
        return incompleteWordsCount + incompleteSentencesCount;
    }

    get wordPicture() {
        return this.selectedWord.translations[0] && this.wordPictures[Utilities.getPictureId(this.selectedWord.translations[0].text)];
    }

    getWordClass(word) {
        var css = "";
        if (this.selectedWord && this.selectedWord._id == word._id)
            css += " selected";
        if (word.translations.length == 0)
            css += " warning";
        return css;
    }

    selectSentence(sentence) {
        this.selectedSentence = sentence;
    }

    getSentenceClass(sentence) {
        var css = "";
        if (this.selectedSentence && this.selectedSentence._id == sentence._id)
            css += " selected";
        if (sentence.translations && sentence.translations.length == 0)
            css += " warning";
        return css;
    }

    changeSentenceOrder(sentence, inc) {
        var index = this.sentences.indexOf(sentence);
        if (inc > 0 && index < this.sentences.length) {
            this.sentences[index + 1].order--;
            SentencesApi.updateSentence(this.sentences[index + 1]);
        } else if (inc < 0 && index > 0) {
            this.sentences[index - 1].order++;
            SentencesApi.updateSentence(this.sentences[index - 1]);
        }
        sentence.order += inc;
        SentencesApi.updateSentence(sentence);
    }

    startSentenceEditing(sentence) {
        this.editSentence = sentence;
        this.$nextTick(() => {
            this.$refs["editSentenceInput"].focus();
        });
    }

    removeTranslation(translation) {
        if (this.selectedWord && this.selectedWord.translations.indexOf(translation) > -1) {
            this.selectedWord.translations.splice(this.selectedWord.translations.indexOf(translation),1);
            WordsApi.updateWord(this.selectedWord);
        }
        else if (this.selectedWord && this.selectedWord.inflections.indexOf(translation) > -1) {
            this.selectedWord.inflections.splice(this.selectedWord.inflections.indexOf(translation),1);
            WordsApi.updateWord(this.selectedWord);
        }
        else if (this.selectedSentence && this.selectedSentence.translations.indexOf(translation) > -1) {
            this.selectedSentence.translations.splice(this.selectedSentence.translations.indexOf(translation),1);
            SentencesApi.updateSentence(this.selectedSentence);
        }
        else if (this.selectedSentence && this.selectedSentence.backTranslations.indexOf(translation) > -1) {
            this.selectedSentence.backTranslations.splice(this.selectedSentence.backTranslations.indexOf(translation),1);
            SentencesApi.updateSentence(this.selectedSentence);
        }
    }

}
this.LessonEditorComponent = LessonEditorComponent;