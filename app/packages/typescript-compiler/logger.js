const util = Npm.require('util');

class Logger_ {
  constructor() {
    this.llevel = process.env.TYPESCRIPT_LOG;
  }

  newProfiler(name) {
    let profiler = new Profiler(name);
    if (this.isProfile) profiler.start();
    return profiler;
  }

  get isDebug() {
    return this.llevel >= 2;
  }

  get isProfile() {
    return this.llevel >= 3;
  }

  get isAssert() {
    return this.llevel >= 4;
  }

  log(msg, ...args) {
    if (this.llevel >= 1) {
      console.log.apply(null, [msg].concat(args));
    }
  }

  debug(msg, ...args) {
    if (this.isDebug) {
      this.log.apply(this, msg, args);
    }
  }

  assert(msg, ...args) {
    if (this.isAssert) {
      this.log.apply(this, msg, args);
    }
  }
};

Logger = new Logger_();

class Profiler {
  constructor(name) {
    this.name = name;
  }

  start() {
    console.log('%s started', this.name);
    console.time(util.format('%s time', this.name));
    this._started = true;
  }

  end() {
    if (this._started) {
      console.timeEnd(util.format('%s time', this.name));
    }
  }
}
