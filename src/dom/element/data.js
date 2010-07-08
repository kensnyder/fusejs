  (function(plugin) {

		fuse.dom.ids = {};

    plugin.setData = function setData(key, value) {
			var id, p;
      if (arguments.length == 2) {
				id = this.identify();
				if (!(id in fuse.dom.ids)) {
					fuse.dom.ids[id] = {};
				}
				fuse.dom.ids[id][expando + key] = value;
			}
			else {
				for (p in key) {
					this.setData(p, key[p]);
				}
			}
			return this;
    };

    plugin.getData = function getData(key) {
			var id = this.identify();
			if (!(id in fuse.dom.ids)) {
				return undefined;
			}
			return fuse.dom.ids[id][expando + key];
    };

    // prevent JScript bug with named function expressions
    var setData = nil,
      getData =   nil;
  })(Element.plugin);