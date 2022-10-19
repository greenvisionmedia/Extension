////PUSHERMAN GULPFILE

var gulp = require('gulp'),
    terser = require('gulp-terser'),
    replace = require('gulp-replace'),
    postcss = require('gulp-postcss'),
    cssnano = require('cssnano'),
    rename = require('gulp-rename'),
    fs = require('fs')

function markup() {
    return gulp
        .src('./src/b.js')
        .pipe(replace('{{css}}', function(s) {
            var style = fs.readFileSync('./public/b.min.css', 'utf8');
            return '<style>' + style + '</style>';
        }))
        .pipe(terser())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public'));
}
