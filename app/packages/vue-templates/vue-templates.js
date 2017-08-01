var VueTemplate;

(function() {

	Plugin.registerCompiler({
		extensions: ['html'],
		archMatching: 'web',
		isTemplate: true
	}, function () { return new VueTemplatesCompiler() });

	var VueTemplatesCompiler = function () { };
	VueTemplatesCompiler.prototype.processFilesForTarget = function (files) {
		files.forEach(function (file) {
			var contents = file.getContentsAsString();
			var nodes = parseHtml(contents);
			var addedOneTemplate = false;
			
			for (var i=0;i<nodes.length;i++)
			{
				var node = nodes[i];
				node.tagName == "head" && file.addHtml({ section: "head", data: node.innerHTML });
				node.tagName == "body" && file.addHtml({ section: "body", data: node.innerHTML });
				if (node.tagName == "template") {
					var innerHTMLEscaped = node.innerHTML.replace(/'/g, "\\'").replace(/\r/g, '');
					var tagContentsAsJs = addedOneTemplate ? "" : "VueTemplate=this.VueTemplate||{};\n";
					tagContentsAsJs += "VueTemplate['" + node.attrs.name + "'] = ['" + innerHTMLEscaped.split('\n').join("','") + "'].join('\\n');";					
					file.addJavaScript({ data: tagContentsAsJs, path: file.getBasename() + '_template.js' });
					addedOneTemplate = true;
				}
			}
		});
	};

	function parseHtml(html) {
		var startTagRegex = /^<(!?[-A-Za-z0-9_]+)((?:\s+[\w\-\:]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
			endTagRegex = /^<\/([-A-Za-z0-9_]+)[^>]*>/;
		var special = { script: 1, style: 1 };
		var index, chars, match, stack = [], last = html;
		stack.last = function () {
			return this[this.length - 1];
		};
		var Node = function(tagName, attrs, parent) {
			this.tagName = tagName;
			this.attrs = attrs;
			this.childNodes = [];
			this.parentNode = parent;
			this.innerHTML = "";
		};
		Node.prototype.appendChild = function(tagName, attrs) {
			var newNode = new Node(tagName, attrs, this);
			this.childNodes.push(newNode);
			return newNode;
		};
		Node.prototype.appendInnerHTML = function (html) {
			var node = this;
			while (node) {
				node.innerHTML += html;
				node = node.parentNode;
			}
		};
		var currentNode = new Node();
		var rootNode = currentNode;

		while (html) {
			chars = true;

			// Make sure we're not in a script or style element
			if (!stack.last() || !special[stack.last()]) {

				// Comment
				if (html.indexOf("<!--") == 0) {
					index = html.indexOf("-->");

					if (index >= 0) {
						html = html.substring(index + 3);
						chars = false;
					}

					// end tag
				} else if (html.indexOf("</") == 0) {
					match = html.match(endTagRegex);

					if (match) {
						html = html.substring(match[0].length);
						currentNode = currentNode.parentNode;
						currentNode.appendInnerHTML(match[0]);
						chars = false;
					}

					// start tag
				} else if (html.indexOf("<") == 0) {
					match = html.match(startTagRegex);

					if (match) {
						html = html.substring(match[0].length);
						var attrs = {};
						for (var i = 2;i<match.length-1; i++)
							attrs[match[i].replace(/=.*/,'').replace(/^\s+/,'')] = match[i].replace(/^[^=]+=/,'').slice(1,-1);
						currentNode.appendInnerHTML(match[0]);
						currentNode = currentNode.appendChild(match[1], attrs, "");
						if (match[match.length-1] == "/")
							currentNode = currentNode.parentNode;
						chars = false;
					}
				}

				if (chars) {
					index = html.indexOf("<");

					var text = index < 0 ? html : html.substring(0, index);
					html = index < 0 ? "" : html.substring(index);

					currentNode.appendChild("#text", {});
					currentNode.appendInnerHTML(text);
				}

			} else {
				html = html.substring(html.indexOf("</" + stack.last() + ">"));
			}

			if (html == last) {
				console.log("Parse Error: " + html);
				return rootNode;
			}
			last = html;
		}

		return rootNode.childNodes;

	}
})();