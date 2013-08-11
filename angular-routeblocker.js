/* 
 * angular-routeblocker 0.0.3
 * https://github.com/kirstein/angular-routeblocker
 * 
 * Licensed under the MIT license
 */
/**
 * Angular routeblocker.
 *
 * Simple angular module that when initiated will listen to `$locationChangeStart` event.
 * If the event is called then it will go through all registered routes and will check for the route properties.
 * If the route happens to have some properties that are defined for routeBlocker that return falsey then it will block the route.
 *
 * By default there is only one property the angular routeBlocker is looking for and thats `block`.
 * However angular routeBlocker provides $routeBlockProvider that you can config in order to add more properties to check.
 *
 * Keep in mind that everything that happens in `blocking` functions must be synchronous in order for it to matter.
 * Also you must keep in mind that you cant directly change location from the blocking function.
 * The location change must happen asynchronously for it to work (with next tick).
 * You can do that with `$rootScope.$evalAsync` for instance.
 *
 * Have fun!
 */
(function (angular) {
  "use strict";

  var PORTS        = { http : 80, https: 443 },         // List of common protocols and their matching ports
      REGEXP_PATH  = /^(([^\#]*?)(#[^\/]*?))\/(\?.*)?/, // Regexp for figuring out the pathname http://fiddle.re/2mx4a for regexp tests
      DEF_PROPERTY = 'block';

  /**
   * Validates if the route matches given path.
   * Builds a regexp to filter out all params from route and matches it against the plain string location.
   *
   * @param  {String} url location to validate against
   * @param  {String} when route which location to validate
   * @return {Boolean} true - route matches, false - route does not match
   */
  function routeMatches (url, when) {
    // Escape regexp special characters.
    // We don't have to consider the first slash due the fact that angular adds / to missing urls
    when = '^' + when.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + '$';

    var regexp = '',
        re = /:(\w+)/g,
        paramMatch,
        lastMatchedIndex = 0;

    while ((paramMatch = re.exec(when)) !== null) {

      // Find each :param in `when` and replace it with a capturing group.
      // Append all other sections of when unchanged.
      regexp += when.slice(lastMatchedIndex, paramMatch.index);
      regexp += '([^\\/]*)';
      lastMatchedIndex = re.lastIndex;
    }
    // Append trailing path part.
    regexp += when.substr(lastMatchedIndex);

    // Check if the route matches
    return !! url.match(new RegExp(regexp));
  }

  /**
   * Returns the baseURL.
   * Does not handle the <base> uri if it exists.
   *
   * Combines url using angular '$location' service (testing issues with using window.location).
   * Removes the port from URI if the port happens to be matched by its protocol in PORTS object.
   *
   * @param  {Location service} $location. Location service with port, protocol and host functions
   * @return {String} combined absolute baseurl
   */
  function getBase($location) {
    var port     = $location.port(),
        protocol = $location.protocol();

    // If the port happens to be 80 or 443, lets remove it instead.
    port = PORTS[protocol] === port ? '' : ':' + port;

    return protocol + "//" + $location.host() + port + "/";
  }

  /**
   * Parse the absolute location to path.
   * Remove the hash and any hashbang formation from the url.
   *
   * @param  {Location service} Object with port, protocol and host functions
   * @param  {String} url absolute url
   * @return {String} parsed path
   */
  function getPath($location, url) {
    var baseUrl  = getBase($location, url),
        path     = url.substring(baseUrl.length); // Remove the baseURL portion from URI

    // Return the path or slash
    return path.replace(REGEXP_PATH, '/');
  }

  function contains(list, item) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] === item) {
        return true;
      }
    }
    return false;
  }

  /**
   * Loops through the list and uses its values for property keys.
   * If the property values for those keys happen to be an arrays or functions then it will return the list of findings.
   *
   * @param {Array} list list of keys to search
   * @param {Object} properties from what to extract values by list items
   * @return {Array} array of matching properties
   */
  function getValidProperties(list, properties) {
    var result = [];

    angular.forEach(list, function(property) {
      var prop = properties[property];
      if (angular.isArray(prop) || angular.isFunction(prop)) {
        result.push(prop);
      }
    });

    return result;
  }

  // Define the angular module for the route blocker
  var routeBlockerModule = angular.module('ngRouteBlocker', []);
  routeBlockerModule.provider('$routeBlocker', function() {

    // List of properties.
    // By default the property list contains the DEF_PROPERTY ('block')
    var properties = [ DEF_PROPERTY ];

    /**
     * Remove a property or multiple property handlers from a list.
     *
     * @param {String|Array} prop property name or list of properties to remove.
     */
    this.removeProperty = function(prop) {
      if (prop) {
        // If the target is an array
        // lets remove each property off that list
        if (angular.isArray(prop)) {
          return this.removeProperty.apply(this, prop);
        }

        angular.forEach(properties, function(property, index, list) {
          // If the property matches then
          // remove the index from given list
          if (property === prop) {
            list.splice(index, 1);
          }
        });
      }
    };

    /**
     * @return {Array} list of property names
     */
    this.getProperties = function() {
      return properties;
    };

    /**
     * Adds a property or a list of properties to property definition list.
     *
     * @param {String|Array} prop property or a list of properties to add
     * @return {Array} all properties that are currently registered
     * @throws Error when the added data does not contain strings
     */
    this.addProperty = function(prop) {
      angular.forEach([].concat(prop), function(property) {
        if (angular.isString(property)) {
          if (!contains(properties, property)) {
            properties.push(property);
          }
        } else {
          throw new Error('Invalid RouteBlocker property name');
        }
      });

      return properties;
    };

    /**
     * $properties constructor
     * @returns {Object} object with getProperties function
     */
    this.$get = function() {
      return {
        getProperties : this.getProperties
      };
    };
  });

  // Run block that starts to listen for the `$locationChangeStart` event
  routeBlockerModule.run([ '$routeBlocker', '$location', '$route', '$rootScope', '$injector', function($routeBlocker, $location, $route, $rootScope, $injector) {

    // Get all properties
    var props = $routeBlocker.getProperties();

    // If there are zero properties defined
    // then lets just call it a day.
    if (!props.length) {
      return;
    }

    $rootScope.$on('$locationChangeStart', function(evt, newLocation) {
      var found    = false,
          location = getPath($location, newLocation);

      /**
       * Loop through all the routes and check if their properties have ```block``` function
       * If we find the route that matches and has ```block``` function then lets figure out the result of that
       * and decide if we are going to go ahead with the routing or not.
       */
      angular.forEach($route.routes, function(properties, route) {
        var validProperties = getValidProperties(props, properties);

        // Check if the block property is a function or an array and if the route matches
        if (!found && validProperties.length && routeMatches(location, route)) {

          // Go through all route properties that match our requirements
          angular.forEach(validProperties, function(property) {

            // Execute the injector and parse the result.
            // If the result happens to be falsy then prevent the route
            if (!found && !$injector.invoke(property)) {
              found = true;
              evt.preventDefault();
            }
          });
        }
      });
    });
  }]);

})(angular);
