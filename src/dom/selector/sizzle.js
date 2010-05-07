  /*---------------------------- SELECTOR: SIZZLE ----------------------------*/

  (function(object, NodeList) {
    var match = function match(element, selectors) {
      return Sizzle(String(selectors || ''), null, null,
        [element.raw || fuse(element).raw]).length === 1;
    },

    query = function(selectors, context, callback, List) {
      var node, i = -1, result = Sizzle(String(selectors || ''),
        context && fuse(context).raw || fuse._doc, List);
      if (callback) {
        while (node = result[++i]) callback(node);
      }
      return result;
    },

    select = function select(selectors, context, callback) {
      return query(selectors, context, callback, NodeList());
    };

    object.match = match;
    object.select = select;

  })(fuse.dom.selector, fuse.dom.NodeList);
