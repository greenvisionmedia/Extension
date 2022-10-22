////PUSHERMAN GULPFILE

const gulp = require('gulp'),
    terser = require('gulp-terser'),
    replace = require('gulp-replace'),
    rename = require('gulp-rename'),
    htmlmin = require('gulp-htmlmin'),
    cssnano = require('gulp-cssnano'),
    classPrefix = require('gulp-class-prefix')
    fs = require('fs');

function markup() {
    return gulp
        .src('./src/*.html')
        .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public'))
}

function styles() {
    return gulp
        .src('./src/*.css')
        //.pipe(classPrefix('gv_'))
        .pipe(cssnano())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public'))
}

function scripts() {
    return gulp
        .src('./src/*.js')
        .pipe(replace('{{modal.html}}', function (s) {
            return `${fs.readFileSync('./public/modal.min.html', 'utf8')}`;
        }))
        //.pipe(terser())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public'));
}

gulp.task('default', gulp.series(markup, styles, scripts));