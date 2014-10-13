// Karma configuration
// Generated on Mon Oct 13 2014 07:45:50 GMT+1300 (NZDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [

        'assets/js/libs/jquery.min-2.1.0.js',

        'assets/js/libs/angular.min-1.2.16.js',
        'assets/js/libs/angular-route.min-1.2.16.js',
        'assets/js/libs/angular-mocks.js',
        'assets/js/libs/angular-translate.min.js',
        'assets/js/libs/angular-translate-loader-static-files.min.js',
      'assets/js/libs/*.js',
      'assets/js/**/*.js',
      'test/frontend/*.js'
    ],


    // list of files to exclude
    exclude: [
        'assets/js/libs/vmap/*.js',
        'assets/js/libs/jquery-jvectormap-map.js',
        'assets/js/libs/jquery-jvectormap-world-mill-en.js',
        'assets/js/libs/vmap/proj.js',
        'assets/js/libs/angular-scenario-1.2.26.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots'],


    // web server port
    port: 9876,
      //runnerPort : 8081,

      urlRoot : '/_karma_/',
    proxies : {
        '/': 'http://localhost:5000/'
    },

    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Firefox'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
