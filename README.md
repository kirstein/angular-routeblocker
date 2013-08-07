# angular-routeblocker [![Build Status](https://travis-ci.org/kirstein/angular-routeblocker.png)](https://travis-ci.org/kirstein/angular-routeblocker.png)

A module that makes decisive routing super easy.

### Getting started
---
Add ```ngRouteblocker``` to required modules list

```
    angular.module('myApp', [ …, 'ngRouteblocker' ]);
```

Add ```block``` function route:

```
  module.config(function($routeProvider) {
    $routeProvider.when('url', {
      templateUrl : 'template.html',
      controller  : 'ControllerName',
      block      : function() {
        …
        return true;
      }
    })
  })
```

Whenever a ```$locationChangeStart``` event is triggered it will go through all registered routes and decide (by triggering the described block function) if we can continue with the location change or not.

In order to continue routing then the ```block``` function must return ```truthy``` values.
If the ```block``` function returns ```truthy``` values then it will just continue with the routing.

If the method returns ```falsy``` result then it will cancel the location change event so it would never reach the route configuration (no template download? _jay_).

### Dependency injection with ```block``` function

The ```block``` function works with dependency injection. It works with all three methods of dependency injection.

1. using ```$injector```
2. using ```array```
3. plain function injection

### Devel
---

```
  npm install
  bower install
  grunt test
  grunt build
```


