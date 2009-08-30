  /*----------------------------- ELEMENT: STYLE -----------------------------*/

  (function(methods) {
    methods.classNames = function classNames(element) {
      var results = Fuse.String($(element).className).split(/\s+/);
      return results[0].length ? results : Fuse.List();
    };

    methods.hasClassName = function hasClassName(element, className) {
      element = $(element);
      var elementClassName = element.className;
      return (elementClassName.length > 0 && (elementClassName === className ||
        (' ' + elementClassName + ' ').indexOf(' ' + className + ' ') > -1));
    };

    methods.addClassName = function addClassName(element, className) {
      element = $(element);
      if (!Element.hasClassName(element, className))
        element.className += (element.className ? ' ' : '') + className;
      return element;
    };

    methods.removeClassName = function removeClassName(element, className) {
      element = $(element);
      element.className = Fuse.String(element.className.replace(
        new RegExp('(^|\\s+)' + className + '(\\s+|$)'), ' ')).trim();
      return element;
    };

    methods.toggleClassName = function toggleClassName(element, className) {
      return Element[Element.hasClassName(element, className) ?
        'removeClassName' : 'addClassName'](element, className);
    };

    methods.getOpacity = (function() {
      var getOpacity = function getOpacity(element) {
        return Fuse.Number(parseFloat($(element).style.opacity));
      };

      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        getOpacity = function getOpacity(element) {
          element = $(element);
          var style = element.ownerDocument.defaultView.getComputedStyle(element, null);
          return Fuse.Number(
            parseFloat(style ? style.opacity : element.style.opacity));
        };
      }
      else if (Feature('ELEMENT_MS_CSS_FILTERS')) {
        getOpacity = function getOpacity(element) {
          element = $(element);
          var s = element.currentStyle || element.style,
            value = s['filter'].match(/alpha\(opacity=(.*)\)/);
          return Fuse.Number(value && value[1] ? parseFloat(value[1]) / 100 : 1.0);
        };
      }
      return getOpacity;
    })();

    methods.setOpacity = (function() {
      var setOpacity = function setOpacity(element, value) {
        element = $(element);
        element.style.opacity = (value == 1 || value == '' && isString(value)) ? '' :
          (value < 0.00001) ? '0' : value;
        return element;
      };

      // TODO: Is this really needed or the best approach ?
      if (Fuse.Env.Agent.WebKit && (userAgent.match(/AppleWebKit\/(\d+)/) || [])[1] < 500) {
        var __setOpacity = setOpacity;
        setOpacity = function setOpacity(element, value) {
          element = __setOpacity(element, value);
          if (value == 1) {
            if (getNodeName(element) === 'IMG' && element.width) {
              element.width++; element.width--;
            } else try {
              element.removeChild(element.appendChild(element
                .ownerDocument.createTextNode(' ')));
            } catch (e) { }
          }
          return element;
        };
      }
      else if (Fuse.Env.Agent.Gecko && /rv:1\.8\.0/.test(userAgent)) {
        setOpacity = function setOpacity(element, value) {
          element = $(element);
          element.style.opacity = (value == 1) ? 0.999999 :
            (value == '' && isString(value)) ? '' :
              (value < 0.00001) ? 0 : value;
          return element;
        };
      }
      else if (Feature('ELEMENT_MS_CSS_FILTERS')) {
        setOpacity = function setOpacity(element, value) {
          element = $(element);
          if (!Element._hasLayout(element))
            element.style.zoom = 1;

          var style = element.style,
           filter = Element.getStyle(element, 'filter');

          // strip alpha
          filter = filter.replace(/alpha\([^)]*\)/gi, '');

          if (value == 1 || value == '' && isString(value)) {
            if (filter) style.filter = filter;
            else style.removeAttribute('filter');
            return element;
          }
          else if (value < 0.00001) value = 0;

          style.filter = filter + 'alpha(opacity=' + (value * 100) + ')';
          return element;
        };
      }
      return setOpacity;
    })();

    // prevent JScript bug with named function expressions
    var addClassName = null,
     hasClassName =    null,
     removeClassName = null,
     classNames =      null,
     toggleClassName = null,
     getOpacity =      null,
     setOpacity =      null;
  })(Element.Methods);

  /*--------------------------------------------------------------------------*/

  (function(methods) {
    var DIMENSION_NAMES = { 'height': 1, 'width': 1 },

    FLOAT_TRANSLATIONS = typeof Fuse._docEl.style.styleFloat !== 'undefined'
     ? { 'float': 'styleFloat', 'cssFloat': 'styleFloat' }
     : { 'float': 'cssFloat' };

    methods.setStyle = function setStyle(element, styles) {
      element = $(element);
      var key, name, elementStyle = element.style;

      if (isString(styles)) {
        element.style.cssText += ';' + styles;
        return styles.indexOf('opacity') > -1
          ? Element.setOpacity(element, styles.match(/opacity:\s*(\d?\.?\d*)/)[1])
          : element;
      }
      if (isHash(styles))
        styles = styles._object;

      for (key in styles) {
        name = FLOAT_TRANSLATIONS[key] || key;
        if (name === 'opacity') Element.setOpacity(element, styles[key]);
        else elementStyle[name] = styles[key];
      }
      return element;
    };

    methods.getStyle =
      Feature('ELEMENT_COMPUTED_STYLE') || !Feature('ELEMENT_CURRENT_STYLE') ?
      (function() {
        function _getComputedStyle(element, name) {
          name = FLOAT_TRANSLATIONS[name] || name;
          var css = element.ownerDocument.defaultView.getComputedStyle(element, null);
          if (css) return _getResult(name, css[name]);
          return _getStyleValue(element, name);
        }

        function _getStyleValue(element, name) {
          name = FLOAT_TRANSLATIONS[name] || name;
          return _getResult(name, element.style[name]);
        }

        function _getResult(name, value) {
          if (name == 'opacity')
            return Fuse.String(value === '1' ? '1.0' : parseFloat(value) || '0');
          return value === 'auto' || value === '' ? null : Fuse.String(value);
        }

        function _isNull(element, name) {
          var length = _isNull.handlers.length;
          while (length--) {
            if (_isNull.handlers[length](element, name))
            return true;
          }
          return false;
        }

        _isNull.handlers = [];

        if (Bug('ELEMENT_COMPUTED_STYLE_DEFAULTS_TO_ZERO')) {
          _isNull.handlers.push((function() {
            var POSITION_NAMES = { 'bottom': 1, 'left': 1, 'right': 1, 'top': 1 };
            return function(element, name) {
              return POSITION_NAMES[name] &&
                _getComputedStyle(element, 'position') === 'static';
            };
          })());
        }
        if (Bug('ELEMENT_COMPUTED_STYLE_HEIGHT_IS_ZERO_WHEN_HIDDEN')) {
          _isNull.handlers.push(function(element, name) {
            return DIMENSION_NAMES[name] && element.style.display === 'none';
          });
        }

        var getStyle;
        if (!Feature('ELEMENT_COMPUTED_STYLE')) {
          getStyle = function getStyle(element, name) {
            return _getStyleValue(element, name);
          };
        }
        else if (Bug('ELEMENT_COMPUTED_STYLE_DIMENSIONS_EQUAL_BORDER_BOX')) {
          // Opera 9.2x
          getStyle = function getStyle(element, name) {
            element = $(element);
            name = Fuse.String(name).camelize();
            if (_isNull(element, name)) return null;
            var value = _getComputedStyle(element, name);

            // returns the border-box dimensions rather than the content-box
            // dimensions, so we subtract padding and borders from the value
            if (DIMENSION_NAMES[name]) {
              var D = name.capitalize(), dim = parseFloat(value) || 0;
              if (dim !== element['offset' + D]) return Fuse.String(dim + 'px');
              return Fuse.String(Element['_getCss' + D](element) + 'px');
            }
            return Fuse.String(value);
          };
        }
        else { // Firefox, Safari, Opera 9.5+
          getStyle = function getStyle(element, name) {
            element = $(element);
            name = Fuse.String(name).camelize();
            return _isNull(element, name) ? null : _getComputedStyle(element, name);
          };
        }
        return getStyle;
      })() :

      // IE
      (function() {
        var RELATIVE_CSS_UNITS = { 'em': 1, 'ex': 1 };

        // We need to insert into element a span with the M character in it.
        // The element.offsetHeight will give us the font size in px units.
        // Inspired by Google Doctype:
        // http://code.google.com/p/doctype/source/browse/trunk/goog/style/style.js#1146
        var span = Fuse._doc.createElement('span');
        span.style.cssText = 'position:absolute;visibility:hidden;height:1em;lineHeight:0;padding:0;margin:0;border:0;';
        span.innerHTML = 'M';

        function getStyle(element, name) {
          var value;
          if (name == 'opacity') {
            value = String(Element.getOpacity(element));
            if (value.indexOf('.') < 0) value += '.0';
            return Fuse.String(value);
          }

          element = $(element);
          name = Fuse.String(name).camelize();
          name = FLOAT_TRANSLATIONS[name] || name;

          // get cascaded style
          var s = element.currentStyle || element.style;
          value = s[name];
          if (value === 'auto') {
            if (DIMENSION_NAMES[name] && s.display !== 'none')
              return Fuse.String(element['offset' + name.capitalize()] + 'px');
            return null;
          }

          // If the unit is something other than a pixel (em, pt, %),
          // set it on something we can grab a pixel value from.
          // Inspired by Dean Edwards' comment
          // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
          if (/^\d+(\.\d+)?(?!px)[%a-z]+$/i.test(value)) {
            if (name == 'fontSize') {
              var unit = value.match(/\D+$/)[0];
              if (unit === '%') {
                var size = element.appendChild(span).offsetHeight;
                element.removeChild(span);
                return Math.round(size) + 'px';
              }
              else if (RELATIVE_CSS_UNITS[unit])
                element = element.parentNode;
            }

            // backup values
            var pos = Fuse.String(name == 'height' ? 'top' : 'left'),
             stylePos = element.style[pos], runtimePos = element.runtimeStyle[pos];

            // set runtimeStyle so no visible shift is seen
            element.runtimeStyle[pos] = s[pos];
            element.style[pos] = value;
            value = element.style['pixel' + pos.capitalize()] + 'px';

            // revert changes
            element.style[pos] = stylePos;
            element.runtimeStyle[pos] = runtimePos;
          }
          return Fuse.String(value);
        }
        return getStyle;
      })();

    // prevent JScript bug with named function expressions
    var setStyle = null;
  })(Element.Methods);

  /*--------------------------------------------------------------------------*/

  (function(methods) {
    methods.getDimensions = function getDimensions(element, options) {
      return {
        'width': Element.getWidth(element, options),
        'height': Element.getHeight(element, options)
      }
    };

    methods.isVisible = function isVisible(element) {
      if (!Fuse._body) return false;

      var isVisible = function isVisible(element) {
        // handles IE and the fallback solution
        element = $(element);
        var style = element.currentStyle;
        return style !== null && (style || element.style).display !== 'none' &&
          !!(element.offsetHeight || element.offsetWidth);
      };

      if (Feature('ELEMENT_COMPUTED_STYLE')) {
        isVisible = function isVisible(element) {
          element = $(element);
          var style = element.ownerDocument.defaultView.getComputedStyle(element, null);
          return !!(style && (element.offsetHeight || element.offsetWidth));
        };
      }

      if (Bug('TABLE_ELEMENTS_RETAIN_OFFSET_DIMENSIONS_WHEN_HIDDEN')) {
        var __isVisible = isVisible;
        isVisible = function isVisible(element) {
          element = $(element);
          if (__isVisible(element)) {
            var nodeName = getNodeName(element);
            if ((nodeName === 'THEAD' || nodeName === 'TBODY' || nodeName === 'TR') &&
               (element = element.parentNode))
              return Element.isVisible(element);
            return true;
          }
          return false;
        };
      }

      // redefine method and execute
      return (Element.isVisible = methods.isVisible = isVisible)(element);
    };

    // prevent JScript bug with named function expressions
    var getDimensions = null, isVisible = null;
  })(Element.Methods);

  /*--------------------------------------------------------------------------*/

  // define Element#getWidth and Element#getHeight
  (function(methods) {
    var i      = 0,
     getStyle  = methods.getStyle,
     isVisible = methods.isVisible,
     toFloat   = parseFloat,

    PRESETS = {
      'box':     { 'border':  1, 'margin':  1, 'padding': 1 },
      'visual':  { 'border':  1, 'padding': 1 },
      'client':  { 'padding': 1 },
      'content': {  }
    };

    while (i < 2) (function() {
      var borderA, borderB, marginA, marginB, paddingA, paddingB,
       dim        = i ? 'Width' : 'Height',
       methodName = 'get' + dim,
       property   = 'offset' + dim;

      // set style property names
      if (i++) {
        borderA  = 'borderLeftWidth'; borderB  = 'borderRightWidth';
        marginA  = 'marginLeft';      marginB  = 'marginRight';
        paddingA = 'paddingLeft';     paddingB = 'paddingRight';
      }  else {
        borderA  = 'borderTopWidth';  borderB  = 'borderBottomWidth';
        marginA  = 'marginTop';       marginB  = 'marginBottom';
        paddingA = 'paddingTop';      paddingB = 'paddingBottom';
      }

      function getHeightWidth(element, options) {
        var backup, result, s;

        // default to `visual` preset
        if (options) {
          if (isString(options)) options = PRESETS[options];
        } else options = PRESETS.visual;

        // First get our offset(Width/Height) (visual)
        // offsetHeight/offsetWidth properties return 0 on elements
        // with display:none, so show the element temporarily
        if (!isVisible(element)) {
          s = element.style; backup = s.cssText;
          s.cssText += ';display:block;visibility:hidden;';
          result = element[property];
          s.cssText = backup;
        }
        else result = element[property];

        // add margins because they're excluded from the offset values
        if (options.margin)
          result += (toFloat(getStyle(element, marginA)) || 0) +
            (toFloat(getStyle(element, marginB)) || 0);

        // subtract border and padding because they're included in the offset values
        if (!options.border)
          result -= (toFloat(getStyle(element, borderA)) || 0) +
            (toFloat(getStyle(element, borderB)) || 0);

        if (!options.padding)
          result -= (toFloat(Element.getStyle(element, paddingA)) || 0) +
            (toFloat(getStyle(element, paddingB)) || 0);

        return Fuse.Number(result);
      }

      methods[methodName] = getHeightWidth;
    })();

    i = undef;
  })(Element.Methods);

  /*--------------------------------------------------------------------------*/
