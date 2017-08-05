class WordsApi {
    @Decorators.publish
    static subscribeToWords(lessonId): Mongo.Cursor<Word> {
        var user = ACL.getUserOrThrow(this);
        return Words.find({ lessonId: lessonId });
    }

    @Decorators.method
    static addWord(text: string, lessonId: string, callback?) {
        var user = ACL.getUserOrThrow(this);
        Words.insert({
            text: text,
            lessonId: lessonId,
            translations: [],
            inflections: []
        });
        SentencesApi.refreshWordHints(text);
    }

    @Decorators.method
    static updateWord(wordModel: Word, callback?) {
        var user = ACL.getUserOrThrow(this);
        Words.update(
            { _id: wordModel._id }, 
            { $set: { 
                text: wordModel.text,
                picture: wordModel.picture,
                remarks: wordModel.remarks, 
                translations: wordModel.translations, 
                inflections: wordModel.inflections
            } }
        );
        SentencesApi.refreshWordHints(wordModel.text);
        for (var wordForm of wordModel.inflections)
            SentencesApi.refreshWordHints(wordForm.text);
    }

    @Decorators.method
    static removeWord(word, callback?) {
        var user = ACL.getUserOrThrow(this);
        Words.remove(
            { _id: word._id }
        );
        SentencesApi.refreshWordHints(word.text);
        for (var wordForm of word.inflections)
            SentencesApi.refreshWordHints(wordForm.text);
    }

}
this.WordsApi = WordsApi;