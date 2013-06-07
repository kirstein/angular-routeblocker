module.exports = function( grunt ) {
  'use strict';

  var SRC = 'src';

  grunt.initConfig({
    uglify : {
      production : {
        src: [ SRC + '/**/*.js' ],
        dest: 'angular-whenever.min.js'
      }
    },

    copy : {
      production : {
        files : [
          { src: SRC + '/main.js', dest : 'angular-whenever.js' }
        ]
      }
    },

    karma : {
      spec: {
        configFile : 'karma.conf.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-karma');

  grunt.registerTask('test', [ 'karma' ]);
  grunt.registerTask('build', [ 'test', 'copy', 'uglify' ]);
};
