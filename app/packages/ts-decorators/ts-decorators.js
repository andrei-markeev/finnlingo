Plugin.registerCompiler({
    extensions: ['ts']
}, function() { return new TsDecoratorsCompiler() });


var TsDecoratorsCompiler = function() { this.tsCompiler = new TypeScriptCompiler(); }

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
                clientJs += `${className}.${methodName} = function() { `;
                clientJs += `var args = Array.prototype.slice.call(arguments); args.unshift("${className}.${methodName}");`; 
                if (decoratorType == "method") {
                    clientJs += `if (window["GlobalErrorHandler"] && typeof args[args.length-1] !== 'function') args.push(window["GlobalErrorHandler"]);`;
                    clientJs += `return Meteor.call.apply(this, args);`;
                } else if (decoratorType == "publish")
                    clientJs += `return Meteor.subscribe.apply(this, args);`;
                clientJs += "}\n";
                pos += newPos + 1;
                addedJs += clientJs;
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

        var newFile = {};
        newFile.prototype = pluginFile.prototype;
        for (var k in pluginFile)
            newFile[k] = pluginFile[k];
        newFile.getContentsAsString = function() { return addedJs; }
        newFile.getBasename = function() { return "__server_proxy.ts"; };
        newFile.getPathInPackage = function() { return "__server_proxy.ts"; }
        newFile.getPackageName = pluginFile.getPackageName;
        newFile.addJavaScript = pluginFile.addJavaScript;
        newFile.getSourceHash = function(){
            return addedJs.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
        };
        newFile.getArch = pluginFile.getArch;
        newFile.getFileOptions = pluginFile.getFileOptions;
        filesToProcess.unshift(newFile);

    }

    this.tsCompiler.processFilesForTarget(filesToProcess);

}
