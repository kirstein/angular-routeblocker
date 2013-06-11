/**
 * Angular whenever.
 *
 * Simple angular module that when initiated will listen to `$locationChangeStart` event.
 * If the event is called then it will go through all registered routes, will check if the route has `whenever` attribute
 * and if the route matches our current location.
 *
 * If the route matches and it has `whenever` property then it will invoke it and evaluate its result.
 * If the result happens to be falsy then it will prevent the location change.
 *
 * Keep in mind that everything that happens in `whenever` function must be synchronous in order for it to matter.
 * Also you must keep in mind that you cant directly change location from the `whenever` function.
 * The location change must happen asynchronously for it to work (with next tick).
 * You can do that with `$rootScope.$evalAsync` for instance.
 *
 */
(function (angular) {
  "use strict";

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
    when = '^' + when.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + '$';

    var regex = '',
        re = /:(\w+)/g,
        paramMatch,
        lastMatchedIndex = 0;

    while ((paramMatch = re.exec(when)) !== null) {
      // Find each :param in `when` and replace it with a capturing group.
      // Append all other sections of when unchanged.
      regex += when.slice(lastMatchedIndex, paramMatch.index);
      regex += '([^\\/]*)';
      lastMatchedIndex = re.lastIndex;
    }
    // Append trailing path part.
    regex += when.substr(lastMatchedIndex);

    // Check if the route matches
    return !! url.match(new RegExp(regex));
  }

  /**
   * Parse the absolute location to path.
   *
   * @param  {String} url absolute url
   * @return {String} parsed path
   */
  function getPath($location, url) {
    var baseurl = $location.protocol() + "://" + $location.host(),
        path    = url.substring(baseurl.length, url.length);

    // Remove the hash or hashbang and replace it with an hash
    return path.replace(/^\/#(.*?)\//, '/');
  }

  angular.module('ngWhenever', [])
         .run([ '$location' ,'$route', '$rootScope', '$injector', function($location, $route, $rootScope, $injector) {

    $rootScope.$on('$locationChangeStart', function(evt, newLocation) {
      var found    = false,
          location = getPath($location, newLocation),
          whenever;

      /**
       * Loop through all the routes and check if their properties have ```whenever``` function
       * If we find the route that matches and has ```whenever``` function then lets figure out the result of that
       * and decide if we are going to go ahead with the routing or not.
       */
      angular.forEach($route.routes, function(properties, route) {
        whenever = properties.whenever;

        // Check if the whenever property is a function or an array and if the route matches
        if (!found && (angular.isFunction(whenever) || angular.isArray(whenever)) && routeMatches(location, route)) {

          // Execute the injector and parse the result.
          // If the result happens to be falsey then prevent the route
          if (!$injector.invoke(whenever)) {
            found = true;
            evt.preventDefault();
          }
        }
      });
    });
  }]);

})(angular);
