node-winreg
===========

[![Join the chat at https://gitter.im/fresc81/node-winreg](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/fresc81/node-winreg?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

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

  * __host__  the optional hostname, must start with the '\\\\' sequence
  * __hive__  the optional hive id (see below), the default is __HKLM__
  * __key__   the optional key, the default is th root key

The key, if specified, has to start, but must not be terminated with a '\\' character.

On 64 Bit Windows operating systems the following option can be used to select the 32 or 64 Bit versions of the keys:

  * __arch__  the optional arch version string to be used, only valid on 64 Bit Windows, if specified must be one of 'x86' or 'x64'

The instances of Winreg provide access to a single registry key. The hive id can be one of the following:

  * __HKLM__  HKEY_LOCAL_MACHINE
  * __HKCU__  HKEY_CURRENT_USER
  * __HKCR__  HKEY_CLASSES_ROOT
  * __HKCC__  HKEY_CURRENT_CONFIG
  * __HKU__   HKEY_USERS


Registry values are returned as objects, containing the following information:

  * __host__  the hostname, if it has been set in the options
  * __hive__  the hive id, as specified in the options
  * __key__   the key, as specified in the options
  * __name__  the name of the registry value
  * __type__  one of the types listed below
  * __value__ a string containing the value


Registry values can have one of the following types:

  * __REG_SZ__        a string value
  * __REG_MULTI_SZ__  a multiline string value
  * __REG_EXPAND_SZ__ an expandable string value
  * __REG_DWORD__     a double word value (32 bit integer)
  * __REG_QWORD__     a quad word value (64 bit integer)
  * __REG_BINARY__    a binary value
  * __REG_NONE__      a value of unknown type


Following methods are provided by instances of Winreg:

<table>
  <tr>
    <th>Method</th>
    <th>Parameters</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>values</td>
    <td>callback</td>
    <td>list the values under this key</td>
  </tr>
  <tr>
    <td>keys</td>
    <td>callback</td>
    <td>list the subkeys of this key</td>
  </tr>
  <tr>
    <td>get</td>
    <td>name, callback</td>
    <td>gets a value by it's name</td>
  </tr>
  <tr>
    <td>set</td>
    <td>name, type, value, callback</td>
    <td>sets a value</td>
  </tr>
  <tr>
    <td>remove</td>
    <td>name, callback</td>
    <td>remove the value with the given key</td>
  </tr>
  <tr>
    <td>create</td>
    <td>callback</td>
    <td>create this key</td>
  </tr>
  <tr>
    <td>erase</td>
    <td>callback</td>
    <td>remove this key</td>
  </tr>
</table>


Following readonly properties are provided by instances of Winreg:

<table>
  <tr>
    <th>Property</th>
    <th>Type</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>host</td>
    <td>string</td>
    <td>the hostname, if specified in the options</td>
  </tr>
  <tr>
    <td>hive</td>
    <td>string</td>
    <td>the registry hive</td>
  </tr>
  <tr>
    <td>key</td>
    <td>string</td>
    <td>the registry key</td>
  </tr>
  <tr>
    <td>path</td>
    <td>string</td>
    <td>this key's path</td>
  </tr>
  <tr>
    <td>parent</td>
    <td>Winreg</td>
    <td>a new Winreg instance initialized with the parent key</td>
  </tr>
</table>


License
-------

This project is released under [BSD 2-Clause License](http://opensource.org/licenses/BSD-2-Clause).

Copyright (c) 2016, Paul Bottin All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.