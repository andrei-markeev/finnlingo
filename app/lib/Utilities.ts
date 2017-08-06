var Decorators = this.Decorators || {};

class Utilities {
    static sentenceToWords(s: string) {
        var sentence = s.split(/[,\.-\?!:\s]+/).join(' ').replace(/^\s+/,'').replace(/\s+$/,'').toLowerCase();
        sentence = sentence.replace(/i'm/g,"i am").replace(/it's/g,"it is");
        sentence = sentence.replace(/they're/g,"they are").replace(/we're/g,"we are").replace(/you're/g,"you are");
        sentence = sentence.replace(/don't/g,"do not").replace(/doesn't/g,"does not").replace(/didn't/g,"did not");
        sentence = sentence.replace(/\b(a|an|the) ([a-zA-Z']+)/g, "$2");
        return sentence.split(' ');
    }
}
this.Utilities = Utilities;
