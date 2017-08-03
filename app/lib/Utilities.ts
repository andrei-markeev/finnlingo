class Utilities {
    static sentenceToWords(s: string) {
        return s.split(/[,\.-\?!:\s]+/).join(' ').replace(/^\s+/,'').replace(/\s+$/,'').toLowerCase().split(' ');
    }
}
this.Utilities = Utilities;
