var gulp = require('gulp');
var insert = require('gulp-insert');
var replace = require('gulp-replace');

var fs = require('fs');

var paths = {
  backfire: './backbonefire/src/backbonefire.js',
  header: './header.txt',
  footer: './footer.txt',
  dist: './dist'
};

gulp.task('build', function() {
  var headerText = getHeader();
  var footerText = getFooter();

  return gulp.src(paths.backfire)
    .pipe(replace('(function(_, Backbone) {', ''))
    .pipe(replace('})(window._, window.Backbone);', ''))
    .pipe(replace('Backbone.Firebase', 'BackboneFirebase'))
    .pipe(insert.wrap(headerText, footerText))
    .pipe(gulp.dest(paths.dist));

});

function getHeader() {
  return fs.readFileSync(paths.header);
}

function getFooter() {
  return fs.readFileSync(paths.footer);
}