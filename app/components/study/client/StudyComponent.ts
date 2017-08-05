enum CheckResult {
    None,
    Fail,
    Success
}
this.CheckResult = CheckResult;

@Decorators.vueComponent('study')
class StudyComponent {
    $route: Route;

    sentences: Sentence[] = [];
    showHint: string = "";
    index = 0;
    answer = '';
    result: CheckResult = CheckResult.None;
    finished: any = null;
    wordFailures: { [id: number]: number } = {};

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
    }

    getSentenceTokens() {
        if (!this.sentences[this.index])
            return [];
        var text = this.sentences[this.index].text;
        var tokens = [];
        var delimiterRegex = /[,\.-\?!:\s]/;
        for (let i = 0; i < text.length; i++) {
            let l = tokens.length;
            if (l && !delimiterRegex.test(tokens[l-1]) && !delimiterRegex.test(text[i]))
                tokens[l-1] += text[i];
            else
                tokens.push(text[i]);
        }
        return tokens;
    }

    check() {
        if (this.result == CheckResult.None) {
            var answer = Utilities.sentenceToWords(this.answer).join(' ');
            if (this.sentences[this.index].testType == SentenceTestType.Default
                && this.sentences[this.index].translations.some(t => answer == Utilities.sentenceToWords(t.text).join(' '))) {
                this.result = CheckResult.Success;
            } else if (this.sentences[this.index].testType == SentenceTestType.WordPictures
                    && answer == this.sentences[this.index].text) {
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
            if (this.index < this.sentences.length - 1)
                this.index++;
            else {
                StudyApi.finishLesson(this.$route.params.lessonid, this.wordFailures, (err, result) => {
                    this.finished = result;
                });
            }
        }
    }


}
this.StudyComponent = StudyComponent;