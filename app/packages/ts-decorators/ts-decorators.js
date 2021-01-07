Plugin.registerCompiler({
    extensions: ['ts', 'tsx']
}, function() { return new TsDecoratorsCompiler() });

var TsDecoratorsCompiler = function() { this.tsCompiler = new TypeScriptCompiler({
    "lib": [ "es2015", "es2015.promise", "es2017.object", "dom" ],
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "jsx": "preserve",
    "types": [ "meteor", "node" ],
    "importHelpers": true
}); }

TsDecoratorsCompiler.prototype.processFilesForTarget = function(filesToProcess) {

    var pluginFile;
    var rootPath;
    for (var file of filesToProcess) {
        if (!rootPath || rootPath.length > file.getSourceRoot().length) {
            rootPath = file.getSourceRoot();
            pluginFile = file;
        }
    }

    if (pluginFile.getArch().indexOf("web.") == 0) {

        var addedJs = "";
        var controllers = [];

        var processFile = function(path, fileName) {
            var contents = Plugin["fs"].readFileSync(path + "/" + fileName, { encoding: 'utf-8' });
            var pos = 0;
            var newPos = 0;

            while ((newPos = contents.substring(pos).search(/@Decorators\.(method|publish)\s*(?:public\s*)?(?:static\s*)?([A-Za-z_]+)/)) > -1) {
                var match = contents.substring(pos).match(/@Decorators\.(method|publish)\s*(?:public\s*)?(?:static\s*)?([A-Za-z_]+)/);
                var decoratorType = match[1];
                var methodName = match[2];
                var classMatch = contents.substring(0, pos + newPos).replace(/[\r\n]/g,' ').match(/(?:^|[^a-zA-Z0-9_-])class ([A-Za-z0-9_]+)/g);
                var className = classMatch && classMatch[classMatch.length-1].match(/class ([A-Za-z0-9_]+)/)[1];
                var clientJs = `var ${className} = this.${className} || {}; this.${className} = ${className};`;
                if (decoratorType == "method")
                    clientJs += `
${className}.${methodName} = function() {
    var args = Array.prototype.slice.call(arguments);
    return new Promise(function(resolve, reject) {
        args.unshift("${className}.${methodName}");
        args.push(function(error, result) { if (error) reject(error); else resolve(result); });
        return Meteor.call.apply(this, args);
    });
}\n`;
                else if (decoratorType == "publish")
                clientJs += `
${className}.${methodName} = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("${className}.${methodName}");
    return Meteor.subscribe.apply(this, args);
}\n`;
                pos += newPos + 1;
                addedJs += clientJs;
                controllers.push(className);
            }
        };

        var readDirRecursively = function(path) {
            var filesList = Plugin["fs"].readdirSync(path);
            if (filesList)
                for (var file of filesList) {
                    if (Plugin["fs"].lstatSync(path + "/" + file).isDirectory() && file != "node_modules" && file.indexOf(".") != 0)
                        readDirRecursively(path + "/" + file);
                    else if (file.slice(-5) != ".d.ts" && file.slice(-3) == ".ts")
                        processFile(path, file);
                }
        };

        try {
            readDirRecursively(rootPath);
        } catch(e) {
            console.log("ERROR", e);
        }

        // cut out server side imports
        for (let file of filesToProcess) {
            const contents = file.getContentsAsString();
            let found = false;
            const updated = contents.replace(/import\s*{\s*([A-Za-z0-9_]+)\s*}\sfrom\s*(?:"[^"]+"|'[^']+')/g,
                function(matched, name) {
                    if (controllers.indexOf(name) > -1) {
                        found = true;
                        return "declare var " + name;
                    } else {
                        return matched;
                    }
                });

            if (found) {
                file.getContentsAsString = () => updated;
            }
        }

        var proxy = filesToProcess.filter(f => f.getBasename() == "Decorators_proxies.ts")[0];
        proxy.addJavaScript({ data: addedJs, path: file.getBasename() });

    } else {
        const imports = filesToProcess
            .filter(file => file.getPathInPackage().indexOf('imports') == 0)
            .filter(file => file.getContentsAsString().search(/@Decorators\.(method|publish)\s*(?:public\s*)?(?:static\s*)?([A-Za-z_]+)/) > -1)
            .map(file => file.getPathInPackage())
            .map(i => "import '/" + i + "'").join('\n');

        const importsFile = filesToProcess.filter(f => f.getBasename() == "main.ts" && f.getPathInPackage().indexOf('imports') != 0)[0];
        const contents = importsFile.getContentsAsString();
        importsFile.getContentsAsString = () => imports + "\n\n" + contents;
    }

    this.tsCompiler.processFilesForTarget(filesToProcess);

}
