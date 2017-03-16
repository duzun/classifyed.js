# classifyed.js

A tiny yet powerful lib to create extensible JS Classes,
with an elegant way of calling parent methods.


# Usage

```javascript
var MyClass = Classifyed.extend({
    constructor: function() { ... },
    doFoo: function () { ... }
},
{
    type: 'MyClass',
    staticFoo: function () {
        // This is a static method
    }
});

var SuperClass = MyClass.extend({
    constructor: function(){
        this.__super__('constructor', arguments); // call parent constructor
        // Continue with the constructor...
    },
    doFoo: function () {
        this.__super__('doFoo', arguments); // call parent method
        // Do stuff
    }
},
{
   type: 'SuperClass',
   staticFoo: function () {
        this.__super__.constructor.staticFoo(); // call parent static method
        this.parent().staticFoo(); // same as previous
   }
});

var myObj = new SuperClass();
myObj.doFoo();
myObj.__super__('doFoo');

console.log(myObj.constructor.type); // 'MyClass'
console.log(myObj.constructor.__super__.constructor.type); // 'SuperClass'
console.log(myObj.constructor.parent().type); // 'SuperClass' again

```


