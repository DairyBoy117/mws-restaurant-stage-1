const gulp = require('gulp');
const webp = require('gulp-webp');
var concat = require('gulp-concat');

gulp.task('css', function () {
    gulp.src('css/*.css')
    .pipe(concat('main-styles.css'))
    .pipe(gulp.dest('./css/'));
    });


gulp.task('default', ['css'], () =>
    gulp.src('img/*.jpg')
        .pipe(webp())
        .pipe(gulp.dest('dist'))
);