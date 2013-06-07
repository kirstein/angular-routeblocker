(function (angular) {
  "use strict";

  var selectiveModule = angular.module('ngWhenever', []);

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

  selectiveModule.run([ '$location', '$route', '$rootScope', '$injector', function($location, $route, $rootScope, $injector) {

    $rootScope.$on('$locationChangeStart', function(evt, newLocation) {
      var found = false;

      /**
       * Loop through all the routes and check if their properties have ```whenever``` function
       * If we find the route that matches and has ```whenever``` function then lets figure out the result of that
       * and decide if we are going to go ahead with the routing or not.
       */
      angular.forEach($route.routes, function(properties, route) {
        var whenever = properties.whenever;
        if (!found && (angular.isFunction(whenever) || angular.isArray(whenever)) && routeMatches($location.path(), route)) {

          // Get the result from the whenever method
          var result = $injector.invoke(whenever);

          // If the result does not match then
          if (!result) {
            found = true;
            evt.preventDefault();
          }
        }
      });
    });
  }]);

})(angular);
