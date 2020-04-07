//
// Include files
//
var exec = require('child_process').execSync;
var fs = require('fs');

module.exports = {
  //
  // function lines() reads a text file and returns an array of lines
  //
  lines: function (strFile) {
    var strText = fs.readFileSync(strFile, 'utf8');
    return strText.split('\n');
  },
  existsFile: function (strFile) {
    return fs.existsSync(strFile);
  },
  existsText: function (strFile, strText) {
    if (!fs.existsSync(strFile)) return false;
    if (fs.readFileSync(strFile).toString().indexOf(strText) < 0) return false;
    return true;
  },
  appendFile: function (strFile, strText) {
    fs.appendFileSync(strFile, strText, function (err) {
      if (err) console.log(err);
    }, 'utf-8');
  },
  //
  // TODO: function needs to be tested
  insertFile: function (strFile, strText, strSplit = "") {
    const objBlock = fs.readFileSync(strFile);
    const fd = fs.openSync(strFile, 'w+');
    var index = 0;

    // insert happens somewhere in the middle
    // write the beginning of block 
    var arrBlock = [];
    if (strSplit.length > 0) {
      arrBlock = objBlock.toString().split(strSplit);
      const objBeg = new Buffer(arrBlock[0] + strSplit);
      fs.writeSync(fd, objBeg, 0, objBeg.length, index);
      index += objBeg.length;
    }

    // write the new Text
    const objText = new Buffer(strText);
    fs.writeSync(fd, objText, 0, objText.length, index);
    index += objText.length;

    // write the ending of block
    if (strSplit.length > 0) {
      var strBlock = '';
      for (let a = 1; a < arrBlock.length; a++) {
        strBlock += arrBlock[a];
      }
      const objEnd = new Buffer(strBlock);
      fs.writeSync(fd, objEnd, 0, objEnd.length, index);
      index += objEnd.length;
    }
    fs.closeSync(fd);
  },
  isIPaddr: function (ipaddress) {
    if (
      /^(([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)\.){3}([1-9]?\d|1\d\d|2[0-5][0-5]|2[0-4]\d)$/gm.test(
        ipaddress
      )
    ) {
      return true;
    }
    return false;
  },
  //
  // function hosts() reads a text file and returns an array of hosts (if any)
  //
  hosts: function (strFile) {
    //
    //--- Assert hostfile exists and contains at least one IP address
    //
    var strLines = module.exports.lines(strFile);
    var strIPaddr = [];
    strLines.forEach(function (line) {
      if (module.exports.isIPaddr(line))
        strIPaddr.push(line.replace('\r', '').replace('\n', ''));
    });
    return strIPaddr;
  },
  //
  // function readJson() reads a json file and returns a JSON object
  //
  readJson: function (strFile) {
    return JSON.parse(fs.readFileSync(strFile));
  },
  //
  // replace all backslash to double backslash
  strDoubleBackslash: function (str) {
    return str.split(String.fromCharCode(92)).join(String.fromCharCode(92, 92));
  },
  //
  // replace all forward slash to double backslash
  strForwardDoubleBackslash: function (str) {
    return str.split(String.fromCharCode(47)).join(String.fromCharCode(92, 92));
  },
  cp: function (strSrc, strDst) {
    const strExec = 'cp "' + strSrc + '" "' + strDst + '"';
    const strOutput = exec(strExec).toString();
    return strOutput;
  },
  mv: function (strSrc, strDst) {
    const strExec = 'mv "' + strSrc + '" "' + strDst + '"';
    const strOutput = exec(strExec).toString();
    return strOutput;
  },
  //
  // copies folder from host to remote
  shScp: function (strConfig, strId, strIp, strHostDir, strRmteDir = '') {
    // strHostDir should not contain any slashes
    const strExec =
      'cd .. && scp -F ' +
      strConfig +
      ' -i ' +
      strId +
      ' -r ' +
      strHostDir +
      ' root@' +
      strIp +
      ':/root/' +
      strRmteDir;
    console.log(strExec);
    const strOutput = exec(strExec).toString();
    console.log(strOutput);
  }
};
