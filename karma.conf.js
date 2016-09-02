module.exports = function(config) {
  config.set({

    browsers: ['Chrome', 'Firefox'],
    frameworks: ['browserify', 'jasmine'],
    reporters: ['progress', 'kjhtml'],

    preprocessors: {
      'dist/*.js': ['browserify']
    },

    files: [
      'https://ajax.googleapis.com/ajax/libs/jquery/2.2.1/jquery.min.js',
      'bower_components/velocity/velocity.js',
      'dist/garnish.js',
      'test/**/*.js'
    ],

    browserify: {
      debug: true
    },
  })
}
