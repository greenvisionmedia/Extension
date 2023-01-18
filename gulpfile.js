////PUSHERMAN GULPFILE

var gulp = require('gulp'),
    terser = require('gulp-terser'),
    replace = require('gulp-replace'),
    rename = require('gulp-rename'),
    filter = require('gulp-filter'),
    htmlmin = require('gulp-htmlmin'),
    cssnano = require('gulp-cssnano'),
    vinylPaths = require('vinyl-paths'),
    fs = require('fs'),
    del = require('del');

function markup() {
    return gulp
        .src('./src/*.html')
        .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public'));
}

function styles() {
    return gulp
        .src('./src/*.css')
        .pipe(cssnano())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public'));
}

function scripts() {
    return gulp
        .src('./src/*.js')
        .pipe(
            replace('{{modal.html}}', () => {
                return `${fs.readFileSync('./public/modal.min.html', 'utf8')}`;
            })
        )
        .pipe(terser())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./public'));
}

function static() {
    return gulp.src('./static/*').pipe(gulp.dest('./public'))
}

function clean() {
    return gulp.src('./public/*.html').pipe(vinylPaths(del));
}

gulp.task('default', gulp.series(markup, styles, scripts, static, clean));
