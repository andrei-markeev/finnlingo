interface User {

    _id?: string;
    username?: string;
    emails?: Meteor.UserEmail[];
    createdAt?: number;
    profile?: {
        name?: string;
        photo?: string;
    };
    services?: any;

    selectedCourseId: string;
    study: {
        dailyGoal: number;
        daysStudied: number;
        lastDateStudied: number;
        lastDateXP: number;
        streakDays: number;
        streakLastDate: number;
        xp: number;
        completedLessonIds: string[];
        learnedWords: { id: string; lessonId: string; lastDate: number; bucket: number; }[];
    }

}

// in hours
enum RepetitionIntervals {
    Level0 = 0,
    Level1 = 5,
    Level2 = 24,
    Level3 = 5 * 24,
    Level4 = 25 * 24,
    Level5 = 120 * 24,
    Level6 = 720 * 24
}

interface TextWithRemarks {
    text: string;
    remarks: string;
}

interface Word
{
    _id?: string;
    text: string;
    lessonId: string;
    remarks?: string;
    audio?: string;
    inflections: TextWithRemarks[];
    translations: TextWithRemarks[];
}
declare var Words: Mongo.Collection<Word>; 
Words = new Mongo.Collection<Word>("words");

interface Sentence
{
    _id?: string;
    text: string;
    wordId: string;
    translations: TextWithRemarks[];
    backTranslations: TextWithRemarks[];
    wordHints: { [word: string]: { wordId: string; inflection: string; translations: TextWithRemarks[] } };
}
declare var Sentences: Mongo.Collection<Sentence>; 
Sentences = new Mongo.Collection<Sentence>("sentences");

interface Lesson {
    id: string;
    name: string;
    icon: string;
    isOptional?: boolean;
};

interface Course
{
    _id?: string;
    name: string;
    tree: { lessons: Lesson[]; }[];
    admin_ids: string[];
}
declare var Courses: Mongo.Collection<Course>; 
Courses = new Mongo.Collection<Course>("courses");
