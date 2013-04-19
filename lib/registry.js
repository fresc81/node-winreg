/************************************************************************************************************
 * registry.js - contains a wrapper for the REG command under Windows, which provides access to the registry
 *
 *  author:   Paul Bottin a/k/a FrEsC
 *
 */

/* imports */
var util          = require('util')
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

/* registry item pattern */
,   ITEM_PATTERN  = /^([a-zA-Z0-9_\s]+)\s(REG_SZ|REG_MULTI_SZ|REG_EXPAND_SZ|REG_DWORD|REG_QWORD|REG_BINARY|REG_NONE)\s+([^\s].*)$/


function RegistryItem (host, hive, key, name, type, value) {
  
  if (!(this instanceof RegistryItem))
    return new RegistryItem(host, hive, key, name, type, value);
  
  /* private members */
  var _host = host
  ,   _hive = hive
  ,   _key = key
  ,   _name = name
  ,   _type = type
  ,   _value = value
  
  /* getters/setters */
  this.__defineGetter__('host', function () { return _host; });
  this.__defineGetter__('hive', function () { return _hive; });
  this.__defineGetter__('key', function () { return _key; });
  this.__defineGetter__('name', function () { return _name; });
  this.__defineGetter__('type', function () { return _type; });
  this.__defineGetter__('value', function () { return _value; });
  
  Object.freeze(this);
}

util.inherits(RegistryItem, Object);

/* lock RegistryItem class */
Object.freeze(RegistryItem);
Object.freeze(RegistryItem.prototype);

/**
 *
 */
function Registry (options) {
  
  if (!(this instanceof Registry))
    return new Registry(options);
  
  /* private members */
  var _options = options || {}
  ,   _host = '' + (_options.host || '')
  ,   _hive = '' + (_options.hive || HKLM)
  ,   _key  = '' + (_options.key  || '')
  
  /* getters/setters */
  this.__defineGetter__('host', function () { return _host; });
  this.__defineGetter__('hive', function () { return _hive; });
  this.__defineGetter__('key', function () { return _key; });
  this.__defineGetter__('path', function () { return (_host.length == 0 ? '' : '\\\\' + host + '\\') + _hive + _key; });
  
  // validate options...
  if (HIVES.indexOf(_hive) == -1)
    throw new Error('illegal hive specified.');
  
  if (!KEY_PATTERN.test(_key))
    throw new Error('illegal key specified.');
  
  Object.freeze(this);
}

util.inherits(Registry, Object);

/**
 *
 */
Registry.HKLM = HKLM;

/**
 *
 */
Registry.HKCU = HKCU;

/**
 *
 */
Registry.HKCR = HKCR;

/**
 *
 */
Registry.HKU = HKU;

/**
 *
 */
Registry.HKCC = HKCC;

/**
 *
 */
Registry.HIVES = HIVES;

/**
 *
 */
Registry.REG_SZ = REG_SZ;

/**
 *
 */
Registry.REG_MULTI_SZ = REG_MULTI_SZ;

/**
 *
 */
Registry.REG_EXPAND_SZ = REG_EXPAND_SZ;

/**
 *
 */
Registry.REG_DWORD = REG_DWORD;

/**
 *
 */
Registry.REG_QWORD = REG_QWORD;

/**
 *
 */
Registry.REG_BINARY = REG_BINARY;

/**
 *
 */
Registry.REG_NONE = REG_NONE;

/**
 *
 */
Registry.REG_TYPES = REG_TYPES;

/**
 *
 */
Registry.prototype.values = function values (cb) {
  
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');
  
  var args = [ 'QUERY', this.path ]
  ,   proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'pipe', 'pipe', process.stderr ]
      })
  ,   buffer = ''
  
  proc.on('close', function (code) {
    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code), null);
    }
  });
  
  proc.stdout.on('data', function (data) {
    buffer += data.toString();
  });
  
  proc.stdout.on('end', function () {
  
    var items = []
    ,   lines = buffer.split('\n')
    ,   lineNumber = 0
    
    for (var line in lines) {
      lines[line] = lines[line].trim();
      if (lines[line].length > 0) {
        log(lines[line]);
        if (lineNumber > 0) {
          items.push(lines[line]);
        }
        ++lineNumber;
      }
    }  
    
    for (var item in items) {
      
      var match = ITEM_PATTERN.exec(items[item])
      ,   name
      ,   type
      ,   value
      
      if (match) {
        name = match[1].trim();
        type = match[2].trim();
        value = match[3];
        items[item] = new RegistryItem(this.host, this.hive, this.key, name, type, value);
      }
    }
    
    cb(null, items);
    
  });
  
  return this;
};

/**
 *
 */
Registry.prototype.get = function get (name, cb) {
  
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');
  
  var args = [ 'QUERY', this.path, '/v', name ]
  ,   proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'pipe', 'pipe', process.stderr ]
      })
  ,   buffer = ''
  
  proc.on('close', function (code) {
    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code), null);
    }
  });
  
  proc.stdout.on('data', function (data) {
    buffer += data.toString();
  });
  
  proc.stdout.on('end', function () {
    
    var items = []
    ,   lines = buffer.split('\n')
    ,   lineNumber = 0
    
    for (var line in lines) {
      lines[line] = lines[line].trim();
      if (lines[line].length > 0) {
        log(lines[line]);
        if (lineNumber != 0) {
           items.push(lines[line]);         
        }
        ++lineNumber;
      }
    }
    
    var item = items[0]
    ,   match = ITEM_PATTERN.exec(item)
    ,   name
    ,   type
    ,   value
    
    if (match) {
      name = match[1].trim();
      type = match[2].trim();
      value = match[3];
      item = new RegistryItem(this.host, this.hive, this.key, name, type, value);
    }
    
    cb(null, item);
    
  });
  
  return this;
};

/**
 *
 */
Registry.prototype.set = function set (name, type, value, cb) {
  
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');
  
  if (REG_TYPES.indexOf(type) == -1)
    throw Error('illegal type specified.');
  
  var args = ['ADD', this.path, '/f', '/v', name, '/t', type, '/d', value]
  ,   proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'pipe', 'pipe', process.stderr ]
      })
  
  proc.on('close', function (code) {
    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code));
    } else {
      cb(null);
    }
  });
  
  proc.stdout.on('data', function (data) {
    // simply discard output
    log(''+data);
  });
  
  return this;
};

/**
 *
 */
Registry.prototype.remove = function remove (name, cb) {
  
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');
  
  var args = name ? ['DELETE', this.path, '/f', '/v', name] : ['DELETE', this.path, '/f', '/ve']
  ,   proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'pipe', 'pipe', process.stderr ]
      })
  
  proc.on('close', function (code) {
    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code));
    } else {
      cb(null);
    }
  });
  
  proc.stdout.on('data', function (data) {
    // simply discard output
    log(''+data);
  });
  
  return this;
};

/**
 *
 */
Registry.prototype.erase = function erase (cb) {
  
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');
  
  var args = ['DELETE', this.path, '/f', '/va']
  ,   proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'pipe', 'pipe', process.stderr ]
      })
  
  proc.on('close', function (code) {
    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code));
    } else {
      cb(null);
    }
  });
  
  proc.stdout.on('data', function (data) {
    // simply discard output
    log(''+data);
  });
  
  return this;
};

/**
 *
 */
Registry.prototype.create = function create (cb) {
  
  if (typeof cb !== 'function')
    throw new TypeError('must specify a callback');
  
  var args = ['ADD', this.path]
  ,   proc = spawn('REG', args, {
        cwd: undefined,
        env: process.env,
        stdio: [ 'pipe', 'pipe', process.stderr ]
      })
  
  proc.on('close', function (code) {
    if (code !== 0) {
      log('process exited with code ' + code);
      cb(new Error('process exited with code ' + code));
    } else {
      cb(null);
    }
  });
  
  proc.stdout.on('data', function (data) {
    // simply discard output
    log(''+data);
  });
  
  return this;
};

module.exports = Registry;

/* lock Registry class */
Object.freeze(Registry);
Object.freeze(Registry.prototype);
