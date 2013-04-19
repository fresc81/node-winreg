node-winreg
===========

node module that provides access to the Windows Registry through the REG commandline tool


Installation
------------

```shell
npm install winreg 
```


Usage
-----

Let's start with an example. The code below lists the autostart programs of the current user.

```javascript

var Winreg = require('winreg')
,   regKey = new Winreg({
      hive: Winreg.HKCU,                                          // HKEY_CURRENT_USER
      key:  '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' // key containing autostart programs
    })

// list autostart programs
regKey.values(function (err, items) {
  if (err)
    console.log('ERROR: '+err);
  else
    for (var i in items)
      console.log('ITEM: '+items[i].name+'\t'+items[i].type+'\t'+items[i].value);
});

```

The following options are processed by the Winreg constructor:
  + __host__  the optional hostname, must start with the '\\\\' sequence
  + __hive__  the optional hive id (see below), the default is __HKLM__
  + __key__   the optional key, the default is th root key

The instances of Winreg provide access to a single registry key. The hive id can be one of the following:
  + __HKLM__  HKEY_LOCAL_MACHINE
  + __HKCU__  HKEY_CURRENT_USER
  + __HKCR__  HKEY_CLASSES_ROOT
  + __HKCC__  HKEY_CURRENT_CONFIG
  + __HKU__   HKEY_USERS

The key, if specified, has to start, but must not be terminated with a '\\' character.

