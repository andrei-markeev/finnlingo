var splitSync = require('../app/node_modules/node-split').splitSync;
var fs = require('fs');

var bundleDir = __dirname + "/bundle";
if (!fs.existsSync(bundleDir))
    fs.mkdirSync(bundleDir);
else
    fs.readdirSync(bundleDir).forEach(f => fs.unlinkSync(bundleDir + "/" + f));

var args = process.argv.slice(2);
var orderedArgs = [];
for (var i = 0; i < args.length; i++) {
    if (args[i] == '-b' || args[i] == '--bytes')
        bytes = args[++i];
    else if (args[i].indexOf('-') == 0)
        throw new Error("Unknown option " + args[i]);
    else
        orderedArgs.push(args[i]);
}

var [ source, prefix ] = orderedArgs;

var contents = fs.readFileSync(source, { encoding: null });

splitSync(contents, {
    bytes: bytes,
    prefix: prefix
});
