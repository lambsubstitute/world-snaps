# World Snaps

Anya's Christmas 2026 game. A third-person selfie hunt through one cartoon city stitched together from famous streets around the world. At each of the 14 stops a celebrity waits beside a landmark: walk up, take a selfie, and it goes into her album as a polaroid. A full album shows a Christmas message.

## Play locally

```bash
python3 -m http.server 8811 -d world-snaps
```

Then open http://localhost:8811. The page has no build step. Three.js 0.160 loads from jsDelivr and the fonts (Baloo 2, Caveat) from Google Fonts.

Controls: WASD or the arrow keys to walk, Shift to run, drag to look, Q/E to turn the camera, mouse wheel to zoom, Space for a selfie, M for the map, B for the album. On a phone, the left thumb is a joystick, dragging on the right side turns the camera, and a camera button appears near each celebrity.

## Files

| File | What's in it |
|---|---|
| `index.html` | Page, HUD, title screen, album, map, ending, all CSS |
| `js/stops.js` | **The content.** The 14 stops (street, city, landmark, celebrity, their look, what they say, where they stand), Anya's look, and the ending message |
| `js/world.js` | Builds the city: grid cells, ground textures, roads, building rows by style, props, collision |
| `js/landmarks.js` | One builder per stop: the landmark and its surroundings |
| `js/characters.js` | The chibi character rig shared by Anya and every celebrity |
| `js/kit.js` | Toon materials, primitive helpers, canvas textures, water |
| `js/main.js` | Game loop, controls, camera, selfie framing and capture, save, HUD |

## How the city fits together

Each stop is a 60 m cell on a 5 by 3 grid, walked in a snake: Budapest to New York along the top row, back from Rome to Los Angeles, then Rio to Sydney. Cells open onto the previous and next stop. The other sides are lined with buildings, a railing (where a landmark sits beyond it) or nothing. Big landmarks sit outside the grid. They only show when you're at that stop or next door, so the pyramids never photobomb the Taj Mahal.

To swap a stop, edit its entry in `js/stops.js` and its builder in `js/landmarks.js` (keyed by `id`). `spot` is where the celebrity stands. `look` is the point the selfie camera frames; it widens its view until that point fits.

## Things to change before Christmas

- **Anya's look:** `ANYA_LOOK` in `js/stops.js` is a placeholder (long brown hair, pink jacket, jeans). Update it from family photos: skin, hair style and colour, outfit colours.
- **Ending message:** `ENDING_MESSAGE` in `js/stops.js` is a placeholder for the family to rewrite.

## Save data

The album is saved in the browser's `localStorage` under `worldSnaps.v1` (the photos are JPEG data URLs, about 60 KB each). "Start over" in the album clears it.

## Testing helpers

`window.__snaps` in the browser console: `goto(i)` jumps to stop `i`, `snap()` takes a selfie when close enough, and `walkable(x, z)` checks collision.
