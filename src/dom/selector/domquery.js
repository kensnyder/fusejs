  /*--------------------------- SELECTOR: DOMQUERY ---------------------------*/

  (function(object, NodeList) {
    var match = function match(element, selectors) {
      element = element.raw || fuse(element).raw;
      var node, i = -1, result = Ext.DomQuery.select(String(selectors || ''),
        fuse.getDocument(element));

      while (node = result[++i]) {
        if (node === element) return true;
      }
      return false;
    },

    query = function(selectors, context, callback, toList) {
      var node, i = -1, result = toList(Ext.DomQuery.select(String(selectors || ''),
        context && fuse(context).raw || fuse._doc));
      if (callback) {
        while (node = result[++i]) callback(node);
      }
      return result;
    },

    select = function select(selectors, context, callback) {
      return query(selectors, context, callback, NodeList.fromNodeList);
    };

    object.match = match;
    object.select = select;

  })(fuse.dom.selector, fuse.dom.NodeList);
