/************************************************************************************************************
 * registry.js - contains a wrapper for the REG command under Windows, which provides access to the registry
 *
 *  author:   Paul Bottin a/k/a FrEsC
 *
 */

/* imports */
var util          = require('util')
,   path          = require('path')
,   spawn         = require('child_process').spawn

/* set to console.log for debugging */
,   log           = function () {}

/* registry hive ids */
,   HKLM          = 'HKLM'
,   HKCU          = 'HKCU'
,   HKCR          = 'HKCR'
,   HKU           = 'HKU'
,   HKCC          = 'HKCC'
,   HIVES         = [ HKLM, HKCU, HKCR, HKU, HKCC ]

/* registry value type ids */
,   REG_SZ        = 'REG_SZ'
,   REG_MULTI_SZ  = 'REG_MULTI_SZ'
,   REG_EXPAND_SZ = 'REG_EXPAND_SZ'
,   REG_DWORD     = 'REG_DWORD'
,   REG_QWORD     = 'REG_QWORD'
,   REG_BINARY    = 'REG_BINARY'
,   REG_NONE      = 'REG_NONE'
,   REG_TYPES     = [ REG_SZ, REG_MULTI_SZ, REG_EXPAND_SZ, REG_DWORD, REG_QWORD, REG_BINARY, REG_NONE ]

/* general key pattern */
,   KEY_PATTERN   = /(\\[a-zA-Z0-9_\s]+)*/

/* key path pattern (as returned by REG-cli) */
,   PATH_PATTERN  = /^(HKEY_LOCAL_MACHINE|HKEY_CURRENT_USER|HKEY_CLASSES_ROOT|HKEY_USERS|HKEY_CURRENT_CONFIG)(.*)$/

/* registry item pattern */
,   ITEM_PATTERN  = /^(.*)\s(REG_SZ|REG_MULTI_SZ|REG_EXPAND_SZ|REG_DWORD|REG_QWORD|REG_BINARY|REG_NONE)\s+([^\s].*)$/


/* Captures stdout/stderr for a child process */
function captureOutput(child) {
  // Use a mutable data structure so we can append as we get new data and have
  // the calling context see the new data
  var output = {'stdout': '', 'stderr': ''};

  child.stdout.on('data', function(data) { output["stdout"] += data.toString(); });
  child.stderr.on('data', function(data) { output["stderr"] += data.toString(); });

  return output;
}


/* Returns an error message containing the stdout/stderr of the child process */
function mkErrorMsg(registryCommand, code, output) {
    var stdout = output['stdout'].trim();
    var stderr = output['stderr'].trim();

    var msg = util.format("%s command exited with code %d:\n%s\n%s", registryCommand, code, stdout, stderr);
    return new Error(msg);
}


/* Converts x86/x64 to 32/64 */
function convertArchString(archString) {
  if (archString == 'x64') {
    return '64';
  } else if (archString == 'x86') {
    return '32';
  } else {
    throw new Error('illegal architecture: ' + archString + ' (use x86 or x64)');
  }
}


/* Adds correct architecture to reg args */
function pushArch(args, arch) {
  if (arch) {
    args.push('/reg:' + convertArchString(arch));
  }
}


/**
 * a single registry value record
 */
function RegistryItem (host, hive, key, name, type, value, arch) {

  if (!(this instanceof RegistryItem))
    return new RegistryItem(host, hive, key, name, type, value, arch);

  /* private members */
  var _host = host    // hostname
  ,   _hive = hive    // registry hive
  ,   _key = key      // registry key
  ,   _name = name    // property name
  ,   _type = type    // property type
  ,   _value = value  // property value
  ,   _arch = arch    // hive architecture

  /* getters/setters */
  this.__defineGetter__('host', function () { return _host; });
  this.__defineGetter__('hive', function () { return _hive; });
  this.__defineGetter__('key', function () { return _key; });
  this.__defineGetter__('name', function () { return _name; });
  this.__defineGetter__('type', function () { return _type; });
  this.__defineGetter__('value', function () { return _value; });
  this.__defineGetter__('arch', function () { return _arch; });

  Object.freeze(this);
}

util.inherits(RegistryItem, Object);

/* lock RegistryItem class */
Object.freeze(RegistryItem);
Object.freeze(RegistryItem.prototype);

/**
 * Get the path to system's reg.exe. Useful when another reg.exe is added to the PATH
 * Implemented only for Windows
 */
function getRegExePath() {
    if (process.platform === 'win32') {
        return path.join(process.env.windir, 'system32', 'reg.exe');
    } else {
        return "REG";
    }
}

/**
 * a registry object, which provides access to a single Registry key
 */
function Registry (options) {

  if (!(this instanceof Registry))
    return new Registry(options);

  /* private members */
  var _options = options || {}
  ,   _host = '' + (_options.host || '')    // hostname
  ,   _hive = '' + (_options.hive || HKLM)  // registry hive
  ,   _key  = '' + (_options.key  || '')    // registry key
  ,   _arch = _options.arch || null         // hive architecture

  /* getters/setters */
  this.__defineGetter__('host', function () { return _host; });
  this.__defineGetter__('hive', function () { return _hive; });
  this.__defineGetter__('key', function () { return _key; });
  this.__defineGetter__('path', function () { return (_host.length == 0 ? '' : '\\\\' + host + '\\') + _hive + _key; });
  this.__defineGetter__('arch', function () { return _arch; })
  this.__defineGetter__('parent', function () {
    var i = _key.lastIndexOf('\\')
    return new Registry({
      host: this.host,
      hive: this.hive,
      key:  (i == -1)?'':_key.substring(0, i),
      arch: this.arch
    });
  });

  // validate options...
  if (HIVES.indexOf(_hive) == -1)
    throw new Error('illegal hive specified.');

  if (!KEY_PATTERN.test(_key))
    throw new Error('illegal key specified.');

  if (_arch && _arch != 'x64' && _arch != 'x86')
    throw new Error('illegal architecture specified (use x86 or x64)');

  Object.freeze(this);
}

util.inherits(Registry, Object);

/**
 * registry hive key LOCAL_MACHINE
 */
Registry.HKLM = HKLM;

/**
 * registry hive key CURRENT_USER
 */
Registry.HKCU = HKCU;

/**
 * registry hive key CLASSES_ROOT
 */
Registry.HKCR = HKCR;

/**
 * registry hive key USERS
 */
Registry.HKU = HKU;

/**
 * registry hive key CURRENT_CONFIG
 */
Registry.HKCC = HKCC;

/**
 * collection of available registry hive keys
 */
Registry.HIVES = HIVES;

/**
 * registry value type STRING
 */
Registry.REG_SZ = REG_SZ;

/**
 * registry value type MULTILINE_STRING
 */
Registry.REG_MULTI_SZ = REG_MULTI_SZ;

/**
 * registry value type EXPANDABLE_STRING
 */
Registry.REG_EXPAND_SZ = REG_EXPAND_SZ;

/**
 * registry value type DOUBLE_WORD
 */
Registry.REG_DWORD = REG_DWORD;

/**
 * registry value type QUAD_WORD
 */
Registry.REG_QWORD = REG_QWORD;

/**
 * registry value type BINARY
 */
Registry.REG_BINARY = REG_BINARY;

/**
 * registry value type UNKNOWN
 */
Registry.REG_NONE = REG_NONE;

/**
 * collection of available registry value types
 */
Registry.REG_TYPES = REG_TYPES;

/**
 * retrieve all values from this registry key
 */
Registry.prototype.values = function values (cb) {

  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  var args = [ 'QUERY', this.path ];

  pushArch(args, this.arch);

  var proc = spawn(getRegExePath(), args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'pipe' ]
      })
  ,   buffer = ''
  ,   self = this
  ,   error = null // null means no error previously reported.

  var output = captureOutput(proc);

  proc.on('close', function (code) {
    if (error) {
      return;
    } else if (code !== 0) {
      log('process exited with code ' + code);
      cb(mkErrorMsg('QUERY', code, output), null);
    } else {
      var items = []
      ,   result = []
      ,   lines = buffer.split('\n')
      ,   lineNumber = 0

      for (var i = 0, l = lines.length; i < l; i++) {
        var line = lines[i].trim();
        if (line.length > 0) {
          log(line);
          if (lineNumber != 0) {
            items.push(line);
          }
          ++lineNumber;
        }
      }

      for (var i = 0, l = items.length; i < l; i++) {

        var match = ITEM_PATTERN.exec(items[i])
        ,   name
        ,   type
        ,   value

        if (match) {
          name = match[1].trim();
          type = match[2].trim();
          value = match[3];
          result.push(new RegistryItem(self.host, self.hive, self.key, name, type, value, self.arch));
        }
      }

      cb(null, result);

    }
  });

  proc.stdout.on('data', function (data) {
    buffer += data.toString();
  });

  proc.on('error', function(err) {
    error = err;
    cb(err);
  });

  return this;
};

/**
 * retrieve all subkeys from this registry key
 */
Registry.prototype.keys = function keys (cb) {

  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  var args = [ 'QUERY', this.path ];

  pushArch(args, this.arch);

  var proc = spawn(getRegExePath(), args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'pipe' ]
      })
  ,   buffer = ''
  ,   self = this
  ,   error = null // null means no error previously reported.

  var output = captureOutput(proc);

  proc.on('close', function (code) {
    if (error) {
      return;
    } else if (code !== 0) {
      log('process exited with code ' + code);
      cb(mkErrorMsg('QUERY', code, output), null);
    }
  });

  proc.stdout.on('data', function (data) {
    buffer += data.toString();
  });

  proc.stdout.on('end', function () {

    var items = []
    ,   result = []
    ,   lines = buffer.split('\n')

    for (var i = 0, l = lines.length; i < l; i++) {
      var line = lines[i].trim();
      if (line.length > 0) {
        log(line);
        items.push(line);
      }
    }

    for (var i = 0, l = items.length; i < l; i++) {

      var match = PATH_PATTERN.exec(items[i])
      ,   hive
      ,   key

      if (match) {
        hive = match[1];
        key  = match[2];
        if (key && (key !== self.key)) {
          result.push(new Registry({
            host: self.host,
            hive: self.hive,
            key:  key,
            arch: self.arch
          }));
        }
      }
    }

    cb(null, result);

  });

  proc.on('error', function(err) {
    error = err;
    cb(err);
  });

  return this;
};

/**
 * retrieve a named value from this registry key
 */
Registry.prototype.get = function get (name, cb) {

  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  var args = ['QUERY', this.path];
  if (name == '')
    args.push('/ve');
  else
    args = args.concat(['/v', name]);

  pushArch(args, this.arch);

  var proc = spawn(getRegExePath(), args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'pipe' ]
      })
  ,   buffer = ''
  ,   self = this
  ,   error = null // null means no error previously reported.

  var output = captureOutput(proc);

  proc.on('close', function (code) {
    if (error) {
      return;
    } else if (code !== 0) {
      log('process exited with code ' + code);
      cb(mkErrorMsg('QUERY', code, output), null);
    } else {
      var items = []
      ,   result = null
      ,   lines = buffer.split('\n')
      ,   lineNumber = 0

      for (var i = 0, l = lines.length; i < l; i++) {
        var line = lines[i].trim();
        if (line.length > 0) {
          log(line);
          if (lineNumber != 0) {
             items.push(line);
          }
          ++lineNumber;
        }
      }

      //Get last item - so it works in XP where REG QUERY returns with a header
      var item = items[items.length-1] || ''
      ,   match = ITEM_PATTERN.exec(item)
      ,   name
      ,   type
      ,   value

      if (match) {
        name = match[1].trim();
        type = match[2].trim();
        value = match[3];
        result = new RegistryItem(self.host, self.hive, self.key, name, type, value, self.arch);
      }

      cb(null, result);
    }
  });

  proc.stdout.on('data', function (data) {
    buffer += data.toString();
  });

  proc.on('error', function(err) {
    error = err;
    cb(err);
  });

  return this;
};

/**
 * put a value into this registry key, overwrites existing value
 */
Registry.prototype.set = function set (name, type, value, cb) {

  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  if (REG_TYPES.indexOf(type) == -1)
    throw Error('illegal type specified.');

  var args = ['ADD', this.path];
  if (name == '')
    args.push('/ve');
  else
    args = args.concat(['/v', name]);

  args = args.concat(['/t', type, '/d', value, '/f']);

  pushArch(args, this.arch);

  var proc = spawn(getRegExePath(), args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'pipe' ]
      })
  ,   error = null // null means no error previously reported.

  var output = captureOutput(proc);

  proc.on('close', function (code) {
    if(error) {
      return;
    } else if (code !== 0) {
      log('process exited with code ' + code);
      cb(mkErrorMsg('ADD', code, output, null));
    } else {
      cb(null);
    }
  });

  proc.stdout.on('data', function (data) {
    // simply discard output
    log(''+data);
  });

  proc.on('error', function(err) {
    error = err;
    cb(err);
  });

  return this;
};

/**
 * remove a named value from this registry key
 */
Registry.prototype.remove = function remove (name, cb) {

  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  var args = name ? ['DELETE', this.path, '/f', '/v', name] : ['DELETE', this.path, '/f', '/ve'];

  pushArch(args, this.arch);

  var proc = spawn(getRegExePath(), args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'pipe' ]
      })
  ,   error = null // null means no error previously reported.

  var output = captureOutput(proc);

  proc.on('close', function (code) {
    if(error) {
      return;
    } else if (code !== 0) {
      log('process exited with code ' + code);
      cb(mkErrorMsg('DELETE', code, output), null);
    } else {
      cb(null);
    }
  });

  proc.stdout.on('data', function (data) {
    // simply discard output
    log(''+data);
  });

  proc.on('error', function(err) {
    error = err;
    cb(err);
  });

  return this;
};

/**
 * erase this registry key and it's contents
 */
Registry.prototype.erase = function erase (cb) {

  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  var args = ['DELETE', this.path, '/f', '/va'];

  pushArch(args, this.arch);

  var proc = spawn(getRegExePath(), args, {
        cwd: undefined,
        env: process.env,
      })
  ,   error = null // null means no error previously reported.

  var output = captureOutput(proc);

  proc.on('close', function (code) {
    if(error) {
      return;
    } else if (code !== 0) {
      log('process exited with code ' + code);
      cb(mkErrorMsg("DELETE", code, output), null);
    } else {
      cb(null);
    }
  });

  proc.stdout.on('data', function (data) {
    // simply discard output
    log(''+data);
  });

  proc.on('error', function(err) {
    error = err;
    cb(err);
  });

  return this;
};

/**
 * create this registry key
 */
Registry.prototype.create = function create (cb) {

  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');

  var args = ['ADD', this.path, '/f'];

  pushArch(args, this.arch);

  var proc = spawn(getRegExePath(), args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'ignore', 'pipe', 'pipe' ]
      })
  ,   error = null // null means no error previously reported.

  var output = captureOutput(proc);

  proc.on('close', function (code) {
    if (error) {
      return;
    } else if (code !== 0) {
      log('process exited with code ' + code);
      cb(mkErrorMsg('ADD', code, output), null);
    } else {
      cb(null);
    }
  });

  proc.stdout.on('data', function (data) {
    // simply discard output
    log(''+data);
  });

  proc.on('error', function(err) {
    error = err;
    cb(err);
  });

  return this;
};

module.exports = Registry;

/* lock Registry class */
Object.freeze(Registry);
Object.freeze(Registry.prototype);
