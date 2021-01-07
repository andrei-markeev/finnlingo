var util = require("util");

function Logger() {
  this.prefix = "[meteor-typescript]: ";
  this.llevel = process.env.TYPESCRIPT_LOG;
}

var LP = Logger.prototype;

LP.debug = function(format, ...args) {
  if (this.isDebug()) {
    var msg = args.length ? util.format(format, ...args) : format;
    console.log(this.prefix + msg);
  }
};

LP.assert = function(format, ...args) {
  if (this.isAssert()) {
    var msg = args.length ? util.format(format, ...args) : format;
    console.log(this.prefix + msg);
  }
};

LP.isDebug = function() {
  return this.llevel >= 2;
};

LP.isProfile = function() {
  return this.llevel >= 3;
};

LP.isAssert = function() {
  return this.llevel >= 4;
};

LP.newProfiler = function(name) {
  var fullName = util.format("%s%s", this.prefix, name);
  var profiler = new Profiler(fullName);
  if (this.isProfile()) profiler.start();
  return profiler;
};


function Profiler(name) {
  this.name = name;
}

var PP = Profiler.prototype;

PP.start = function() {
  console.log("%s started", this.name);
  console.time(util.format("%s time", this.name));
  this._started = true;
};

PP.end = function() {
  if (this._started) {
    console.timeEnd(util.format("%s time", this.name));
  }
};

export default new Logger();
