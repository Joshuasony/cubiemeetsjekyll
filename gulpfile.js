// Requirements
// ------------------------

var gulp = require('gulp'),

  runSequence = require('run-sequence'),
  cp    = require('child_process'),
  gutil = require( 'gulp-util' ),

  // Utils
  rename = require('gulp-rename'),
  header = require('gulp-header'),
  inject = require('gulp-inject'),
  concat = require('gulp-concat'),
  checkPages = require("check-pages"),

  // Template
  minifyHTML = require('gulp-minify-html'),
  wiredep    = require('wiredep').stream,
  svgstore   = require('gulp-svgstore'),

  // Images
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),

  // Scripts
  jshint = require('gulp-jshint'),
  stylish = require('jshint-stylish'),
  uglify = require('gulp-uglify'),

  // Styles
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  sourcemaps = require('gulp-sourcemaps'),
  minifyCSS = require('gulp-minify-css'),

  // Server
  browserSync = require('browser-sync'),

  // SEO
  sitemap = require('gulp-sitemap'),

  // Deployment
  env = require('gulp-env'),
  ftp = require('vinyl-ftp'),
  replace = require('gulp-replace');

// Settings
var banner = [
  '/*!\n' +
  ' * @version <%= package.version %>\n' +
  ' * Copyright ' + new Date().getFullYear() + '. <%= package.license %> licensed.\n' +
  ' */',
  '\n'
].join('');

var src = './src/',
  dist = './dist/',
  temp = './temp/',
  package = require('./package.json'),
  reload = browserSync.reload;


// Gulp Tasks
// ------------------------

// Build the Jekyll Site
gulp.task('jekyll', function(done) {
  browserSync.notify('Compiling Jekyll');

  return cp.spawn('bundle', ['exec', 'jekyll', 'build', '-q', '--source=' + 'src/jekyll', '--destination=' + 'dist'], { stdio: 'inherit' })
  .on('exit', done);
});


gulp.task('jekyll-rebuild', ['jekyll'], function() {
  browserSync.reload();
});

// COPY
// Copy extra files like .htaccess, robots.txt
gulp.task('copy', function () {
  return gulp.src(['./.htaccess', './robots.txt'])
    .pipe(gulp.dest(dist));
});

// TEMPLATE
// Bower css and scripts inject +  SVG Sprite inject
gulp.task('template', function () {

  var svgs = gulp
    .src(src + 'assets/icons/*.svg')
    .pipe(svgstore({ inlineSvg: true }));

  function fileContents (filePath, file) {
    return file.contents.toString();
  }

  return gulp.src(dist + '*.html')
    .pipe(wiredep({
      includeSelf: true
    }))
    .pipe(inject(svgs, { transform: fileContents }))
    .pipe(minifyHTML({
      conditionals: true,
      spare: true
    }))
    .pipe(gulp.dest(dist));
});

gulp.task('template-watch', ['template'], reload);

gulp.task('fonts', function() { 
    return gulp.src('/assets/fonts/**.*') 
        .pipe(gulp.dest(dist)); 
});

// IMAGES
// Optimization
gulp.task('images', function () {
  return gulp.src(src + 'assets/**/*')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [
        { removeViewBox: false }
      , { cleanupIDs: false }
      ],
      use: [pngquant()]
    }))
    .pipe(gulp.dest(dist + 'assets/'))
    .pipe(reload({
      stream: true
    }));
});

// SCRIPTS
// JSHint, Uglify
gulp.task('scripts', function () {
  return gulp.src([src + 'scripts/*.js'])
    .pipe(concat('main.min.js'))
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(uglify())
    .pipe(gulp.dest(dist + 'scripts'))
    .pipe(reload({
      stream: true
    }));
});

// Bower components main scripts files
gulp.task('vendors', function() {
  var vendorsJS = require('wiredep')().js;
  return gulp.src(vendorsJS)
    .pipe(concat('vendors.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest(dist+'scripts'));
});

// STYLES
// LibSass, Minified
gulp.task('styles', function () {
  return gulp.src(src + 'styles/{,*/}*.{scss,sass,css}')
    .pipe(sourcemaps.init())
    .pipe(wiredep())
    .pipe(sass({
      errLogToConsole: true
    }))
    .pipe(autoprefixer({
      browsers: ['last 2 versions', '> 1% in CH'],
      cascade: false
    }))
    .pipe(minifyCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(header(banner, {
      package: package
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(dist + 'styles'))
    .pipe(reload({
      stream: true
    }));
});

// SEO
// Generate a Sitemap
gulp.task('sitemap', function () {
  return gulp.src(dist+'/*.html')
    .pipe(sitemap({
      siteUrl: 'https://www.mysite.ch/'
    }))
    .pipe(gulp.dest(dist));
});

// LINK CHECKER
// Check Dev
gulp.task("checkDev", [ "serve" ], function(callback) {
  var options = {
    pageUrls: [
      'http://localhost:3000'
      // Add your pages here
    ],
    checkLinks: true,
    linksToIgnore: [
      //'http://localhost:8080/broken.html'
    ],
    noEmptyFragments: true,
    noLocalLinks: true,
    noRedirects: true,
    //onlySameDomain: true,
    //preferSecure: true,
    queryHashes: true,
    checkCaching: true,
    checkCompression: true,
    checkXhtml: true,
    summary: true,
    terse: true,
    maxResponseTime: 200,
    userAgent: 'custom-user-agent/1.2.3'
  };
  checkPages(console, options, callback);
});

// Check Prod
gulp.task("checkProd", function(callback) {
  var options = {
    pageUrls: [
      'http://lezzgo.ch'
      // Add your pages here
    ],
    checkLinks: true,
    summary: true,
    maxResponseTime: 500
  };
  checkPages(console, options, callback);
});

// DEPLOY

gulp.task('convertAgb', function() {
    gulp.src('src/jekyll/_includes/agb.md')
        .pipe(pandocWriter({
            outputDir: dist + "agb/",
            inputFileType:'.md',
            outputFileType: '.docx',
            args: [
                '--smart'
            ]
        }))
        .pipe(gulp.dest(dist));
});

gulp.task('upload', function(){
  env({file: 'config.sftp.json'});

  var conn = ftp.create( {
          host:     process.env.SFTPHOST,
          user:     process.env.SFTPUSER,
          password: process.env.SFTPPWD,
          parallel: 10,
          secure: true,
          secureOptions: true,
          log:      gutil.log
      } );

  return gulp.src(dist + "**/*", {base: 'dist/', buffer: false})
    .pipe( conn.newer('.'))
    .pipe( conn.dest('.'));

});

gulp.task('tempUpload', function(){
  env({file: 'config.sftp.json'});

  var conn = ftp.create( {
          host:     process.env.SFTPHOST,
          user:     process.env.SFTPUSER,
          password: process.env.SFTPPWD,
          parallel: 10,
          secure: true,
          secureOptions: true,
          log:      gutil.log
      } );

  return gulp.src(dist + "**/*", {base: 'dist/', buffer: false})
    .pipe( conn.newer('/temp'))
    .pipe( conn.dest('/temp'));

});

// BUILD

gulp.task('build',function(callback) {
  runSequence('jekyll',['copy', 'vendors', 'template', 'images', 'fonts', 'scripts', 'styles', 'convertAgb'],
callback);
});

gulp.task('fast-build',function(callback) { // without images
  runSequence('jekyll',['copy', 'vendors', 'template', 'scripts', 'styles'],
callback);
});

gulp.task('deploy',function(callback) {
  runSequence('build',['upload'],
callback);
});

// replaces path so it will work in subdirectory temp
gulp.task('tempify', function(){
  gulp.src([dist + "**/*.{html,css}"])
    .pipe(replace("href=/", "href=/temp/"))
    .pipe(replace("href=\"/", "href=\"/temp/"))
    .pipe(replace("src=/", "src=/temp/"))
    .pipe(replace("src=\"", "src=\"/temp"))
    .pipe(replace("url(/", "url(/temp/"))
    .pipe(gulp.dest(dist));
});

// SERVER
// Browser Sync (wait build task to be done)
gulp.task('serve', ['build'], function () {
  browserSync({
    notify: false,
    server: {
      baseDir: dist,
      routes: {
        "/bower_components": "bower_components"
      }
    }
  });
  gulp.watch(src + '**/*.{html,json,svg}', ['template-watch']);
  gulp.watch(src + 'scripts/*.js', ['scripts']);
  gulp.watch(src + 'assets/images/**/*', ['images']);
  gulp.watch(src + 'styles/**/*.{scss,sass,css}', ['styles']);
  gulp.watch(src + 'assets/fonts/*', ['fonts']);
  gulp.watch(src + 'jekyll/**/*', ['build']);
});

// Gulp Default Task
// ------------------------
// Having watch within the task ensures that 'sass' has already ran before watching
gulp.task('default', ['build', 'sitemap', 'serve']);
