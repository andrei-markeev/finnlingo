export class Utilities {
    static sentenceToWords(s: string) {
        var sentence = s.split(/[,\.-\?!:\s"]+/).join(' ').replace(/^\s+/,'').replace(/\s+$/,'').toLowerCase();
        sentence = sentence.replace(/i'm/g,"i am").replace(/it's/g,"it is");
        sentence = sentence.replace(/they're/g,"they are").replace(/we're/g,"we are").replace(/you're/g,"you are");
        sentence = sentence.replace(/don't/g,"do not").replace(/doesn't/g,"does not").replace(/didn't/g,"did not");
        sentence = sentence.replace(/\b(a|an|the) ([a-zA-Z']+)/g, "$2");
        return sentence.split(' ');
    }

    static getSentenceTokens(text) {
        var tokens = [];
        var delimiterRegex = /[,\.-\?!:\s"]/;
        for (let i = 0; i < text.length; i++) {
            let l = tokens.length;
            if (l && !delimiterRegex.test(tokens[l-1]) && !delimiterRegex.test(text[i]))
                tokens[l-1] += text[i];
            else
                tokens.push(text[i]);
        }
        return tokens;
    }

    static getPictureId(text) {
        return text.replace(/^(the\s+|a\s+|an\s+)/,'').replace(/ /g,'-');
    }
}
