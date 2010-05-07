  /*------------------------------ LANG: OBJECT ------------------------------*/

  eachKey =
  fuse.Object._each = (function() {
    // use switch statement to avoid creating a temp variable
    var _each;
    switch (function() {
      var key, count = 0, klass = function() { this.toString = 1; };
      klass.prototype.toString = 1;
      for (key in new klass) { count++; }
      return count;
    }()) {

      case 0: // IE
        var shadowed = [
          'constructor', 'hasOwnProperty',
          'isPrototypeOf', 'propertyIsEnumerable',
          'toLocaleString', 'toString', 'valueOf'
        ];

        _each = function _each(object, callback) {
          if (object) {
            var key, i = -1;
            for (key in object) {
              callback(object[key], key, object);
            }
            while(key = shadowed[++i]) {
              if (hasKey(object, key)) {
                callback(object[key], key, object);
              }
            }
          }
          return object;
        };

        break;

      case 2:
        // Tobie Langel: Safari 2 broken for-in loop
        // http://tobielangel.com/2007/1/29/for-in-loop-broken-in-safari/
        _each = function _each(object, callback) {
          var key, keys = { }, skipProto = isFunction(object);
          if (object)  {
            for (key in object) {
              if (!(skipProto && key === 'prototype') &&
                  !hasKey(keys, key) && (keys[key] = 1)) {
                callback(object[key], key, object);
              }
            }
          }
          return object;
        };

        break;

      default: // Others
        _each = function _each(object, callback) {
          var key, skipProto = isFunction(object);
          if (object) {
            for (key in object) {
              if (!(skipProto && key === 'prototype')) {
                // exit early if callback result is false
                if (callback(object[key], key, object) === false) {
                  break;
                }
              }
            }
          }
          return object;
        };
    }

    return _each;
  })();

  /*--------------------------------------------------------------------------*/

  // Use fuse.Object.hasKey() on object Objects only as it may error on DOM Classes
  // https://bugzilla.mozilla.org/show_bug.cgi?id=375344
  hasKey =
  fuse.Object.hasKey = (function() {
    var objectProto = Object.prototype,
     hasOwnProperty = objectProto.hasOwnProperty;

    if (typeof hasOwnProperty !== 'function') {
      if (envTest('OBJECT__PROTO__')) {
        // Safari 2
        hasKey = function hasKey(object, property) {
          if (object == null) throw new TypeError;
          // convert primatives to objects so IN operator will work
          object = Object(object);

          var result, proto = object['__proto__'];
          object['__proto__'] = null;
          result = property in object;
          object['__proto__'] = proto;
          return result;
        };
      } else {
        // Other
        hasKey = function hasKey(object, property) {
          if (object == null) throw new TypeError;
          object = Object(object);
          var constructor = object.constructor;
          return property in object &&
            (constructor && constructor.prototype
              ? object[property] !== constructor.prototype[property]
              : object[property] !== objectProto[property]);
        };
      }
    }
    else {
      hasKey = function hasKey(object, property) {
        // ES5 15.2.4.5
        if (object == null) throw new TypeError;
        return hasOwnProperty.call(object, property);
      };
    }

    // Garrett Smith found an Opera bug that occurs with the window object and not the global
    if (typeof window !== 'undefined' && window.Object && !hasKey(window, 'Object')) {
      var __hasKey = hasKey;
      hasKey = function hasKey(object, property) {
        if (object == null) throw new TypeError;
        if(object == global) {
          return property in object &&
            object[property] !== objectProto[property];
        }
        return __hasKey(object, property);
      };
    }

    return hasKey;
  })();

  /*--------------------------------------------------------------------------*/

  fuse.Object.isFunction = isFunction;

  fuse.Object.isHostType = isHostType;

  isArray =
  fuse.Object.isArray = fuse.Array.isArray;

  isElement =
  fuse.Object.isElement = function isElement(value) {
    return !!value && value.nodeType === ELEMENT_NODE;
  };

  isHash =
  fuse.Object.isHash = function isHash(value) {
    var Hash = fuse.Hash;
    return !!value && value.constructor === Hash && value !== Hash.prototype;
  };

  isNumber =
  fuse.Object.isNumber = function isNumber(value) {
    return toString.call(value) === '[object Number]' && isFinite(value);
  };

  // ES5 4.3.2
  isPrimitive =
  fuse.Object.isPrimitive = function isPrimitive(value) {
    var type = typeof value;
    return value == null || type === 'boolean' || type === 'number' || type === 'string';
  };

  isRegExp =
  fuse.Object.isRegExp = function isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
  };

  isString =
  fuse.Object.isString = function isString(value) {
    return toString.call(value) === '[object String]';
  };

  /*--------------------------------------------------------------------------*/

  (function(Obj) {
    var toQueryPair = function(key, value) {
      return fuse.String(typeof value === 'undefined' ? key :
        key + '=' + encodeURIComponent(value == null ? '' : value));
    };

    Obj._extend = function _extend(destination, source) {
      if (source) {
        for (var key in source) {
          destination[key] = source[key];
        }
      }
      return destination;
    };

    Obj.clone = function clone(object) {
      if (object && typeof object.clone === 'function')
        return object.clone();
      return Obj.extend(Obj(), object);
    };

    Obj.each = function each(object, callback, thisArg) {
      try {
        eachKey(object, function(value, key, object) {
          callback.call(thisArg, value, key, object);
        });
      } catch (e) {
        if (e !== $break) throw e;
      }
      return object;
    };

    Obj.extend = function extend(destination, source) {
      eachKey(source, function(value, key) { destination[key] = value; });
      return destination;
    };

    Obj.isEmpty = function isEmpty(object) {
      if (object) {
        for (var key in object) {
          if (hasKey(object, key)) return false;
        }
      }
      return true;
    };

    // https://developer.mozilla.org/En/Same_origin_policy_for_JavaScript
    // http://www.iana.org/assignments/port-numbers
    Obj.isSameOrigin = (function() {
      var loc      = global.location,
       protocol    = loc.protocol,
       port        = loc.port,
       reUrlParts  = /([^:]+:)\/\/(?:[^:]+(?:\:[^@]+)?@)?([^\/:$]+)(?:\:(\d+))?/,
       defaultPort = protocol === 'ftp:' ? 21 : protocol === 'https:' ? 443 : 80,

      isSameOrigin = function isSameOrigin(url) {
        var domainIndex, urlDomain,
         result    = true,
         docDomain = fuse._doc.domain,
         parts     = String(url).match(reUrlParts) || [];

        if (parts[0]) {
          urlDomain = parts[2];
          domainIndex = urlDomain.indexOf(docDomain);
          result = parts[1] === protocol &&
            (!domainIndex || urlDomain.charAt(domainIndex -1) == '.') &&
              (parts[3] || defaultPort) === (port || defaultPort);
        }
        return result;
      };

      return isSameOrigin;
    })();

    // ES5 15.2.3.14
    if (!isFunction(Obj.keys)) {
      Obj.keys = function keys(object) {
        if (isPrimitive(object)) throw new TypeError;

        var result = fuse.Array(), i = -1;
        eachKey(object, function(value, key) {
          if (hasKey(object, key)) result[++i] = key;
        });
        return result;
      };
    }

    Obj.values = function values(object) {
      if (isPrimitive(object)) throw new TypeError;

      var result = fuse.Array(), i = -1;
      eachKey(object, function(value, key) {
        if (hasKey(object, key)) result[++i] = value;
      });
      return result;
    };

    Obj.toHTML = function toHTML(object) {
      return object && typeof object.toHTML === 'function'
        ? fuse.String(object.toHTML())
        : fuse.String(object == null ? '' : object);
    };

    Obj.toQueryString = function toQueryString(object) {
      var result = [];
      eachKey(object, function(value, key) {
        if (hasKey(object, key)) {
          key = encodeURIComponent(key);
          if (value && isArray(value)) {
            var i = result.length, j = 0, length = i + value.length;
            while (i < length) result[i++] = toQueryPair(key, value[j++]);
          }
          else if (!value || toString.call(value) !== '[object Object]') {
            result.push(toQueryPair(key, value));
          }
        }
      });
      return fuse.String(result.join('&'));
    };

    // prevent JScript bug with named function expressions
    var _extend =    nil,
     clone =         nil,
     each =          nil,
     extend =        nil,
     isEmpty =       nil,
     keys =          nil,
     values =        nil,
     toHTML =        nil,
     toQueryString = nil;
  })(fuse.Object);
