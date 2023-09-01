/* eslint-disable */
const lat = /[-+]?(?:[1-8]?\d(?:\.\d+)?|90(?:\.0+)?)/; // range ±90
const lon = /[-+]?(?:180(?:\.0+)?|(?:1[0-7]\d|[1-9]?\d)(?:\.\d+)?)/; // range ±180
const zoom = /(?:22(?:\.0+)?|(?:(?:[1]?[0-9]|(?:2[0-1]?))(?:\.\d{0,2}))?)/; // range 0-22
export const AT = new RegExp(`^(?<latitude>${lat.source})\s*,\s*(?<longitude>${lon.source})(?:\s*,\s*(?<zoom>${zoom.source})z)?$`);
