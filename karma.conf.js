module.exports = function(config) {
  config.set({
    frameworks : [ "jasmine" ],
    basePath   : '.',
    browsers   : ['PhantomJS'],
    colors     : true,
    reporters  : [ 'progress' ],
    files      : [ 'components/angular/angular.js', 'components/angular-mocks/angular-mocks.js', 'src/*.js', 'test/*.spec.js' ],
    singleRun  : true
  });
};
