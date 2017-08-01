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
    dailyGoal: number;
    daysStudied: number;
    streakDays: number;
    streakLastDate: number;
    xp: number;
    completedLessonIds: number[];
    learnedWords: { id: string; lastDate: number; lastResult: number; }[];

}

interface Word
{
    _id?: string;
    text: string;
    lessonId: string;
    remarks?: string;
    audio?: string;
    inflections: string[];
    translations: { text: string, remarks: string; }[];
}
declare var Words: Mongo.Collection<Word>; 
Words = new Mongo.Collection<Word>("words");

interface Sentence
{
    _id?: string;
    text: string;
    wordId: string;
    translations: { text: string, remarks: string; }[];
    backTranslations: { text: string, remarks: string; }[];
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
