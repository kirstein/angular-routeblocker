# angular-whenever [![Build Status](https://travis-ci.org/kirstein/angular-whenever.png)](https://travis-ci.org/kirstein/angular-whenever.png)

A module that makes decisive routing super easy.

### Getting started
---
Add ```ngWhenever``` to required modules list

```
    angular.module('myApp', [ …, 'ngWhenever' ]);
```

Add ```whenever``` function route:  

```
  module.config(function($routeProvider) {
    $routeProvider.when('url', {
      templateUrl : 'template.html',
      controller  : 'ControllerName',
      whenever    : function() {
        …
        return true;
      }
    })
  })
```  
  
Whenever a ```$locationChangeStart``` event is triggered it will go through all registered routes and decide (by triggering the described whenever function) if we can continue with the location change or not.  

In order to continue routing then the ```whenever``` function must return ```truthy``` values.
If the ```whenever``` function returns ```truthy``` values then it will just continue with the routing.

If the method returns ```falsy``` result then it will cancel the location change event so it would never reach the route configuration.  

### Dependency injection with ```whenever``` function

The ```whenever``` function works with dependency injection. It works with all three methods of dependency injection.  

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

       