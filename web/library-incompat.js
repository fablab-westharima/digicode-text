// Matching a configured dependency against the incompatibility rows the compiler serves.
// The rows are not fetched here: GET /boards carries the ones that apply to each board
// (incompatibleLibraries), so the selected board's entry is the browser's only source and the
// Libraries view, the Build output and the AI's board sentence all read the same list.
// The table itself is written once, in compiler/library-incompat.mjs.

const key = p => `${p.owner}/${p.name}`.toLowerCase();

/** The row saying this library does not build on this board, or null. */
export function incompatibleRow(board, library) {
  return board?.incompatibleLibraries?.find(row => row.library.toLowerCase() === key(library)) ?? null;
}

/** The rows for the dependencies configured on this board, in the order they are configured. */
export function incompatibleDependencies(board, libraries) {
  return libraries.map(p => incompatibleRow(board, p)).filter(Boolean);
}
