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
            this.sentences = result;
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

    check() {
        if (this.result == CheckResult.None) {
            var normalize = s => s.split(/[,\.-\?!:\s]+/).join(' ').replace(/^\s+/,'').replace(/\s+$/,'').toLowerCase();
            var answer = normalize(this.answer);
            if (this.sentences[this.index].translations.some(t => answer == normalize(t.text)))
                this.result = CheckResult.Success;
            else {
                this.result = CheckResult.Fail;
                let wordId = this.sentences[this.index].wordId;
                this.wordFailures[wordId]++;
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