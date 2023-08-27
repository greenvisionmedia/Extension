import gulp from 'gulp';
import terser from 'gulp-terser';
import replace from 'gulp-replace';
import rename from 'gulp-rename';
import htmlmin from 'gulp-htmlmin';
import cssnano from 'gulp-cssnano';
import clean from 'gulp-clean';
import fs from 'fs';

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
                replace('{{clipboard.html}}', () => {
                    return `${fs.readFileSync(
                        './public/clipboard.html',
                        'utf8',
                    )}`;
                }),
            )
            .pipe(
                replace('{{meter.html}}', () => {
                    return `${fs.readFileSync('./public/meter.html', 'utf8')}`;
                }),
            )
            .pipe(rename({ suffix: '.min' }))
            .pipe(gulp.dest('./public'))
    );
}

function port() {
    return gulp.src('./static/**').pipe(gulp.dest('./public'));
}

function scrub() {
    return gulp.src('./public/*.html').pipe(clean());
}

// Copy the public folder into the filesystem

function move() {
    return gulp
        .src('./public/**/*')
        .pipe(
            gulp.dest(
                '/mnt/c/users/taj/Desktop/Areas/Chrome Extension/public-clipboard',
            ),
        );
}

gulp.task('default', gulp.series(markup, styles, scripts, port, scrub, move));

/**
 * To-do:
 *  - Replace all the adjacentHTML calls with node creation. This is security
 *    best practice and not doing it could get the extension rejected.
 *    - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Safely_inserting_external_content_into_a_page
 *  - Write code for the carbon budget tool.
 *   - Current thinking is that this should just be mirrored. Meter.html and
 *     Meter.js can live on a website for non-webflow usage.
 */
