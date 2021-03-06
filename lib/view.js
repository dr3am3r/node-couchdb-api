/**
 * ### View API
 *
 * A `View` object represents a single view within a design document
 *
 *     var view = ddoc.view("my-view-name");
 */
var client = require("./client"),
    doc    = require("./document"),
    prototype  = Object.create(client);

/**
 * Gets/sets the name as part of the URL
 *
 * @property name
 */
Object.defineProperty(prototype, "name", {
    get: function () {
        return this._url.path.split("/")[5];
    },
    set: function (v) {
        var path = this._url.path.split("/");
        path[5] = v;
        this._url.path = this._url.pathname = path.join("/");
    }
});

/**
 * Perform a generic query against a stored view
 *
 * @http GET /db/ddoc/_view/view
 *
 * @param {Object} [query]        If only one of the optional params is provided, this is assumed to be the one
 * @param {Array|Various} [data]  Array = pass as `keys` in body, Various = pass as complete body
 * @param {Function} callback
 *
 * @return {View} chainable
 */
prototype.query = function (query, data, callback) {
    if (typeof query === "function") {
        callback = query;
        data     = null;
        query    = null;
    }
    if (typeof data === "function") {
        callback = data;
        data = null;
    }

    var opts = { query: query || {} };

    if (data) {
        return this._post(opts, Array.isArray(data) ? { keys: data } : data, callback);
    } else {
        return this._get(opts, callback);
    }
};

/**
 * Perform a map query against a stored view
 *
 * @http GET /db/ddoc/_view/view
 *
 * @param {Object} [query]
 * @param {Function} callback
 *
 * @return {View} chainable
 */
prototype.map = function (query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = {};
    }

    query.reduce = false;

    return this.query(query, callback);
};

/**
 * Perform a reduce query against a stored view
 *
 * @http GET /db/ddoc/_view/view
 *
 * @param {Object} [query]
 * @param {Function} callback
 *
 * @return {View} chainable
 */
prototype.reduce = function (query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = {};
    }

    query.reduce = true;

    return this.query(query, callback);
};

/**
 * Execute a list function for the current document
 *
 * @http GET /db/_design/design-doc/_list/list-name/doc
 *
 * @param {String} list        The name of the list function in the above design document
 *                             `ddoc/list` ...or... `list` if using same design document as this view
 * @param {Object} [query]
 * @param {Function} callback
 *
 * @return {View} chainable
 */
prototype.list = function (list, query, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = null;
    }
    if (typeof query === "function") {
        callback = query;
        options = null;
        query = null;
    }

    var list_ddoc, view, path, url;

    if (list.indexOf("/") > -1) {
        list = list.split("/");
        list_ddoc = list.shift();
        list = list.join("/");
        view = this.ddoc.name + "/" + this.name;
    } else {
        list_ddoc = this.ddoc.name;
        view = this.name;
    }

    path = ["", this.db.name, "_design", list_ddoc, "_list", list, view];
    url = {
        replace: true,
        pathname: path.join("/")
    };

    if (query) {
        url.query = query;
    }

    options = options || {};
    if (!("json" in options)) {
        options.json = false;
    }

    return this._get(url, options, callback);
};

/*!
 * Create a new view object
 *
 * @param {DesignDocument} ddoc
 * @param {String} name
 *
 * @return {View}
 */
exports.create = function (ddoc, name) {
    var view = Object.create(prototype);

    view.ddoc = ddoc;
    view.db = ddoc.db;
    view.server = ddoc.server;
    view.url = ddoc.url + "/_view/" + encodeURIComponent(name);
    view.debug = ddoc.debug;

    return view;
};
