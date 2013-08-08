describe('$routeBlockerProvider', function() {
  var $routeBlockerProvider, $location, $rootScope, $routeProvider;

  function route(path) {
    $location.path(path);
    $rootScope.$digest();
  }

  beforeEach(function() {
    var testModule = angular.module('provider.test', [ 'ngRouteBlocker' ]).config(function(_$routeBlockerProvider_, _$routeProvider_) {
      $routeProvider        = _$routeProvider_;
      $routeBlockerProvider = _$routeBlockerProvider_;
    });

    module(testModule.name);
    inject(function(_$location_, _$rootScope_) {
      $location = _$location_;
      $rootScope = _$rootScope_;
      $location.path('');
    });
  });

  describe('multiple properties blocking', function() {
    it ('should trigger all the added properties', function() {
      var spies = {
        first : jasmine.createSpy(),
        second : jasmine.createSpy(),
        third : jasmine.createSpy()
      };

      $routeBlockerProvider.addProperty(['first', 'second', 'third']);
      $routeProvider.when('/hello', {
        first : function () {
          spies.first();
          return true;
        },
        second : function() {
          spies.second();
          return true;
        },
        third : function() {
          spies.third();
          return true;
        }
      });

      route('/hello');
      expect(spies.first).toHaveBeenCalled();
      expect(spies.second).toHaveBeenCalled();
      expect(spies.third).toHaveBeenCalled();

      expect($location.path()).toBe('/hello');
    });

    it ('should block if first of multiple properties returns falsey value', function() {
      $routeBlockerProvider.addProperty(['first', 'second']);
      $routeProvider.when('/test', {
        first : function () {
          return false;
        },
        second : function() {
          return true;
        }
      });

      route('/test');
      expect($location.path()).not.toBe('/test');
    });

    it ('should not block if there are no properties defined', function() {
      $routeBlockerProvider.removeProperty($routeBlockerProvider.getProperties());
      $routeProvider.when('/test', {
        first : function () {
          return false;
        },
        second : function() {
          return false;
        },
        block : function() {
          return false;
        }
      });

      route('/test');
      expect($location.path()).toBe('/test');
    });

  });

  describe('provider api', function() {

    describe('$routeBlocker', function() {
      it ('should contain #getProperties function', inject(function($routeBlocker) {
        expect($routeBlocker.getProperties).toEqual(jasmine.any(Function));
      }));

      it ('should return list of properties', inject(function($routeBlocker) {
        expect($routeBlocker.getProperties()).toEqual(jasmine.any(Array));
      }));
    });


    describe('#getProperties', function() {
      it ('should have getProperties method', function() {
        expect($routeBlockerProvider.getProperties).toEqual(jasmine.any(Function));
      });

      it ('should have default `block` property', function() {
        expect($routeBlockerProvider.getProperties()).toEqual([ 'block' ]);
      });
    });

    describe('#removeProperty', function() {
      it ('should have removeProperty method', function() {
        expect($routeBlockerProvider.removeProperty).toEqual(jasmine.any(Function));
      });

      it ('should remove property from list (WITH ARRAYS)', function() {
        var properties = $routeBlockerProvider.getProperties();
        $routeBlockerProvider.removeProperty(properties);

        expect($routeBlockerProvider.getProperties()).toEqual([]);
      });

      it ('should remove property from list', function() {
        var prop = $routeBlockerProvider.getProperties()[0];
        $routeBlockerProvider.removeProperty(prop);

        expect($routeBlockerProvider.getProperties()).not.toContain(prop);
      });
    });

    describe('#addProperty', function() {
      it ('should have addProperty method', function() {
        expect($routeBlockerProvider.addProperty).toEqual(jasmine.any(Function));
      });

      it ('should add properties to list', function() {
        $routeBlockerProvider.addProperty('test');
        expect($routeBlockerProvider.getProperties()).toContain('test');
      });

      it ('should add properties to list from an array', function() {
        $routeBlockerProvider.addProperty([ '123' ,'test' ]);
        expect($routeBlockerProvider.getProperties()).toContain('test');
        expect($routeBlockerProvider.getProperties()).toContain('123');
      });

      it ('should not add duplicate properties to list', function() {
        expect($routeBlockerProvider.getProperties().length).toBe(1);

        $routeBlockerProvider.addProperty('test');
        $routeBlockerProvider.addProperty('test');

        expect($routeBlockerProvider.getProperties().length).toBe(2);
        expect($routeBlockerProvider.getProperties()).toContain('test');
      });

      it ('should throw an exception if adding anything other than strings as properties', function() {
        var spy = jasmine.createSpy();

        function testException(type) {
          expect(function() {
            spy();
            $routeBlockerProvider.addProperty(type);
          }).toThrow('Invalid RouteBlocker property name');
        }

        testException(function() {});
        testException(null);
        testException({});
        testException(123);
        testException(undefined);
        testException([ undefined ]);

        // Verify all the calls
        expect(spy.callCount).toBe(6);
      });
    });
  });
});
