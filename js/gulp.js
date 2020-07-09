//
// Include files
//
var gulp = require('gulp');
var gulpRename = require('gulp-rename');
var gulpReplace = require('gulp-replace');
var gulpRegex = require('gulp-regex-replace');
var mapStream = require('map-stream');
var plus = require('./gulp-plus.js');

//
// Global variables
//
var strRootConfig = '../config/';

//
// Step (1):  Read vtt.conf configuration
// Step (2):  Import and clean YouTube subtitle files (*.vtt)
// Step (3):  Export text files (*.txt)
//
gulp.task('vtt', done => {
  //
  //--- Assert SrcPath and DstPath are valid
  //
  let strSrcPath;
  let strDstPath;
  let blnOverwrite;
  console.log('Reading vtt.conf file..');
  const jsnFile = plus.readJson(strRootConfig + 'vtt.conf');
  if (jsnFile.srcpath === undefined) {
    console.log('Error: config srcpath is undefined');
    return done();
  }
  strSrcPath = jsnFile.srcpath;
  if (jsnFile.dstpath === undefined) {
    strDstPath = strSrcPath;
  } else {
    strDstPath = jsnFile.dstpath;
  }
  if (jsnFile.srcfile === undefined) {
    strSrcFile = "*.vtt"
  } else {
    strSrcFile = jsnFile.srcfile;
  }
  if (jsnFile.overwrite === undefined) {
    blnOverwrite = false;
  } else {
    blnOverwrite = jsnFile.overwrite;
  }

  // Step (2):  Import and clean YouTube subtitle files (*.vtt)
  gulp
    .src([strSrcPath + strSrcFile])
    // Clean header
    .pipe(
      gulpRegex({
        regex: '^WEBVTT\nKind: [a-z]*\nLanguage: [a-z]*-*[A-Z]*\n\n*',
        replace: ''
      })
    )
    // Assert header was cleaned
    .pipe(
      gulpReplace('WEBVTT', function (match, p1, offset, string) {
        console.log('Found header in file ' + this.file.relative);
        return 'WEBVTT';
      })
    )
    // Clean time
    .pipe(
      gulpRegex({
        regex: '[0-9:.]+ --> [0-9:.]*[ a-z:0-9%]*\n',
        replace: ''
      })
    )
    // Assert time was cleaned
    .pipe(
      gulpReplace('-->', function (match, p1, offset, string) {
        console.log('Found time in file ' + this.file.relative);
        return '-->';
      })
    )
    // Clean html tags
    .pipe(
      gulpRegex({
        regex: '<[0-9:.]*>',
        replace: ''
      })
    )
    .pipe(gulpReplace(/-*<\/*/g, '<'))
    .pipe(
      gulpReplace('<c>', function (match, p1, offset, string) {
        return '';
      })
    )
    .pipe(
      gulpReplace('[Music]', function (match, p1, offset, string) {
        return '';
      })
    )
    .pipe(
      gulpReplace('<', function (match, p1, offset, string) {
        console.log('Found tags in file ' + this.file.relative);
        return '<';
      })
    )
    // clean line breaks
    .pipe(
      gulpRegex({
        regex: '(?:[\t ]*(?:\r?\n|\r))+',
        replace: ' '
      })
    )

    // Clean duplicate phrases
    .pipe(gulpReplace(/(\W|^)(.+)\s\2/gi, '$1'))

    // clean line breaks
    .pipe(
      gulpRegex({
        regex: '(?:[\t ]*(?:\r?\n|\r))+',
        replace: ' '
      })
    )

    // Step (3):  Export text files (*.txt)
    .pipe(
      gulpRename(function (path) {
        path.extname = '.txt';
        console.log('Export file ' + path.basename + path.extname);
      })
    )
    .pipe(gulp.dest(strDstPath, { overwrite: blnOverwrite }));
  done();
});


//
// Step (1):  Read txt.conf configuration
// Step (2):  Import and read URL (*.json)
// Step (3):  Append to docs/index.md
// Step (4):  Move text files (*.txt)
// Step (5):  Append to docs/index.md
//
gulp.task('txt', done => {
  //
  //--- Assert SrcPath and DstPath are valid
  //    Assert TxtPath and TxtFile are valid
  //    Assert file exists
  let strJsnPath;
  let strSrcPath;
  let strDstPath;
  let strTxtPath;
  let strTxtFile;
  let blnOverwrite;
  console.log('Reading txt.conf file..');
  var jsnFile = plus.readJson(strRootConfig + 'txt.conf');
  if (jsnFile.jsnpath === undefined) {
    console.log('Error: config jsnpath is undefined');
    return done();
  } else strJsnPath = jsnFile.jsnpath;
  if (jsnFile.jsnfile === undefined) {
    strJsnFile = "*.json"
  } else strJsnFile = jsnFile.jsnfile;
  if (jsnFile.srcpath === undefined) {
    console.log('Error: config srcpath is undefined');
    return done();
  } else strSrcPath = jsnFile.srcpath;
  if (jsnFile.dstpath === undefined) {
    // default dstPath = srcPath
    strDstPath = strSrcPath;
  } else {
    strDstPath = jsnFile.dstpath;
  }
  if (jsnFile.overwrite === undefined) {
    // default overwrite = false
    blnOverwrite = false;
  } else {
    blnOverwrite = jsnFile.overwrite;
  }
  if (jsnFile.txtpath === undefined) {
    console.log('Error: config txtpath is undefined');
    return done();
  } else strTxtPath = jsnFile.txtpath;
  if (jsnFile.txtfile === undefined) {
    // default txtfile = "index.md"
    strTxtFile = "index.md";
  } else {
    strTxtFile = jsnFile.txtfile;
  }
  if (!plus.existsFile(strTxtPath + strTxtFile)) {
    console.log('Error: ' + strTxtPath + strTxtFile + ' does not exists');
    return done();
  }

  //
  // Step (2): Import and read URL (*.json)
  gulp
    .src([strJsnPath + '2020*.json'])
    // parse JSON
    .pipe(
      mapStream(function (file, done) {
        const json = JSON.parse(file.contents.toString());
        //
        // Id Required - https://youtu.be/<id>
        const strYoutubeUrl = "https://youtu.be/" + json.id;
        if (json.id === undefined) {
          console.log('Error: id is undefined - ' + file.basename);
          return done();
        }
        //
        // Title Required
        const strTitle = json.title;
        if (json.title === undefined) {
          console.log('Error: title is undefined - ' + file.basename);
          return done();
        }
        //
        // Url Required - https://dennislwm.github.io/docker-youtube-dl/homily/<file.txt>
        // Alternatively, can use path.parse(file).name
        var strDstTitle = strTitle.replace(/[^0-9a-zA-Z]/g, '');
        const strDstFile = json.upload_date + strDstTitle + ".en.txt";
        const strTextUrl = "https://dennislwm.github.io/docker-youtube-dl/homily/" + strDstFile;

        //
        // Date Optional - Format: <yyyymmdd>
        const strUploadDate = json.upload_date;

        //
        // Step (3):  Append to docs/index.md
        //            Assert non-duplicate title
        if (plus.existsText(strTxtPath + strTxtFile, json.id)) {
          console.log('Warning: ' + strYoutubeUrl + ' duplicate skipped');
        } else {
          //
          // Step (4):  Move text files (*.txt)
          //            Assert src file exists
          //            Assert dst file exists
          const strSrcFile = file.basename.replace('.info.json', '.en.txt');
          if (!plus.existsFile(strSrcPath + strSrcFile)) {
            console.log('Warning: ' + strYoutubeUrl + ' NO transcript skipped');
          } else {
            console.log(plus.mv(strSrcPath + strSrcFile, strDstPath + strDstFile));
            if (!plus.existsFile(strDstPath + strDstFile)) {
              console.log('Error: Moved ' + strDstPath + strDstFile + ' failed');
            } else {
              //
              // Step (5):  Append to docs/index.md
              //            Prepare text
              console.log(plus.cp(strTxtPath + 'index.md', strTxtPath + 'index.md.bak'));
              strAppend = '| ' + strTitle
                + ' | ' + strUploadDate
                + ' | [YouTube](' + strYoutubeUrl + ')'
                + ' | [Transcript](' + strTextUrl + ')'
                + ' |\r\n'
              plus.appendFile(strTxtPath + strTxtFile, strAppend)
              console.log('Processed: ' + strTitle);
            }
          }
        }
        done(null, file);
      })
    )
  done();
});