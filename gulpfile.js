var version = '0.1';

var gulp = require('gulp'),
	concat = require('gulp-concat'),
	insert = require('gulp-insert'),
	uglify = require('gulp-uglify');
	watch = require('gulp-watch');

var srcDir = './src/';
var outDir = './dist/';

var header = "/**\n" +
	" * Garnish UI toolkit\n" +
	" *\n" +
	" * @copyright 2013 Pixel & Tonic, Inc.. All rights reserved.\n" +
	" * @author    Brandon Kelly <brandon@pixelandtonic.com>\n" +
	" * @version   " + version + "\n" +
	" * @license   THIS IS NO F.O.S.S!\n" +
	" */\n" +
	"(function($){\n" +
	"\n";

var footer = "\n" +
    "})(jQuery);\n";

gulp.task('build', buildTask);
gulp.task('watch', watchTask);

gulp.task('default', ['build', 'watch']);

function buildTask()
{
	return gulp.src([
			srcDir+'*.js',
			srcDir+'classes/*.js',
		])
		.pipe(concat('garnish-'+version+'.js'))
		.pipe(insert.prepend(header))
		.pipe(insert.append(footer))
		.pipe(gulp.dest(outDir))
		.pipe(uglify())
		.pipe(concat('garnish-'+version+'.min.js'))
		.pipe(gulp.dest(outDir));

}

function watchTask() {
	return gulp.watch(srcDir+'**', ['build']);
}