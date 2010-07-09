  (function(plugin) {

		fuse.dom.dataStores = {};

    plugin.setData = function setData(key, value) {
			var id, p;
      if (arguments.length == 1) {
				for (p in key) {
					if (!key.hasOwnProperty(p)) {
						continue;
					}
					this.setData(p, key[p]);
				}
			}
			else {
				id = this.identify();
				if (!(id in fuse.dom.dataStores)) {
					fuse.dom.dataStores[id] = {};
				}
				fuse.dom.dataStores[id][expando + key] = value;
			}
			return this;
    };

    plugin.getData = function getData(key) {
			var id = this.identify();
			if (!(id in fuse.dom.dataStores)) {
				return undefined;
			}
			return fuse.dom.dataStores[id][expando + key];
    };

    plugin.unsetData = function unsetData(key) {
			var id = this.identify();
			if (id in fuse.dom.dataStores) {
				delete fuse.dom.dataStores[id][expando + key];
			}
			return this;
    };

    // prevent JScript bug with named function expressions
    var setData = nil,
      getData =   nil,
			unsetData = nil;
  })(Element.plugin);