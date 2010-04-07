  /*---------------------------- SELECTOR: SLICK -----------------------------*/

  (function(object, NodeList) {
    var match = function match(element, selectors) {
      return !!Slick.find(fuse.getDocument(element.raw || fuse.get(element).raw),
        String(selectors || ''))
    },

    query = function(selectors, context, callback, List) {
      var node, i = -1, results = Slick.search(context && fuse.get(context).raw || fuse._doc,
        String(selectors || ''), List);
      if (callback) {
        while (node = results[++i]) callback(node);
      }
      return results;
    },

    select = function select(selectors, context, callback) {
      return query(selectors, context, callback, NodeList());
    };

    object.match = match;
    object.select = select;

  })(fuse.dom.selector, fuse.dom.NodeList);
