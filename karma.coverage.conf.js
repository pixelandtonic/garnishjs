module.exports = function(config) {
  config.set({

    browsers: ['Firefox'],
    frameworks: ['browserify', 'jasmine'],
    preprocessors: {
      'dist/garnish-0.1.js': ['browserify']
    },

    files: [
      'https://ajax.googleapis.com/ajax/libs/jquery/2.2.1/jquery.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/velocity/1.2.3/velocity.js',
      'dist/garnish-0.1.js',
      'test/**/*.js'
    ],

    browserify: {
      debug: true,
      transform: [['browserify-istanbul', {
        instrumenterConfig: {
          embed: true
        }
      }]]
    },

    reporters: ['progress', 'coverage'],

    coverageReporter: {
      dir: 'coverage/',
      reporters: [
        { type: 'html', subdir: 'report-html' },
        { type: 'lcovonly', subdir: '.', file: 'lcov.info' }
      ]
    }
  })
}
