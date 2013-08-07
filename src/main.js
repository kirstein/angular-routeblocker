/**
 * Angular routeblocker.
 *
 * Simple angular module that when initiated will listen to `$locationChangeStart` event.
 * If the event is called then it will go through all registered routes, will check if the route has `block` attribute
 * and if the route matches our current location.
 *
 * If the route matches and it has `block` property then it will invoke it and evaluate its result.
 * If the result happens to be falsy then it will prevent the location change.
 *
 * Keep in mind that everything that happens in `block` function must be synchronous in order for it to matter.
 * Also you must keep in mind that you cant directly change location from the `block` function.
 * The location change must happen asynchronously for it to work (with next tick).
 * You can do that with `$rootScope.$evalAsync` for instance.
 *
 */
(function (angular) {
  "use strict";

  var PORTS       = { http : 80, https: 443 },         // List of common protocols and their matching ports
      REGEXP_PATH = /^(([^\#]*?)(#[^\/]*?))\/(\?.*)?/; // Regexp for figuring out the pathname
                                                       // http://fiddle.re/2mx4a for regexp tests

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

  angular.module('ngRouteblocker', [])
         .run([ '$location', '$route', '$rootScope', '$injector', function($location, $route, $rootScope, $injector) {

    $rootScope.$on('$locationChangeStart', function(evt, newLocation) {
      var found    = false,
          location = getPath($location, newLocation),
          block;

      /**
       * Loop through all the routes and check if their properties have ```block``` function
       * If we find the route that matches and has ```block``` function then lets figure out the result of that
       * and decide if we are going to go ahead with the routing or not.
       */
      angular.forEach($route.routes, function(properties, route) {
        block = properties.block;

        // Check if the block property is a function or an array and if the route matches
        if (!found && (angular.isFunction(block) || angular.isArray(block)) && routeMatches(location, route)) {

          // Execute the injector and parse the result.
          // If the result happens to be falsey then prevent the route
          if (!$injector.invoke(block)) {
            found = true;
            evt.preventDefault();
          }
        }
      });
    });
  }]);

})(angular);
