
// this should reveal wrong iteration used for arrays
Array.prototype.someNewMethod = function() {};

var test  = require('unit.js');

describe('winreg', function(){
  
  it('we\'re running on Windows', function () {
    
    test.string(process.platform)
    . is('win32');
    
  });
  
  // Registry class
  var Registry = require(__dirname+'/../../lib/registry.js');
  
  it('Registry is a class', function () {
    
    test.function(Registry)
    . hasName('Registry');
    
  });
  
  // create a uniqe registry key in HKCU to test in...
  var regKey = new Registry({
    hive: Registry.HKCU,
    key:  '\\Software\\AAA_' + new Date().toISOString()
  });
  
  it('regKey is instance of Registry', function(){
    
    test.object(regKey)
    . isInstanceOf(Registry);
    
  });
  
  describe('Registry', function (){
    
    describe('keyExists()', function(){
      
      it('regKey has method', function () {
        
        test.object(regKey)
        . hasProperty('keyExists');
        
        test.function(regKey.keyExists)
        . hasName('keyExists');
        
      });
      
      it('regKey does not already exist', function(done) {
        
        regKey.keyExists(function (err, exists) {
          
          if (err) throw err;
          
          test.bool(exists)
          . isNotTrue();
          
          done();
          
        });
        
      });
      
    }); // end - describe keyExists()
    
    describe('create()', function(){
      
      it('regKey has method', function () {
        
        test.object(regKey)
        . hasProperty('create');
        
        test.function(regKey.create)
        . hasName('create');
        
      });
      
      it('regKey can be created', function(done) {
        
        regKey.create(function (err) {
          
          if (err) throw err;
          
          done();
          
        });
        
      });
      
      it('regKey exists after being created', function(done) {
        
        regKey.keyExists(function (err, exists) {
          
          if (err) throw err;
          
          test.bool(exists)
          . isTrue();
          
          done();
          
        });
        
      });
      
    }); // end - describe create()
    
    describe('keys()', function (){
      
      it('regKey has method', function () {
        
        test.object(regKey)
        . hasProperty('keys');
        
        test.function(regKey.keys)
        . hasName('keys');
        
      });
      
    }); // end - describe keys()
    
    describe('valueExists()', function (){
      
      it('regKey has method', function () {
        
        test.object(regKey)
        . hasProperty('valueExists');
        
        test.function(regKey.valueExists)
        . hasName('valueExists');
        
      });
      
    }); // end - describe valueExists
    
    describe('get()', function (){
      
      it('regKey has method', function () {
        
        test.object(regKey)
        . hasProperty('get');
        
        test.function(regKey.get)
        . hasName('get');
        
      });
      
    }); // end - describe get
    
    describe('values()', function (){
      
      it('regKey has method', function () {
        
        test.object(regKey)
        . hasProperty('values');
        
        test.function(regKey.values)
        . hasName('values');
        
      });
      
    }); // end - describe values
    
    describe('set()', function (){
      
      it('regKey has method', function () {
        
        test.object(regKey)
        . hasProperty('set');
        
        test.function(regKey.set)
        . hasName('set');
        
      });
      
    }); // end - describe set
    
    describe('remove()', function (){
      
      it('regKey has method', function () {
        
        test.object(regKey)
        . hasProperty('remove');
        
        test.function(regKey.remove)
        . hasName('remove');
        
      });
      
    }); // end - describe remove
    
    describe('clear()', function (){
      
      it('regKey has method', function () {
        
        test.object(regKey)
        . hasProperty('clear');
        
        test.function(regKey.clear)
        . hasName('clear');
        
      });
      
    }); // end - describe clear
    
    describe('destroy()', function(){
      
      it('regKey has method', function () {
        
        test.object(regKey)
        . hasProperty('destroy');
        
        test.function(regKey.destroy)
        . hasName('destroy');
        
      });
      
      it('regKey can be destroyed', function(done) {
        
        regKey.destroy(function (err) {
          
          if (err) throw err;
          
          done();
          
        });
        
      });
      
      it('regKey is missing after being destroyed', function(done) {
        
        regKey.keyExists(function (err, exists) {
          
          if (err) throw err;
          
          test.bool(exists)
          . isFalse();
          
          done();
          
        });
        
      });
      
    }); // end - describe destroy()
  
  }); // end - describe Registry
  
}); // end - describe winreg
