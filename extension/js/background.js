!function (m) {
    /**
     * @param {number} i
     * @return {?}
     */
    function t(i) {
        if (n[i]) {
            return n[i].exports;
        }
        var module = n[i] = {
            i: i,
            l: false,
            exports: {}
        };
        return m[i].call(module.exports, module, module.exports, t), module.l = true, module.exports;
    }
    var n = {};
    t.m = m;
    t.c = n;
    /**
     * @param {!Function} d
     * @param {string} name
     * @param {!Function} n
     * @return {undefined}
     */
    t.d = function (d, name, n) {
        if (!t.o(d, name)) {
            Object.defineProperty(d, name, {
                enumerable: true,
                get: n
            });
        }
    };
    /**
     * @param {!Object} x
     * @return {undefined}
     */
    t.r = function (x) {
        if ("undefined" != typeof Symbol && Symbol.toStringTag) {
            Object.defineProperty(x, Symbol.toStringTag, {
                value: "Module"
            });
        }
        Object.defineProperty(x, "__esModule", {
            value: true
        });
    };
    /**
     * @param {number} val
     * @param {number} byteOffset
     * @return {?}
     */
    t.t = function (val, byteOffset) {
        if (1 & byteOffset && (val = t(val)), 8 & byteOffset) {
            return val;
        }
        if (4 & byteOffset && "object" == typeof val && val && val.__esModule) {
            return val;
        }
        /** @type {!Object} */
        var d = Object.create(null);
        if (t.r(d), Object.defineProperty(d, "default", {
            enumerable: true,
            value: val
        }), 2 & byteOffset && "string" != typeof val) {
            var s;
            for (s in val) {
                t.d(d, s, function (attrPropertyName) {
                    return val[attrPropertyName];
                }.bind(null, s));
            }
        }
        return d;
    };
    /**
     * @param {!Object} module
     * @return {?}
     */
    t.n = function (module) {
        /** @type {function(): ?} */
        var n = module && module.__esModule ? function () {
            return module.default;
        } : function () {
            return module;
        };
        return t.d(n, "a", n), n;
    };
    /**
     * @param {!Function} property
     * @param {string} object
     * @return {?}
     */
    t.o = function (property, object) {
        return Object.prototype.hasOwnProperty.call(property, object);
    };
    /** @type {string} */
    t.p = "";
    t(t.s = 5);
}({
    5: function (formatters, customFormatters) {
        chrome.action.onClicked.addListener((message) => {
            console.log(message);
            chrome.scripting.executeScript({
                target: {
                    tabId: message.id
                },
                files: ["js/main.js"]
            });
        });
    }
});  