var gulp = require('gulp'),
	concat = require('gulp-concat'),
	insert = require('gulp-insert'),
	uglify = require('gulp-uglify'),
	watch = require('gulp-watch'),
	sourcemaps = require('gulp-sourcemaps'),
	notify = require('gulp-notify'),
	plumber = require('gulp-plumber'),
	util = require('gulp-util'),
	yargs = require('yargs'),
	bower = require('gulp-bower'),
	docco = require("gulp-docco");

var Server = require('karma').Server;

var srcDir = './src/';
var testDir = './test/';
var defaultDest = './dist/';
var docsDest = './docs/';

var defaultVersion = '0.1';

var buildGlob = [
	srcDir+'*.js',
	srcDir+'classes/*.js',
	srcDir+'libs/*.js'
];

var libsGlob = [
	'bower_components/jquery-touch-events/src/jquery.mobile-events.js'
];

//error notification settings for plumber
var plumberErrorHandler = function(err) {

	notify.onError({
		title: "Garnish",
		message:  "Error: <%= error.message %>",
		sound:    "Beep"
	})(err);

	console.log( 'plumber error!' );

	this.emit('end');
};

gulp.task('build', ['buildLibs'], buildTask);
gulp.task('buildLibs', ['bower'], buildLibsTask);
gulp.task('watch', watchTask);
gulp.task('coverage', coverageTask);
gulp.task('test', ['unittest']);
gulp.task('unittest', unittestTask);

gulp.task('default', ['build', 'watch']);

gulp.task('bower', bowerTask);
gulp.task('docs', docsTask);

function buildLibsTask(cb)
{
	return gulp.src(libsGlob)
		.pipe(gulp.dest(srcDir + 'libs/'));

}

function buildTask()
{
	// Allow overriding the dest directory
	// > gulp build --dest /path/to/dest
	// > gulp build -d /path/to/dest
	var dest = yargs.argv.dest || yargs.argv.d || defaultDest;

	// Allow overriding the version
	// > gulp build --version 1.0.0
	// > gulp build -v 1.0.0
	var version = yargs.argv.version || yargs.argv.v || defaultVersion;

	var jsHeader = "/**\n" +
		" * Garnish UI toolkit\n" +
		" *\n" +
		" * @copyright 2013 Pixel & Tonic, Inc.. All rights reserved.\n" +
		" * @author    Brandon Kelly <brandon@pixelandtonic.com>\n" +
		" * @version   " + version + "\n" +
		" * @license   MIT\n" +
		" */\n" +
		"(function($){\n" +
		"\n";

	var jsFooter = "\n" +
	    "})(jQuery);\n";

	return gulp.src(buildGlob, { base: dest })
		.pipe(plumber({ errorHandler: plumberErrorHandler }))
		.pipe(sourcemaps.init())
		.pipe(concat('garnish.js'))
		.pipe(insert.prepend(jsHeader))
		.pipe(insert.append(jsFooter))
		.pipe(gulp.dest(dest))
		.pipe(uglify())
		.pipe(concat('garnish.min.js'))
		.pipe(sourcemaps.write('.', {
			mapFile: function(mapFilePath) {
				// source map files are named *.map instead of *.js.map
				return mapFilePath.replace('.js.map', '.map');
			}
		}))
		.pipe(gulp.dest(dest));
}

function watchTask()
{
	if (util.env.test) {
		return gulp.watch([srcDir+'**', testDir+'**'], ['build', 'unittest']);
	}

	return gulp.watch(srcDir+'**', ['build']);
}

function coverageTask(done)
{
	new Server({
		configFile: __dirname + '/karma.coverage.conf.js',
		singleRun: true
	}, done).start();
}

function unittestTask(done)
{
	new Server({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, done).start();
}

function bowerTask()
{
	gulp.task('bower', function() {
		return bower();
	});
}

function docsTask()
{
	var dest = yargs.argv.dest || yargs.argv.d || docsDest;

	gulp.src([srcDir+'*.js', srcDir+'classes/*.js'])
		.pipe(docco())
		.pipe(gulp.dest(dest))
}