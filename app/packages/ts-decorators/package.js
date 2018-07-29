Package.describe({
    name: 'ts-decorators',
    version: '0.0.3',
    summary: 'Allows using TypeScript decorators @method and @publish.'
  });
  
  Package.registerBuildPlugin({
    name: "tsDecorators",
    use: ['barbatus:typescript-compiler'],
    sources: ['ts-decorators.js']
  });
  
  Package.onUse(function(api) {
    api.versionsFrom('1.4.1');
    api.use('isobuild:compiler-plugin@1.0.0');
    api.use('barbatus:typescript-compiler@0.10.0');
    api.addFiles('Decorators.js', 'server');
  
    api.imply("modules@0.11.6");
    api.imply("barbatus:typescript-runtime@1.1.0");
  });
  