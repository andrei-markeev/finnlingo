Package.describe({
  name: 'vue-templates',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Compile vue.js templates.',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.registerBuildPlugin({
  name: "compileVueTemplates",
  sources: ['vue-templates.js']
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.1');
  api.use('isobuild:compiler-plugin@1.0.0');
  api.addFiles('VueTemplates_all.html', ['web.browser'], { bare: true });
});
