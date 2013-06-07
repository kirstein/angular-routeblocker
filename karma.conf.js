files = [

  JASMINE,
  JASMINE_ADAPTER,

  'components/angular/angular.js',
  'components/angular-mocks/angular-mocks.js',

  // The library itself
  'src/*.js',

  'test/**.spec.js'
];

growl     = true;
colors    = true;
singleRun = true;
autoWatch = false;
browsers  = ['PhantomJS'];
reporters = ['progress', 'growl'];
