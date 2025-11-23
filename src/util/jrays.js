
function isCellInSize(cell, size) {
  return cell[0] >= 0 && cell[0] < size[0] && cell[1] >= 0 && cell[1] < size[1];
}
export function jraycast(vRayStart, vRayEnd, mapSize) {
  const vRayDir_ = [vRayEnd[0] - vRayStart[0], vRayEnd[1] - vRayStart[1]];
  const fMaxDistance = Math.sqrt(
    vRayDir_[0] * vRayDir_[0] + vRayDir_[1] * vRayDir_[1]
  );
  const vRayDir = vRayDir_.map((v) => (v === 0 ? 1e-5 : v / fMaxDistance));
  const drdc = vRayDir_[0] / vRayDir_[1];
  const dcdr = vRayDir_[1] / vRayDir_[0];
  const vRayUnitStepSize = [
    Math.sqrt(1 + dcdr * dcdr),
    Math.sqrt(1 + drdc * drdc),
  ];
  const vMapCheck = vRayStart.map((v) => Math.floor(v));
  const vRayLength1D = [0, 0];
  const vStep = [0, 0];

  if (vRayDir[1] < 0) {
    vStep[1] = -1;
    vRayLength1D[1] = (vRayStart[1] - vMapCheck[1]) * vRayUnitStepSize[1];
  } else {
    vStep[1] = 1;
    vRayLength1D[1] = (vMapCheck[1] + 1 - vRayStart[1]) * vRayUnitStepSize[1];
  }

  if (vRayDir[0] < 0) {
    vStep[0] = -1;
    vRayLength1D[0] = (vRayStart[0] - vMapCheck[0]) * vRayUnitStepSize[0];
  } else {
    vStep[0] = 1;
    vRayLength1D[0] = (vMapCheck[0] + 1 - vRayStart[0]) * vRayUnitStepSize[0];
  }

  let fDistance = 0.0;
  let side = 0;
  const cells = [];
  while (fDistance < fMaxDistance) {
    if (isCellInSize(vMapCheck, mapSize)) {
        cells.push([...vMapCheck]);
    }
    if (vRayLength1D[1] < vRayLength1D[0]) {
      vMapCheck[1] += vStep[1];
      fDistance = vRayLength1D[1];
      vRayLength1D[1] += vRayUnitStepSize[1];
      side = 1;
    } else {
      vMapCheck[0] += vStep[0];
      fDistance = vRayLength1D[0];
      vRayLength1D[0] += vRayUnitStepSize[0];
      side = 0;
    }
  }

  return cells;
}
