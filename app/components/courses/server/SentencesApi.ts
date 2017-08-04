class SentencesApi {
    @Decorators.publish
    static subscribeToSentences(): Mongo.Cursor<Sentence> {
        var user = ACL.getUserOrThrow(this);
        return Sentences.find();
    }

    @Decorators.method
    static addSentence(text: string, wordId: string, callback?) {
        var user = ACL.getUserOrThrow(this);
        
        Sentences.insert({
            text: text,
            translations: [],
            backTranslations: [],
            wordId: wordId,
            wordHints: SentencesApi.generateWordHints(text)
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
                backTranslations: sentenceModel.backTranslations,
                wordHints: SentencesApi.generateWordHints(sentenceModel.text)
            } }
        );
    }

    static generateWordHints(text: string) {
        let wordHints = {};
        for (let word of Utilities.sentenceToWords(text)) {
            let wordObj = Words.findOne({ $or: [{ text: word }, { "inflections.text": word }]});
            let html = '';
            if (wordObj) {
                let inflection = wordObj.inflections.filter(i => i.text == word)[0];
                wordHints[word] = { wordId: wordObj._id, translations: wordObj.translations };
                if (inflection)
                    wordHints[word].inflection = inflection.remarks;
            }
        }
        return wordHints;
    }

    @Decorators.method
    static removeSentence(sentence, callback?) {
        var user = ACL.getUserOrThrow(this);
        Sentences.remove(
            { _id: sentence._id }
        );
    }

}
this.SentencesApi = SentencesApi;