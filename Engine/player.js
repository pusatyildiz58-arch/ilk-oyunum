// Player is created in index.html makePlayer() - no duplicate mesh needed
function createPlayer(scene) {
  // Return existing player reference instead of creating a duplicate
  if (typeof PL !== 'undefined' && PL.g) return PL.g;
  return null;
}

function updatePlayer(player) {
  // Player movement handled by updatePlayer() in index.html
}