var gulp = require('gulp')
var rm = require('gulp-rimraf')
var gih = require("gulp-include-html")
var del = require("del")

gulp.task('extend', function () {
    gulp.src('../**/*.html')
        .pipe(gih({} , /(\/bin\/|\/templates\/)/g)) // default options 
        .pipe(gulp.dest('../deploy'))
 
})

gulp.task('clean', function (cb) {
    del.sync(['../deploy/**'],{"force": true}, cb)
})
 
gulp.task('default', ['clean', 'extend'])