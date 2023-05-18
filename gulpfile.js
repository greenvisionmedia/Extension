var gulp = require('gulp'),
    terser = require('gulp-terser'),
    replace = require('gulp-replace'),
    rename = require('gulp-rename'),
    htmlmin = require('gulp-htmlmin'),
    cssnano = require('gulp-cssnano'),
    vinylPaths = require('vinyl-paths'),
    fs = require('fs'),
    del = require('del');

function markup() {
    return gulp
        .src('./src/*.html')
        .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
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
    return (
        gulp
            .src('./src/*.js')
            // .pipe(
            //     terser({
            //         format: {
            //             quote_style: 1,
            //         },
            //     })
            // )
            .pipe(
                replace('{{menu.html}}', () => {
                    return `${fs.readFileSync('./public/menu.html', 'utf8')}`;
                })
            )
            .pipe(
                replace('{{panel.html}}', () => {
                    return `${fs.readFileSync('./public/panel.html', 'utf8')}`;
                })
            )
            .pipe(
                replace('{{dialog.html}}', () => {
                    return `${fs.readFileSync('./public/dialog.html', 'utf8')}`;
                })
            )
            .pipe(
                replace('{{meter.html}}', () => {
                    return `${fs.readFileSync('./public/meter.html', 'utf8')}`;
                })
            )
            .pipe(rename({ suffix: '.min' }))
            .pipe(gulp.dest('./public'))
    );
}

function static() {
    return gulp.src('./static/**').pipe(gulp.dest('./public'));
}

function clean() {
    return gulp.src('./public/*.html').pipe(vinylPaths(del));
}

gulp.task('default', gulp.series(markup, styles, scripts, static, clean));

/**
 * To-do:
 *  - Replace all the adjacentHTML calls with node creation. This is security
 *    best practice and not doing it could get the extension rejected.
 *    - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Safely_inserting_external_content_into_a_page
 *  - Write code for the carbon budget tool.
 *   - Current thinking is that this should just be mirrored. Meter.html and
 *     Meter.js can live on a website for non-webflow usage.
 *
 */
