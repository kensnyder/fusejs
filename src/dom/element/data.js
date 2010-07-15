  (function (plugin) {

    fuse.dom.data = fuse.dom.data || {};

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
        id = this.getFuseId();
        if (!(id in fuse.dom.data)) {
          fuse.dom.data[id] = {
            user: {}
          };
        }
        fuse.dom.data[id].user[uid + key] = value;
      }
      return this;
    };

    plugin.getData = function getData(key) {
      var id = this.getFuseId();
      if (!(id in fuse.dom.data)) {
      return undefined;
      }
      return fuse.dom.data[id].user[uid + key];
    };

    plugin.unsetData = function unsetData(key) {
      var id = this.getFuseId();
      if (id in fuse.dom.data) {
        delete fuse.dom.data[id].user[uid + key];
      }
      return this;
    };

    // prevent JScript bug with named function expressions
    var setData = nil,
      getData = nil,
      unsetData = nil;
  })(Element.plugin);