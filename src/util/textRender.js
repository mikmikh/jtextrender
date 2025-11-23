import { jraycast } from "./jrays.js";

export function createView(vsize, val = " ") {
  const [width, height] = vsize;
  return [...new Array(height)].map((r) =>
    [...new Array(width)].map(() => val)
  );
}
function wpos2cell(wpos, wsize) {
  return wpos.map((v, i) => Math.floor(wpos[i] * wsize[i]));
}
export function textDrawLine(vpos0, vpos1, vdata, vsize, value = "#") {
  const cells = jraycast(vpos0, vpos1, vsize);
  cells.forEach(([x, y]) => {
    vdata[y][x] = value;
  });
}

export function textDrawTri(tri, vdata, vsize, nsize = [1, 1], value = "#") {
  // console.log(tri);
  const [p0, p1, p2] = tri.map((p) => [
    (p[0] / nsize[0]) * vsize[0],
    (p[1] / nsize[1]) * vsize[0],
  ]);
  textDrawLine(p0, p1, vdata, vsize, value);
  textDrawLine(p0, p2, vdata, vsize, value);
  textDrawLine(p1, p2, vdata, vsize, value);
}

export function textRenderGrid(
  vdata,
  vsize,
  vcolor = null,
  viewElSelector = "#view"
) {
  const viewEl = document.querySelector(viewElSelector);
  viewEl.innerHTML = "";
  viewEl.style = `
    grid-template-rows: repeat(${vsize[0]}, 1fr);
    grid-template-columns: repeat(${vsize[1]}, 1fr);
    `;
  vdata.forEach((r, ri) => {
    r.forEach((v, ci) => {
      const span = document.createElement("span");
      if (vcolor && vcolor[ri][ci]) {
        span.style.color = vcolor[ri][ci];
      }
      span.textContent = v;
      viewEl.appendChild(span);
    });
  });
}

function checkInside(x, y, size) {
  return x >= 0 && x < size[0] && y >= 0 && y < size[1];
}

// p0
// | \
// p1 \
//   ` p2
export function textFillTriTex(tri, nsize, vsize, tcoords) {
  // sort by y
  const orderY = [...new Array(tri.length)]
    .map((_, i) => i)
    .sort((li, ri) => tri[li][1] - tri[ri][1]);
  // clip to grid
  const [p0, p1, p2] = orderY
    .map((pi) => tri[pi])
    .map((p) => [(p[0] / nsize[0]) * vsize[0], (p[1] / nsize[1]) * vsize[0]]);
  const [t0, t1, t2] = orderY.map((pi) => tcoords[pi]);
  // interpolate before middle
  const result = [];
  for (let y = p0[1]; y < p1[1]; y++) {
    const yc = Math.floor(y);
    const frac1 = (y - p0[1]) / (p1[1] - p0[1]);
    const frac2 = (y - p0[1]) / (p2[1] - p0[1]);
    const x1 = (1 - frac1) * p0[0] + frac1 * p1[0];
    const x2 = (1 - frac2) * p0[0] + frac2 * p2[0];
    const xsorted = x1 < x2 ? [x1, x2] : [x2, x1];
    const uv1 = t0.map((_, vi) => (1 - frac1) * t0[vi] + frac1 * t1[vi]);
    const uv2 = t0.map((_, vi) => (1 - frac2) * t0[vi] + frac2 * t2[vi]);
    const uvsorted = x1 < x2 ? [uv1, uv2] : [uv2, uv1];
    for (let x = xsorted[0]; x < xsorted[1]; x++) {
      const xc = Math.floor(x);
      if (!checkInside(xc, yc, vsize)) {
        continue;
      }
      const pos = [xc, yc];
      const uvfrac = (x - xsorted[0]) / (xsorted[1] - xsorted[0]);
      const uv = uvsorted[0].map((_,i) => (1 - uvfrac) * uvsorted[0][i] + uvfrac * uvsorted[1][i]);
      result.push({ pos, uv });
    }
  }
  // interpolate after middle
  for (let y = p1[1]; y < p2[1]; y++) {
    const yc = Math.floor(y);
    const frac1 = (y - p1[1]) / (p2[1] - p1[1]);
    const frac2 = (y - p0[1]) / (p2[1] - p0[1]);
    const x1 = (1 - frac1) * p1[0] + frac1 * p2[0];
    const x2 = (1 - frac2) * p0[0] + frac2 * p2[0];
    const xsorted = x1 < x2 ? [x1, x2] : [x2, x1];
    const uv1 = t0.map((_, vi) => (1 - frac1) * t1[vi] + frac1 * t2[vi]);
    const uv2 = t0.map((_, vi) => (1 - frac2) * t0[vi] + frac2 * t2[vi]);
    const uvsorted = x1 < x2 ? [uv1, uv2] : [uv2, uv1];
    for (let x = xsorted[0]; x < xsorted[1]; x++) {
      const xc = Math.floor(x);
      if (!checkInside(xc, yc, vsize)) {
        continue;
      }
      const pos = [xc, yc];
      const uvfrac = (x - xsorted[0]) / (xsorted[1] - xsorted[0]);
      const uv = uvsorted[0].map((_,i) => (1 - uvfrac) * uvsorted[0][i] + uvfrac * uvsorted[1][i]);
      result.push({ pos, uv });
    }
  }
  return result;
}
