/**
 *  A tiny lib to create extensible JS Classes, cross-browser.
 *
 *  Usage:
 *    var MyClass = Classifyed.extend(
 *      {
 *         constructor: function() { ... },
 *         doFoo: function () { ... },
 *         barProp: "I'm a prototype property"
 *      }
 *    , {
 *         type: 'MyClass' // static property
 *         staticFoo: function () {
 *              // This is a static method
 *         }
 *      }
 *    );
 *
 *   var SuperClass = MyClass.extend(
 *     {
 *         constructor: function(){
 *              this.__super__('constructor', arguments);
 *              // Continue with the constructor...
 *         },
 *         doFoo: function () {
 *              this.__super__('doFoo', arguments); // call parent method
 *              // Do stuff
 *         }
 *      }
 *    , {
 *         type: 'SuperClass',
 *         staticFoo: function () {
 *              this.__super__.constructor.staticFoo(); // call parent static method
 *              this.parent().staticFoo(); // same as previous
 *         }
 *     }
 *   );
 *
 *   var myObj = new SuperClass();
 *   myObj.doFoo();
 *   myObj.__super__('doFoo');
 *
 *   console.log(myObj.constructor.type); // my class
 *   console.log(myObj.constructor.__super__.constructor.type); // my parent class
 *   console.log(myObj.constructor.parent().type); // my parent class again
 *
 *
 * @author  Dumitru Uzun (DUzun.Me)
 * @version 1.1.0
 * @license MIT
 * @repo    https://github.com/duzun/classifyed.js
 */
;(function (root, name) {
    (typeof define !== 'function' || !define.amd
        ? typeof module == 'undefined' || !module.exports
            ? function (deps, factory) { module.exports = factory(); } // Browser
            : function (deps, factory) { root[name] = factory(); } // CommonJs
        : define // AMD
    )
    /*define*/(/*name, */[], function factory() {
        // ---------------------------------------------------------------------------
        var undefined
        ,   ObjProto = Object.prototype
        ,   hop = ObjProto.hasOwnProperty
        ,   objCreate = Object.create
        ,   hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString')
        ,   dontEnums = [
                'propertyIsEnumerable',
                'isPrototypeOf',
                'toLocaleString',
                'hasOwnProperty',
                'valueOf',
                'toString',
                'constructor'
            ]
        ,   dontEnumsLength = dontEnums.length
        ;

        function each(o, f) {
            if(!o) return o;
            var i, s, l;
            for(i in o) if(hop.call(o, i)) {
                s = o[i];
                if(f.call(s, i, s, o) === false) return i;
            }
            // IE :-( again
            if(hasDontEnumBug) {
                for (l = dontEnumsLength; l-- > 0;) if (hop.call(o, i = dontEnums[l])) {
                    s = o[i];
                    if(f.call(s, i, s, o) === false) return i;
                }
            }
            return o
        }

        function assign(o) {
            function cpy(i,s) { o[i] = s };
            each(arguments, function (i,a) { i && each(a, cpy) });
            return o
        }

        // Helper function to correctly set up the prototype chain, for subclasses.
        function extendClass(protoProps, staticProps) {
            var parent = this
            ,   child
            ,   _proto
            ;

            // Short for extendClass({constructor: function(){...}}) -> extendClass(function(){...})
            if ( typeof protoProps == 'function' ) {
                protoProps = { constructor: protoProps };
            }

            // The constructor function for the new subclass is either defined by you
            // (the "constructor" property in your `extend` definition), or defaulted
            // by us to simply call the parent's constructor.
            if ( !protoProps || !hop.call(protoProps, 'constructor') || !(child = protoProps.constructor) || child === Object ) {
                child = function(){ return parent.apply(this, arguments) };
            }

            // Add static properties to the constructor function, if supplied.
            assign(child, parent, staticProps);

            // Set the prototype chain to inherit from `parent`, without calling
            // `parent`'s constructor function.

            var _super = parent.prototype;

            child.prototype = _proto = objCreate(_super);

            _proto.constructor = child;

            // Add prototype properties (instance properties) to the subclass,
            // if supplied.
            assign(_proto, protoProps);

            // parent's prototype
            child.__super__ = _super;

            return child;
        }

        // Base class
        function Classifyed() {

        }
        Classifyed.type = name;

        var ClassProto = Classifyed.prototype;

        // The "magic" method to extend classes
        Classifyed.extend = extendClass;

        // Get parent class
        Classifyed.parent = function parentConstructor(inst, args) {
            var self = this;
            return (self = self.__super__) && (self = self.constructor);
        }

        /// Invoke parent[methName](args) on this instance
        ClassProto.__super__ = function (methName, args) {
            var self = this
            ,   consProp = '[super@'+methName+']:cons'
            ,   cons = consProp in self ? self[consProp] : self.constructor
            ,   proto
            ;
            while ( proto = cons.__super__ ) {
                cons = proto.constructor;
                if ( hop.call(proto, methName) ) {
                    var meth = proto[methName]
                    ,   ndel = consProp in self
                    ,   ret
                    ;
                    if(!meth.apply && !meth.call) {
                        throw new Error('Invalid method for '+funcName(cons)+'.__super__('+methName+')', meth);
                    }
                    self[consProp] = cons;
                    if(meth.apply) {
                        ret = meth.apply(self, args||[]);
                    }
                    else {
                        ret = meth.call(self, args&&args[0]);
                    }
                    if ( !ndel ) delete self[consProp];
                    return ret;
                }
            };
        }


        // ---------------------------------------------------------------------------
        // Export helpers:
        ClassProto.each = each;
        ClassProto.assign = assign;
        ClassProto.funcName = funcName;

        // ---------------------------------------------------------------------------
        // This function is intended for debug only!
        function funcName(f) {
            var n = f.displayName || f.name;
            if(!n) {
                n = (f+'').match(/function\s+([^\(]*)/);
                if(n) {
                    n = n[1];
                }
                else n = undefined;
            }
            return n;
        }
        // ---------------------------------------------------------------------------
        // Polyfill
        if ( typeof objCreate != 'function' ) {
            objCreate = (function (Object) {
                return function (prototype) {
                    Object.prototype = prototype;
                    var obj = new Object;
                    Object.prototype = null;
                    obj.__proto__ = prototype;
                    obj.__proto__ = prototype;
                    return obj;
                }
            }
            (function (){}));
        }

        return Classifyed;
        // ---------------------------------------------------------------------------
    });
}
(this, 'Classifyed'));