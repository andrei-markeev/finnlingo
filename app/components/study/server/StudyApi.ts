class StudyApi
{
    @Decorators.method
    static getSentences(lessonId, callback?) {
        var user = ACL.getUserOrThrow(this);
        var lessonWords = Words.find({ lessonId: lessonId }).fetch();
        var wordHints = {};
        var lessonSentences = [];
        for (let word of lessonWords) {
            var sentences = Sentences.find({ wordId: word._id }).fetch();
            // choose two random sentences
            sentences = sentences.sort(() => .5 - Math.random()).slice(0, 2);
            sentences.forEach(s => Utilities.sentenceToWords(s.text).forEach(w => wordHints[w] = null));
            lessonSentences = lessonSentences.concat(sentences);
        }
        for (let word in wordHints) {
            let wordObj = Words.findOne({ $or: [{ text: word }, { "inflections.text": word }]});
            let html = '';
            let learnedWord = wordObj && user.study && user.study.learnedWords.filter(w => w.id == wordObj._id)[0];
            if (wordObj && (!learnedWord || learnedWord.bucket <= 2)) {
                let inflection = wordObj.inflections.filter(i => i.text == word)[0];
                wordHints[word] = { inflection: inflection, translations: wordObj.translations, bucket: learnedWord && learnedWord.bucket || 0 };
            }
            
        }
        return { sentences: lessonSentences, wordHints: wordHints };
    }

    @Decorators.method
    static finishLesson(lessonId, results, callback?) {
        var user = ACL.getUserOrThrow(this);
        user.study = user.study || {
            dailyGoal: 10,
            daysStudied: 0,
            lastDateStudied: 0,
            lastDateXP: 0,
            streakDays: 0,
            streakLastDate: 0,
            xp: 0,
            completedLessonIds: [],
            learnedWords: []
        };
        var timestamp = Date.now();
        for (var result of results) {
            var word = user.study.learnedWords.filter(lw => lw.id == result.id)[0];
            if (!word) {
                word = { id: result.id, lessonId: lessonId, lastDate: timestamp, bucket: 0 };
                user.study.learnedWords.push(word);
            }
            word.lastDate = timestamp;
            if (result.failure <= 1)
                word.bucket = Math.min(6, word.bucket + 1);
            else if (result.failure >= 3)
                word.bucket = Math.max(0, word.bucket - 1);
        }
        user.study.xp += 10;
        var dateNow = new Date(timestamp).toISOString().slice(0, 10);
        var dateLast = new Date(user.study.lastDateStudied).toISOString().slice(0, 10);
        if (dateNow != dateLast) {
            user.study.lastDateXP = 10;
            if (timestamp < user.study.lastDateStudied)
                user.study.lastDateStudied = timestamp;
        } else
            user.study.lastDateXP += 10;

        if (user.study.lastDateXP - 10 < user.study.dailyGoal && user.study.lastDateXP >= user.study.dailyGoal) {
            if (timestamp - user.study.streakLastDate < 24 * 3600 * 1000)
                user.study.streakDays++;
            else
                user.study.streakDays = 1;
            user.study.streakLastDate = timestamp;
        }

        user.study.lastDateStudied = timestamp;
        if (user.study.completedLessonIds.indexOf(lessonId) == -1)
            user.study.completedLessonIds.push(lessonId);

        Meteor.users.update(user._id, {
            $set: { study: user.study }
        });

        return { streakDays: user.study.streakDays, xpTillGoal: user.study.dailyGoal - user.study.lastDateXP };
    }
}
this.StudyApi = StudyApi;