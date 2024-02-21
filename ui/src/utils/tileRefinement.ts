// @ts-ignore
import { Tile2DHeader } from '@deck.gl/geo-layers';

// bit masks
export const TILE_STATE_VISITED = 1;
export const TILE_STATE_VISIBLE = 2;

// Walk up the tree until we find one ancestor that is loaded. Returns true if successful.
export function getPlaceholderInAncestors(startTile: Tile2DHeader) {
  let tile: Tile2DHeader | null = startTile;
  while (tile) {
    if (tile.isLoaded || tile.content) {
      tile.state! |= TILE_STATE_VISIBLE;
      return true;
    }
    tile = tile.parent;
  }
  return false;
}

// Recursively set children as placeholder
export function getPlaceholderInChildren(tile: Tile2DHeader) {
  for (const child of tile.children) {
    if (child.isLoaded || child.content) {
      child.state |= TILE_STATE_VISIBLE;
    } else {
      getPlaceholderInChildren(child);
    }
  }
}
