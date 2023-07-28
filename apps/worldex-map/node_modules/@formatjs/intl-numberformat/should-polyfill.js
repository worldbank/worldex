"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldPolyfill = void 0;
var intl_localematcher_1 = require("@formatjs/intl-localematcher");
var supported_locales_1 = require("./supported-locales");
/**
 * Check if this is old Node that only supports en
 * @returns
 */
function onlySupportsEn() {
    return (!Intl.NumberFormat.polyfilled &&
        !Intl.NumberFormat.supportedLocalesOf(['es']).length);
}
/**
 * Check if Intl.NumberFormat is ES2020 compatible.
 * Caveat: we are not checking `toLocaleString`.
 *
 * @public
 * @param unit unit to check
 */
function supportsES2020() {
    try {
        var s = new Intl.NumberFormat('en', {
            style: 'unit',
            unit: 'bit',
            unitDisplay: 'long',
            notation: 'scientific',
        }).format(10000);
        // Check for a plurality bug in environment that uses the older versions of ICU:
        // https://unicode-org.atlassian.net/browse/ICU-13836
        if (s !== '1E4 bits') {
            return false;
        }
    }
    catch (e) {
        return false;
    }
    return true;
}
function supportedLocalesOf(locale) {
    if (!locale) {
        return true;
    }
    var locales = Array.isArray(locale) ? locale : [locale];
    return Intl.NumberFormat.supportedLocalesOf(locales).length === locales.length;
}
function shouldPolyfill(locale) {
    if (locale === void 0) { locale = 'en'; }
    if (typeof Intl === 'undefined' ||
        !('NumberFormat' in Intl) ||
        !supportsES2020() ||
        onlySupportsEn() ||
        !supportedLocalesOf(locale)) {
        return locale ? (0, intl_localematcher_1.match)([locale], supported_locales_1.supportedLocales, 'en') : undefined;
    }
}
exports.shouldPolyfill = shouldPolyfill;
