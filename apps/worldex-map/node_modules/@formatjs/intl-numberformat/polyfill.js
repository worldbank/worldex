"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("./src/core");
var to_locale_string_1 = require("./src/to_locale_string");
var ecma402_abstract_1 = require("@formatjs/ecma402-abstract");
var should_polyfill_1 = require("./should-polyfill");
if ((0, should_polyfill_1.shouldPolyfill)()) {
    (0, ecma402_abstract_1.defineProperty)(Intl, 'NumberFormat', { value: core_1.NumberFormat });
    (0, ecma402_abstract_1.defineProperty)(Number.prototype, 'toLocaleString', {
        value: function toLocaleString(locales, options) {
            return (0, to_locale_string_1.toLocaleString)(this, locales, options);
        },
    });
}
