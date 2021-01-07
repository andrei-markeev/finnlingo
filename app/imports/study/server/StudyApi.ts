import { ACL } from "../../../lib/server/ACL";
import { Utilities } from "../../../lib/Utilities";
import { WordsApi } from "../../courses/server/WordsApi";

export class StudyApi
{
    @Decorators.method
    static getSentences(lessonId, callback?) {
        var user = ACL.getUserOrThrow(this);
        var lessonSentences = Sentences.find({ lessonId: lessonId }, { sort: { order: 1 }}).fetch();
        var wordPics: Word[];
        var wordOptions: Word[];
        for (let sentence of lessonSentences) {
            if (sentence.testType == SentenceTestType.WordPictures) {
                if (!wordPics) {
                    wordPics = Words.find({ }, { fields: { text: 1, translations: 1 } }).fetch()
                        .filter(w => w.translations[0] && WordsApi.wordPictures.some(wp => wp == Utilities.getPictureId(w.translations[0].text)));
                }
                
                let rightChoice = wordPics.filter(wp => wp.text == sentence.translations[0].text)[0] 
                    || (<Word>{ text: sentence.translations[0].text, translations: [{ text: "broken-link" }] });
                let lessonPics = wordPics.filter(wp => wp._id != rightChoice._id && wp.lessonId == lessonId).sort(() => .5 - Math.random());
                let otherPics = wordPics.filter(wp => wp._id != rightChoice._id && wp.lessonId != lessonId).sort(() => .5 - Math.random());
                let choices = [rightChoice];
                choices = choices.concat(lessonPics, otherPics);
                choices = choices.slice(0, 4).sort(() => .5 - Math.random());
                choices.forEach(c => c["picture"] = '/' + Utilities.getPictureId(c.translations[0].text) + '.svg');
                sentence["options"] = choices;
            } else if (sentence.testType == SentenceTestType.SelectMissingWord) { 
                sentence["options"] = sentence.translations.map(t => t.text).sort(() => .5 - Math.random());
            } else if (sentence.testType == SentenceTestType.ConstructSentence) {
                let matches = sentence.translations.reduce((a,t) => a + (StudyApi.textIsEnglish(t.text) ? 1 : 0), 0);
                let isEnglish = matches > sentence.translations.length / 2;
                let applicableSentences = lessonSentences.filter(s => s.testType != SentenceTestType.Notes).map(s => s.translations.map(t => t.text).concat(s.text).filter(s => s.length > 10 && StudyApi.textIsEnglish(s) == isEnglish));
                let words = {};
                applicableSentences.forEach(ss => ss.forEach(s => Utilities.sentenceToWords(s).forEach(w => words[w] = 1)));
                sentence.translations.slice(1).forEach(t => t.text.toLowerCase().split(/[,\.-\?!:\s"]+/).filter(w => !!w).forEach(w => words[w] = 1));
                let rightWords = {};
                sentence.translations[0].text.toLowerCase().split(/[,\.-\?!:\s"]+/).filter(w => !!w).forEach(w => rightWords[w] = 1);
                let options = sentence.translations[0].text.toLowerCase().split(/[,\.-\?!:\s"]+/).filter(w => !!w);
                options = options.concat(Object.keys(words).filter(w => !rightWords[w] && !/^_+$/.test(w)).sort(() => .5 - Math.random()).slice(0, 4));
                sentence["options"] = options.sort(() => .5 - Math.random());
            }
            if (user.study && user.study.learnedWords) {
                for (let word in sentence.wordHints) {
                    var learnedWord = user.study.learnedWords.filter(w => w.id == sentence.wordHints[word].wordId)[0];
                    if (learnedWord && ( learnedWord.bucket > 1 || Date.now() - learnedWord.lastDate < 20*60*1000 ))
                        sentence.wordHints[word]["no_hint"] = true;
                }
            }
        }
        return { sentences: lessonSentences };
    }

    static finnishTrigrams = "en |ise|ja |ist| ja|on |ta |sta|an |n j|ais|sen|n o|keu|ike|oik|lis| va|ell|lla|n t|uks| on|ksi| oi|n k| ka|aan|een|la |lli|kai|a j| ta|sa |in |mis| jo|a o|ään|än |sel|n s|kse|a t|a k|tai|us |tta|ans|ssa|kun|den|tä |eus|nen|kan|nsa|apa|all|est| se|eis|ill|ien|see|taa| yh|jok|n y|vap|a v|ttä|oka|n v|ai |itt|aa |aik|ett|tuk|ti |ust| ku|isi|stä|ses| tä| tu|lai|n p|sti|ast|n e|n m|tää|sia|unn|ä j|ude|ä o|ste|si |tei|ine|per|a s|ia |kä |äne| mi|maa| pe|a p|ess|a m|ain|ämä|tam|yht| ju|jul|yks|hän|ä t| hä|utt|ide|et |llä|val|sek|stu|n a|lä |ami|hmi| ke|ikk|lle|iin|sä |euk|täm|ihm|tee| ih|lta|pau| sa|isk|mää|ois|un |tav|ten|dis|hte|n h|iss|ssä|a h|ava| ma|a y| ei| te| si| ol|ekä|sty|alt|toi|att|oll|tet| jä| ra|vat| mu|iel| to|mai|sal|isu|a a|kki|at |suu|n l|väl|ää |uli|tun|tie|eru| yk|etu|vaa|rus|muk| he|ei |a e|kie|sku|eid|iit| su|nna|sil|oma|min| yl|lin|aut|uut|sko| ko|tti|le |sie|kaa|a r| ri|sii|nno|eli|tur|saa|aat|lei|oli|na | la|oon|urv|lma|rva|ite|mie|vas|ä m| ed|tus|iaa|itä|ä v|uol|yle| al|lit|suo|ama|joi|unt|ute|i o|tyk|n r|ali|lii|nee|paa|avi|omi|oit|jen|kää|voi|yhd|ä k| ki|eet|eks| sy|ity|ilö|ilm|oim|ole|sit|ita|uom|vai|usk|ala|hen|ope| pu|auk|pet|oja|i s|rii|uud|hdi|äli|va | om".split('|');
    static englishTrigrams = " th|the| an|he |nd |and|ion| of|of |tio| to|to |on | in|al |ati|igh|ght|rig| ri|or |ent|as |ed |is |ll |in | be|e r|ne |one|ver|all|s t|eve|t t| fr|s a| ha| re|ty |ery| or|d t| pr|ht | co| ev|e h|e a|ng |ts |his|ing|be |yon| sh|ce |ree|fre|ryo|n t|her|men|nat|sha|pro|nal|y a|has|es |for| hi|hal|f t|n a|n o|nt | pe|s o| fo|d i|nce|er |ons|res|e s|ect|ity|ly |l b|ry |e e|ers|e i|an |e o| de|cti|dom|edo|eed|hts|ter|ona|re | no| wh| a | un|d f| as|ny |l a|e p|ere| en| na| wi|nit|nte|d a|any|ted| di|ns |sta|th |per|ith|e t|st |e c|y t|om |soc| ar|ch |t o|d o|nti|s e|equ|ve |oci|man| fu|ote|oth|ess| al| ac|wit|ial| ma|uni| se|rea| so| on|lit|int|r t|y o|enc|thi|ual|t a| eq|tat|qua|ive| st|ali|e w|l o|are|f h|con|te |led| is|und|cia|e f|le | la|y i|uma|by | by|hum|f a|ic | hu|ave|ge |r a| wo|o a|ms |com| me|eas|s d|tec| li|n e|en |rat|tit|ple|whe|ate|o t|s r|t f|rot| ch|cie|dis|age|ary|o o|anc|eli|no | fa| su|son|inc|at |nda|hou|wor|t i|nde|rom|oms| ot|g t|eme|tle|iti|gni|s w|itl|duc|d w|whi|act|hic|aw |law| he|ich|min|imi|ort|o s|se |e b|ntr|tra|edu|oun|tan|e d|nst|l p|d n|ld |nta|s i|ble|n p| pu|n s| at|ily|rth|tho|ful|ssi|der|o e|cat|uca|unt|ien| ed|o p|h a|era|ind|pen|sec|n w|omm|r s".split('|');

    static textIsEnglish(text) {
        text = text.toLowerCase().replace(/[,\.-\?!:\s]+/g, ' ');
        if (text.indexOf("se on ") == 0)
            return false;
        let trigrams = [];
        for (let i = 0; i < text.length - 3; i++)
            trigrams.push(text.substr(i, 3));
        let finnishScore = trigrams.reduce((a, t) => a + (StudyApi.finnishTrigrams.indexOf(t) > -1 ? 1 : 0), 0);
        let englishScore = trigrams.reduce((a, t) => a + (StudyApi.englishTrigrams.indexOf(t) > -1 ? 1 : 0), 0);
        return (englishScore > finnishScore);
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