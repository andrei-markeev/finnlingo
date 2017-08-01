Package.describe({
  name: 'ts-decorators',
  version: '0.0.2',
  // Brief, one-line summary of the package.
  summary: 'Allows using TypeScript decorators @method and @publish.',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.registerBuildPlugin({
  name: "tsDecorators",
  use: ['barbatus:typescript-compiler'],
  sources: ['ts-decorators.js']
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.1');
  api.use('isobuild:compiler-plugin@1.0.0');
  api.use('barbatus:typescript-compiler@0.9.5');
  api.addFiles('Decorators.js', 'server');

  api.imply("modules@0.7.7");
  api.imply("barbatus:typescript-runtime@1.0.0");
});
