describe('Angular whene', function() {
  var $routeProvider;

  beforeEach(module('ngWhenever'));

  describe('url parsing', function() {
    var spy,
        $location, $rootScope;

    beforeEach(function() {
      module(function($routeProvider) {
        spy = jasmine.createSpy();
        $routeProvider.when('/hello/:you/:handsome/devil', {
          whenever : spy
        });
      });
    });
    beforeEach(inject(function(_$location_, _$rootScope_) {
      $location = _$location_;
      $rootScope = _$rootScope_;
    }));

    function route(url) {
      $location.path(url);
      $rootScope.$digest();
    }

    it('should ignore longer urls', function() {
      route('/hello/you/handsome/devil/you');
      route('/hello/you/handsome/devil/you/ho');
      route('/hello/you/handsome/devil/you/ho/ho');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should ignore shorter urls', function() {
      route('/hello/you/handsome');
      route('/hello/you');
      route('/hello');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should ignore urls that wont match the keys', function() {
      route('/hello1/you/handsome/devil');
      route('/hello/you/handsome/devil1');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should trigger with complex urls', function() {
      route('/hello/param/here/devil');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('html5 pushstate', function() {
    beforeEach(function() {
      module(function(_$routeProvider_, $locationProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider    = _$routeProvider_;
      });
    });
    beforeEach(inject(function($location) {
      $location.path('');
    }));

    it('should trigger routing with html5 pushstate', inject(function($rootScope, $location) {
      var calledSpy    = jasmine.createSpy();

      $routeProvider.when('/test/:uri', {
        whenever : calledSpy
      });

      $location.path('/test/123');
      $rootScope.$digest();
      expect(calledSpy).toHaveBeenCalled();
    }));
  });

  describe('hashbang', function() {
    beforeEach(function() {
      module(function(_$routeProvider_, $locationProvider) {
        $locationProvider.hashPrefix("!");
        $routeProvider    = _$routeProvider_;
      });
    });

    it('should trigger routing with hashbang', inject(function($rootScope, $location) {
      var calledSpy    = jasmine.createSpy();

      $routeProvider.when('/test/:uri', {
        whenever : calledSpy
      });

      $location.path('/test/123');
      $rootScope.$digest();
      expect(calledSpy).toHaveBeenCalled();
    }));
  });

  describe('triggering', function() {
    beforeEach(function() {
      module(function(_$routeProvider_) {
        $routeProvider    = _$routeProvider_;
      });
    });
    beforeEach(inject(function($location) {
      $location.path('');
    }));

    it('should trigger only first spy when routing', inject(function($rootScope, $location) {
      var calledSpy    = jasmine.createSpy();
      var notCalledSpy = jasmine.createSpy();

      $routeProvider.when('/test/:uri', {
        whenever : calledSpy
      }).when('/test/:uri1', {
        whenever : notCalledSpy
      });
      $location.path('/test/123');
      $rootScope.$digest();
      expect(calledSpy).toHaveBeenCalled();
      expect(notCalledSpy).not.toHaveBeenCalled();
    }));

    it('should cancel route if whenever returns falsy result', inject(function($rootScope, $location) {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        whenever : function() {
          return false;
        }
      });
      $location.path('/test/123');
      $rootScope.$digest();
      expect($location.path()).not.toBe('/test/123');
    }));

    it('should cancel route if whenever returns falsy result [array]', inject(function($rootScope, $location) {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        whenever : [function() {
          return false;
        }]
      });
      $location.path('/test/123');
      $rootScope.$digest();
      expect($location.path()).not.toBe('/test/123');
    }));

    // Will throw exception when trying to fetch /wat/wat.html
    it('should cancel route before fetching the template', inject(function($rootScope, $location) {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        templateUrl : '/wat/wat.html',
        whenever   : function() {
          return false;
        }
      });
      $location.path('/test/123');
      $rootScope.$digest();
      expect($location.path()).not.toBe('/test/123');
    }));

    it('should not cancel route if whenever returns truthy result', inject(function($rootScope, $location) {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        whenever : function() {
          return true;
        }
      });
      $location.path('/test/123');
      $rootScope.$digest();
      expect($location.path()).toBe('/test/123');
    }));

    it('should not cancel route if whenever returns truthy result [array]', inject(function($rootScope, $location) {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        whenever : [ function() {
          return true;
        }]
      });
      $location.path('/test/123');
      $rootScope.$digest();
      expect($location.path()).toBe('/test/123');
    }));

    it('should work with dependency injection', inject(function($rootScope, $location) {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        whenever : function($rootScope) {
          expect($rootScope).toBeDefined();
          spy();
        }
      });
      $location.path('/test/123');
      $rootScope.$digest();
      expect(spy).toHaveBeenCalled();
    }));

    it('should work with dependency injection [array]', inject(function($rootScope, $location) {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        whenever : ['$rootScope', function($rootScope) {
          expect($rootScope).toBeDefined();
          spy();
        }]
      });
      $location.path('/test/123');
      $rootScope.$digest();
      expect(spy).toHaveBeenCalled();
    }));

    it('should work with dependency injection [injector]', inject(function($rootScope, $location) {
      var spy = jasmine.createSpy('basic trigger');

      function whenever($rootScope) {
        expect($rootScope).toBeDefined();
        spy();
      }

      whenever.$injector = [ '$rootScope' ];

      $routeProvider.when('/test/:uri', {
        whenever : whenever
      });
      $location.path('/test/123');
      $rootScope.$digest();
      expect(spy).toHaveBeenCalled();
    }));
  });
});