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
                replace('{{menu.html}}', () => {
                    return `${fs.readFileSync('./public/menu.html', 'utf8')}`;
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

// Copy the public folder into the windows filesystem
function move() {
    return gulp
        .src('./public/**/*')
        .pipe(
            gulp.dest(
                '/mnt/c/users/taj/desktop/projects/(GV) Chrome Extension/public/',
            ),
        );
}

gulp.task('default', gulp.series(markup, styles, scripts, port, scrub, move));
