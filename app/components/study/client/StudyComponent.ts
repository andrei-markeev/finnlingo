enum CheckResult {
    None,
    Fail,
    Success
}
this.CheckResult = CheckResult;

@Decorators.vueComponent('study')
class StudyComponent {
    $route: Route;
    $set: Function;
    $nextTick: Function;
    
    sentences: Sentence[] = [];
    showHint: string = "";
    index = 0;
    answer = '';
    result: CheckResult = CheckResult.None;
    finished: any = null;
    showXP: boolean = false;
    wordFailures: { [id: number]: number } = {};
    selectedWords: any[] = [];
    selectedOptions: { [index: number]: string} = {};

    created() {
        StudyApi.getSentences(this.$route.params.lessonid, (err, result) => {
            if (err) {
                alert(err);
                return;
            }
            this.sentences = result.sentences;
            this.wordFailures = {};
            for (let s of this.sentences) {
                for (let w in s.wordHints)
                    this.wordFailures[s.wordHints[w].wordId] = 0;
            }
        });
    }

    mounted() {
        this.index = 0;
        this.result = CheckResult.None;
        this.answer = '';
        this.finished = null;
        this.showXP = false;
        this.selectedWords = [];
        this.selectedOptions = {};
    }

    selectWord(word, index) {
        if (this.selectedOptions[index])
            return;
        this.selectedWords.push(word);
        this.$set(this.selectedOptions, index, true);
    }

    unselectWord(word) {
        this.selectedWords.splice(this.selectedWords.indexOf(word),1);
        for (let i = 0; i < this.sentences[this.index]["options"].length; i++) {
            if (this.selectedOptions[i] && this.sentences[this.index]["options"][i] == word)
                this.$set(this.selectedOptions, i, false);
        }
    }

    check() {
        if (this.result == CheckResult.None) {
            if (!this.answer && this.selectedWords.length == 0)
                return;
            if (!this.answer)
                this.answer = this.selectedWords.join(' ');
            var answer = Utilities.sentenceToWords(this.answer).join(' ');
            if (this.sentences[this.index].testType == SentenceTestType.SelectMissingWord && this.sentences[this.index].translations[0].text == this.answer) {
                this.result = CheckResult.Success;
            } else if (this.sentences[this.index].testType != SentenceTestType.SelectMissingWord && this.sentences[this.index].translations.some(t => answer == Utilities.sentenceToWords(t.text).join(' '))) {
                this.result = CheckResult.Success;
            } else {
                this.result = CheckResult.Fail;
                for (var w in this.sentences[this.index].wordHints)
                    this.wordFailures[this.sentences[this.index].wordHints[w].wordId]++;
                this.sentences.push({ ...this.sentences[this.index] });
            }
        } else {
            this.result = CheckResult.None;
            this.answer = '';
            this.selectedWords = [];
            this.selectedOptions = {};
            if (this.index < this.sentences.length - 1)
                this.index++;
            else {
                StudyApi.finishLesson(this.$route.params.lessonid, this.wordFailures, (err, result) => {
                    this.finished = result;
                    this.showXP = false;
                    this.$nextTick(() => this.showXP = true);
                });
            }
        }
    }


}
this.StudyComponent = StudyComponent;