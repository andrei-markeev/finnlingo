class SentencesApi {
    @Decorators.publish
    static subscribeToSentences(lessonId): Mongo.Cursor<Sentence> {
        var user = ACL.getUserOrThrow(this);
        return Sentences.find({ lessonId: lessonId });
    }

    @Decorators.method
    static addSentence(text: string, lessonId: string, callback?) {
        var user = ACL.getUserOrThrow(this);
        var userDisplayInfo = { _id: user._id, avatarUrl: "http://graph.facebook.com/" + user.services.facebook.id + "/picture", name: user.profile.name };
        var tmpSentences = Sentences.find({ lessonId: lessonId }, { sort: { order: -1 }}).fetch();
        Sentences.insert({
            text: text,
            testType: SentenceTestType.Default,
            translations: [],
            backTranslations: [],
            lessonId: lessonId,
            order: tmpSentences.length > 0 ? tmpSentences[0].order + 1 : 0,// (Sentences.find({ lessonId: lessonId }, { sort: { order: 0 }})[0].order++),
            wordHints: SentencesApi.generateWordHints(lessonId, text),
            author: userDisplayInfo,
            editor: userDisplayInfo,
        });
    }

    @Decorators.method
    static updateSentence(sentenceModel: Sentence, callback?) {
        var user = ACL.getUserOrThrow(this);
        var userDisplayInfo = { _id: user._id, avatarUrl: "http://graph.facebook.com/" + user.services.facebook.id + "/picture", name: user.profile.name };

        Sentences.update(
            { _id: sentenceModel._id }, 
            { $set: { 
                text: sentenceModel.text,
                testType: sentenceModel.testType,
                translations: sentenceModel.translations,
                backTranslations: sentenceModel.backTranslations,
                order: sentenceModel.order,
                wordHints: SentencesApi.generateWordHints(sentenceModel.lessonId, sentenceModel.text),
                editor: userDisplayInfo
            } }
        );
    }

    static generateWordHints(lessonId: string, text: string) {
        let lessonIds = [];
        Courses.findOne({ "tree.lessons.id": lessonId }).tree.forEach(r => r.lessons.forEach(l => lessonIds.push(l.id)));
        let wordHints = {}; 
        for (let word of Utilities.sentenceToWords(text)) {
            let wordObj = Words.findOne({ lessonId: { $in: lessonIds }, $or: [{ text: word }, { "inflections.text": word }]});
            let html = '';
            if (wordObj) {
                let inflection = wordObj.inflections.filter(i => i.text == word)[0];
                wordHints[word] = { wordId: wordObj._id, translations: inflection ? [ inflection.remarks ] : wordObj.translations.map(t => t.text) };
            }
        }
        return wordHints;
    }

    // this is a very heavy operation
    // probably need to rewrite later
    static refreshWordHints(word) {
        var sentences = Sentences.find({ text: { $regex: word.replace(/[^a-zäö]/g,''), $options: 'i' } }, { fields: { text: 1, lessonId: 1 } }).fetch();
        for (var sentence of sentences) {
            Sentences.update(
                { _id: sentence._id }, 
                { $set: { 
                    wordHints: SentencesApi.generateWordHints(sentence.lessonId, sentence.text)
                } }
            );
        }
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