class SentencesApi {
    @Decorators.publish
    static subscribeToSentences(wordId): Mongo.Cursor<Sentence> {
        var user = ACL.getUserOrThrow(this);
        return Sentences.find({ wordId: wordId });
    }

    @Decorators.method
    static addSentence(text: string, wordId: string, callback?) {
        var user = ACL.getUserOrThrow(this);
        Sentences.insert({
            text: text,
            translations: [],
            backTranslations: [],
            wordId: wordId
        });
    }

    @Decorators.method
    static updateSentence(sentenceModel: Sentence, callback?) {
        var user = ACL.getUserOrThrow(this);
        Sentences.update(
            { _id: sentenceModel._id }, 
            { $set: { 
                text: sentenceModel.text,
                translations: sentenceModel.translations,
                backTranslations: sentenceModel.backTranslations
            } }
        );
    }

    @Decorators.method
    static removeSentence(sentenceId, callback?) {
        var user = ACL.getUserOrThrow(this);
        Sentences.remove(
            { _id: sentenceId }
        );
    }

}
this.SentencesApi = SentencesApi;