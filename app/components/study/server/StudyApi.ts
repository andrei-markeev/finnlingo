class StudyApi
{
    @Decorators.method
    static getSentences(lessonId, callback?) {
        var user = ACL.getUserOrThrow(this);
        var lessonSentences = Sentences.find({ lessonId: lessonId }).fetch();
        if (user.study && user.study.learnedWords) {
            for (let sentence of lessonSentences) {
                for (let word in sentence.wordHints) {
                    var learnedWord = user.study.learnedWords.filter(w => w.id == sentence.wordHints[word].wordId)[0];
                    if (learnedWord && ( learnedWord.bucket > 1 || Date.now() - learnedWord.lastDate < 20*60*1000 ))
                        sentence.wordHints[word]["no_hint"] = true;
                }
            }
        }
        return { sentences: lessonSentences };
    }

    @Decorators.method
    static finishLesson(lessonId, wordFailures, callback?) {
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
        for (let id in wordFailures) {
            let word = user.study.learnedWords.filter(lw => lw.id == id)[0];
            if (!word) {
                word = { id: id, lessonId: lessonId, lastDate: timestamp, bucket: 0 };
                user.study.learnedWords.push(word);
            }
            let canIncreaseBucket = !word.bucket || !word.lastDate || (timestamp - word.lastDate) >= RepetitionIntervals["Level" + word.bucket] * 3600000;
            if (wordFailures[id] <= 1 && canIncreaseBucket)
                word.bucket = Math.min(6, word.bucket + 1);
            if (wordFailures[id] >= 3)
                word.bucket = Math.max(0, word.bucket - 1);
            word.lastDate = timestamp;
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