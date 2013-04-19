
var Registry = require(__dirname+'/lib/registry.js')

// create a registry client
,   r1 =  new Registry({
      hive: Registry.HKCU,
      key:  '\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    })

// list values
r1
.   values(function (err, items) {
      
      if (!err)
        console.log(JSON.stringify(items));
      
      // query named value
      r1
      .   get(items[0].name, function (err, item) {
            
            if (!err)
              console.log(JSON.stringify(item));
            
            // add value
            r1
            .   set('bla', Registry.REG_SZ, 'hello world!', function (err) {
                  
                  if (!err)
                    console.log('value written');
                  
                  // delete value
                  r1
                  .   remove('bla', function (err) {
                        
                        if (!err)
                          console.log('value deleted');
                        
                      })
                  ;
                })
            ;
          })
      ;
    })
;
