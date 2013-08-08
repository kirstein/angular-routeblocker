describe('Angular routeBlocker', function() {
  var $routeProvider, $location, $routeScope, spy;

  beforeEach(module('ngRouteBlocker'));

  // Route to url
  function route(url) {
    $location.path(url);
    $rootScope.$digest();
  }

  describe('url parsing', function() {

    beforeEach(function() {
      module(function($routeProvider) {
        spy = jasmine.createSpy();
        $routeProvider.when('/hello/:you/:handsome/devil', {
          block : spy
        });
      });
    });

    beforeEach(inject(function(_$location_, _$rootScope_) {
      $location  = _$location_;
      $rootScope = _$rootScope_;
      $location.path('');
    }));

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

    beforeEach(inject(function(_$location_, _$rootScope_) {
      $location  = _$location_;
      $rootScope = _$rootScope_;
      $location.path('');
    }));

    it('should trigger routing with html5 pushstate', function() {
      var calledSpy    = jasmine.createSpy();

      $routeProvider.when('/test/:uri', {
        block : calledSpy
      });

      route('/test/123');
      expect(calledSpy).toHaveBeenCalled();
    });
  });

  describe('hashbang', function() {
    beforeEach(function() {
      module(function(_$routeProvider_, $locationProvider) {
        $locationProvider.hashPrefix("!");
        $routeProvider    = _$routeProvider_;
      });
    });

    beforeEach(inject(function(_$location_, _$rootScope_) {
      $location  = _$location_;
      $rootScope = _$rootScope_;
      $location.path('');
    }));

    it('should trigger routing with hashbang', function() {
      var calledSpy = jasmine.createSpy();

      $routeProvider.when('/test/:uri', {
        block : calledSpy
      });

      route('/test/123');
      expect(calledSpy).toHaveBeenCalled();
    });
  });

  describe('hashbang (multiple symbols)', function() {
    beforeEach(function() {
      module(function(_$routeProvider_, $locationProvider) {
        $locationProvider.hashPrefix("!bangbang");
        $routeProvider    = _$routeProvider_;
      });
    });

    beforeEach(inject(function(_$location_, _$rootScope_) {
      $location  = _$location_;
      $rootScope = _$rootScope_;
      $location.path('');
    }));

    it('should trigger routing with hashbang', function() {
      var calledSpy = jasmine.createSpy();

      $routeProvider.when('/test/:uri', {
        block : calledSpy
      });

      route('/test/123');
      expect(calledSpy).toHaveBeenCalled();
    });
  });

  describe('triggering', function() {

    beforeEach(function() {
      module(function(_$routeProvider_) {
        $routeProvider = _$routeProvider_;
      });
    });

    beforeEach(inject(function(_$location_, _$rootScope_) {
      $location  = _$location_;
      $rootScope = _$rootScope_;
      $location.path('');
    }));

    it('should trigger only first spy when routing', function() {
      var calledSpy    = jasmine.createSpy();
      var notCalledSpy = jasmine.createSpy();

      $routeProvider.when('/test/:uri', {
        block : calledSpy
      }).when('/test/:uri1', {
        block : notCalledSpy
      });

      route('/test/123');

      expect(calledSpy).toHaveBeenCalled();
      expect(notCalledSpy).not.toHaveBeenCalled();
    });

    it('should cancel route if we are dealing with routing from one route to another and block returns falsy result', function() {
      var spy = jasmine.createSpy('basic trigger');

      $routeProvider.when('/test/:uri', {
        block : function() {
          return false;
        }
      }).when('/works', { });

      // Route to works first
      route('/works');
      expect($location.path()).toBe('/works');

      // Route to canceled route afterwards
      route('/test/123');
      expect($location.path()).not.toBe('/test/123');
    });


    it('should cancel route if block returns falsy result', function() {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        block : function() {
          return false;
        }
      });
      route('/test/123');
      expect($location.path()).not.toBe('/test/123');
    });

    it('should cancel route if block returns falsy result [array]', function() {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        block : [function() {
          return false;
        }]
      });

      route('/test/123');
      expect($location.path()).not.toBe('/test/123');
    });

    // Will throw exception when trying to fetch /wat/wat.html
    it('should cancel route before fetching the template', function() {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        templateUrl : '/wat/wat.html',
        block   : function() {
          return false;
        }
      });
      route('/test/123');
      expect($location.path()).not.toBe('/test/123');
    });

    it('should not cancel route if block returns truthy result', function() {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        block : function() {
          return true;
        }
      });
      route('/test/123');
      expect($location.path()).toBe('/test/123');
    });

    it('should not cancel route if block returns truthy result [array]', function() {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        block : [ function() {
          return true;
        }]
      });
      route('/test/123');
      expect($location.path()).toBe('/test/123');
    });

    it('should work with dependency injection', function() {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        block : function($rootScope) {
          expect($rootScope).toBeDefined();
          spy();
        }
      });
      route('/test/123');
      expect(spy).toHaveBeenCalled();
    });

    it('should work with dependency injection [array]', function() {
      var spy = jasmine.createSpy('basic trigger');
      $routeProvider.when('/test/:uri', {
        block : ['$rootScope', function($rootScope) {
          expect($rootScope).toBeDefined();
          spy();
        }]
      });
      route('/test/123');
      expect(spy).toHaveBeenCalled();
    });

    it('should work with dependency injection [injector]', function() {
      var spy = jasmine.createSpy('basic trigger');

      function block($rootScope) {
        expect($rootScope).toBeDefined();
        spy();
      }

      block.$injector = [ '$rootScope' ];

      $routeProvider.when('/test/:uri', {
        block : block
      });
      route('/test/123');
      expect(spy).toHaveBeenCalled();
    });
  });
});
