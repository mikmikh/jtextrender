//          top
//    0,1,1-------1,1,1
//      / |      /|
//  0,1,0---1,1,0 |   / north
// west| 0,0,1_|__|1,0,1
//     |/      | /      -> east
//   0,0,0-----1,0,0
//       /  |
//   south  v

// 0,0 - 1,0
//  | tex |
// 1,0 - 1,1
import { tri2normal } from "./jmat.js";

//        bottom
export function createBoxTris() {
  const tris = [
    // south
    [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
    // east
    [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
    [
      [1, 0, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
    // north
    [
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    [
      [1, 0, 1],
      [0, 1, 1],
      [0, 0, 1],
    ],
    // west
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
    // top
    [
      [0, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
    ],
    [
      [0, 1, 0],
      [1, 1, 1],
      [1, 1, 0],
    ],
    // bottom
    [
      [0, 0, 1],
      [0, 0, 0],
      [1, 0, 0],
    ],
    [
      [0, 0, 1],
      [1, 0, 0],
      [1, 0, 1],
    ],
  ];
  return tris;
}
function createQuadTextureCoords() {
  const res = [
    // south
    [
      [0, 1],
      [0, 0],
      [1, 0],
    ],
    [
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  ]
  return res.flat();
}
function createBoxTextureCoords() {
  return [...new Array(6)].map(() => createQuadTextureCoords()).flat();
}

//          top
//    0,1,1-------1,1,1
//      / |      /|
//  0,1,0---1,1,0 |   / north
// west| 0,0,1_|__|1,0,1
//     |/      | /      -> east
//   0,0,0-----1,0,0
//       /  |
//   south  v
//        bottom
export function createBoxGeo() {
    const tris = createBoxTris();
    const vertices = tris.flat();
    const normals = tris.map((tri) => {
        const normal = tri2normal(tri);
        return [normal, normal, normal];
    }).flat();
    const idxs = [...new Array(vertices.length)].map((_,i) => i);
    const nidxs = [...new Array(vertices.length)].map((_,i) => i);
    const textureCoords = createBoxTextureCoords();
    return {vertices, normals, idxs, nidxs, textureCoords};
}
function combineGeo(geos) {
    const idxOffsets = [0];
    geos.forEach((geo) => {
        idxOffsets.push(geo.idxs.length+idxOffsets[idxOffsets.length-1]);
    });
    const res = {
        vertices: geos.map((g)=>g.vertices).flat(),
        normals: geos.map((g)=>g.normals).flat(),
        idxs: geos.map((g, gi)=>g.idxs.map(idx => idx+idxOffsets[gi])).flat(),
        nidxs: geos.map((g, gi)=>g.nidxs.map(idx => idx+idxOffsets[gi])).flat(),
        textureCoords: geos.map((g)=>g.textureCoords).flat(),
    };
    return res;
}
export function createBoxGeoGrid() {
    const boxGeo0 = createBoxGeo();
    const boxGeo1 = createBoxGeo();
    boxGeo0.vertices.forEach((v) => {
        v[0]*=0.75;
        v[1]*=0.75;
        v[2]*=0.75;
        v[0]-=1;
    });
    boxGeo1.vertices.forEach((v) => {
        v[0]+=1;
    });
    return combineGeo([boxGeo0, boxGeo1]);
}
