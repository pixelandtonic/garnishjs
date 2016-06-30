var version = '0.1';

var gulp = require('gulp'),
	concat = require('gulp-concat'),
	insert = require('gulp-insert'),
	uglify = require('gulp-uglify'),
	watch = require('gulp-watch'),
	sourcemaps = require('gulp-sourcemaps'),
	notify = require('gulp-notify'),
	plumber = require('gulp-plumber');

var srcDir = './src/';
var outDir = './dist/';

var jsHeader = "/**\n" +
	" * Garnish UI toolkit\n" +
	" *\n" +
	" * @copyright 2013 Pixel & Tonic, Inc.. All rights reserved.\n" +
	" * @author    Brandon Kelly <brandon@pixelandtonic.com>\n" +
	" * @version   " + version + "\n" +
	" * @license   THIS IS NO F.O.S.S!\n" +
	" */\n" +
	"(function($){\n" +
	"\n";

var jsFooter = "\n" +
    "})(jQuery);\n";

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

gulp.task('build', buildTask);
gulp.task('watch', watchTask);

gulp.task('default', ['build']);

function buildTask()
{
	return gulp.src([
			srcDir+'*.js',
			srcDir+'classes/*.js',
		])
		.pipe(plumber({ errorHandler: plumberErrorHandler }))
		.pipe(sourcemaps.init())
		.pipe(concat('garnish-'+version+'.js'))
		.pipe(insert.prepend(jsHeader))
		.pipe(insert.append(jsFooter))
		.pipe(gulp.dest(outDir))
		.pipe(uglify())
		.pipe(concat('garnish-'+version+'.min.js'))
		.pipe(sourcemaps.write('../'+outDir))
		.pipe(gulp.dest(outDir));

}

function watchTask()
{
	return gulp.watch(srcDir+'**', ['build']);
}