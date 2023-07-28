// @flow

/*:: export type Position = [number, number]; */
/*:: export type LineRing = Array<Position>; */

/*:: export type Point = {|
  type: 'Point',
  coordinates: Position,
  bbox?: Array<number>,
  crs?: { type: string, properties: mixed }
|}; */

/*:: export type MultiPoint = {|
  type: 'MultiPoint',
  coordinates: Array<Position>,
  bbox?: Array<number>,
  crs?: { type: string, properties: mixed }
|}; */

/*:: export type LineString = {|
  type: 'LineString',
  coordinates: Array<Position>,
  bbox?: Array<number>,
  crs?: { type: string, properties: mixed }
|}; */

/*:: export type MultiLineString = {|
  type: 'MultiLineString',
  coordinates: Array<Array<Position>>,
  bbox?: Array<number>,
  crs?: { type: string, properties: mixed }
|}; */

/*:: export type Polygon = {|
  type: 'Polygon',
  coordinates: Array<LineRing>,
  bbox?: Array<number>,
  crs?: { type: string, properties: mixed }
|}; */

/*:: export type MultiPolygon = {|
  type: 'MultiPolygon',
  coordinates: Array<Array<LineRing>>,
  bbox?: Array<number>,
  crs?: { type: string, properties: mixed }
|}; */

/*:: export type GeometryTypes =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon'
  | 'GeometryCollection'; */

/*:: export type Geometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon; */

/*:: export type GeometryCollection = {|
  type: 'GeometryCollection',
  geometries: Array<Geometry>,
  bbox?: Array<number>,
  crs?: { type: string, properties: mixed }
|}; */

/*:: export type Feature<T: Geometry> = {|
  type: 'Feature',
  geometry: T,
  properties: ?{ [key: string]: ?mixed },
  bbox?: Array<number>,
  crs?: { type: string, properties: mixed }
|}; */

/*:: export type FeatureCollection = {|
  type: 'FeatureCollection',
  features: Array<Feature<Geometry>>,
  bbox?: Array<number>,
  crs?: { type: string, properties: mixed }
|}; */
