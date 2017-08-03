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
    wordHints: { [key: string]: any } = {};
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
            this.wordHints = result.wordHints;
            this.wordFailures = {};
            for (let s of this.sentences)
                this.wordFailures[s.wordId] = 0;
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
            if (this.sentences[this.index].translations.some(t => answer == Utilities.sentenceToWords(t.text).join(' ')))
                this.result = CheckResult.Success;
            else {
                this.result = CheckResult.Fail;
                let wordId = this.sentences[this.index].wordId;
                this.wordFailures[wordId]++;
            }
            for (let token of this.getSentenceTokens())
                this.wordHints[token.toLowerCase()].bucket = Math.max(this.wordHints[token.toLowerCase()].bucket, 1);
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