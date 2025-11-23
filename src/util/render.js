import {
  addV,
  createFrustrumPlanes,
  createProjectionMat,
  createRotationXMat,
  createRotationYMat,
  createRotationZMat,
  createScaleMat,
  createScreenMat,
  createTranslationMat,
  createViewMat,
  distToPlane,
  dotProduct,
  intersectLinePlane,
  lengthV,
  mulMatMat,
  mulMatVec,
  normalizeV,
  subV,
  vec4normalize,
} from "./jmat.js";
import { createView, textFillTriTex } from "./textRender.js";

export class JCamera {
  constructor(position = [0, 0, 0], pitch = 0, yaw = Math.PI / 2) {
    this.position = position;
    this.pitch = pitch;
    this.yaw = yaw;
    this.direction = [0, 0, 1];
  }
  update() {
    this.direction[0] = Math.cos(this.yaw) * Math.cos(this.pitch);
    this.direction[1] = Math.sin(this.pitch);
    this.direction[2] = Math.sin(this.yaw) * Math.cos(this.pitch);
  }
}
export class JRenderer {
  constructor(vsize = [64, 64], fov = Math.PI / 2, znear = 0.1, zfar = 5) {
    this.vsize = vsize;
    this.aspect = vsize[0] / vsize[1];
    this.fov = fov;
    this.znear = znear;
    this.zfar = zfar;

    this.light = {
      position: [1, 0, -1],
      ambient: 0.5,
    };

    // mat4
    this.frustrumPlanes = [];
    this.projMat = null;
    this.screenMat = null;
  }
  update() {
    this.frustrumPlanes = createFrustrumPlanes(this.znear, this.zfar);
    this.projMat = createProjectionMat(
      this.aspect,
      this.fov,
      this.znear,
      this.zfar
    );
    this.screenMat = createScreenMat(this.vsize[0], this.vsize[1], this.zfar);
  }

  // {position,scale,rotation,geometry: {v,t,n,f},material:{texture,color}}
  // camera: {position,direction}
  render(meshes, camera) {
    const vdata = createView(this.vsize, " ");
    const vcolor = createView(this.vsize, null);
    const viewMat = createViewMat(camera.position, camera.direction, [0, 1, 0]);
    const dists = meshes.map((mesh) =>
      lengthV(subV(camera.position, mesh.position))
    );
    const order = [...new Array(meshes.length)].map((_, i) => i);
    order.sort((lhs, rhs) => dists[rhs] - dists[lhs]);
    const posColors = order.map((mi) =>
      this.render_(meshes[mi], camera, viewMat)
    ).flat();
    posColors.sort((lhs,rhs) => rhs.z-lhs.z);
    posColors.forEach(({pos,color}) => {
      vdata[pos[1]][pos[0]] = "#";
      vcolor[pos[1]][pos[0]] = color;
    })
    return [vdata, vcolor];
  }
  render_(mesh, camera, viewMat) {
    const { scale, rotation, position, geometry, material } = mesh;
    // mesh Mat
    const scaleMat = createScaleMat(scale);
    let rotationMat = createScaleMat([1, 1, 1]);
    rotation.forEach((rot, ri) => {
      if (rot === 0) {
        return;
      }
      let rotMat = null;
      if (ri === 0) {
        rotMat = createRotationXMat(rot);
      } else if (ri === 1) {
        rotMat = createRotationYMat(rot);
      } else {
        rotMat = createRotationZMat(rot);
      }
      rotationMat = mulMatMat(rotationMat, rotMat);
    });
    const translationMat = createTranslationMat(position);
    // model Mat
    const rotScaleMat = mulMatMat(rotationMat, scaleMat);
    const modelMat = mulMatMat(translationMat, rotScaleMat);

    // modelMat do not require w normalization
    const normals = geometry.vn
      .map((vec3) => [...vec3, 0]) // direction vectors: w=0 - cannot be translated
      .map((vec4) => mulMatVec(modelMat, vec4));
    // .map((vec4) => vec4normalize(vec4));
    const vertexModel = geometry.v
      .map((vec3) => [...vec3, 1])
      .map((vec4) => mulMatVec(modelMat, vec4));
    // .map((vec4) => vec4normalize(vec4));

    const forder = [...new Array(geometry.f.length)].map((_, i) => i);
    const fcenters = geometry.f.map((vtns) => {
      const fcenter = vtns
        .map(([vi, ti, ni]) => geometry.v[vi])
        .reduce((s, v) => addV(s, v))
        .map((v) => v / 3);
      return fcenter;
    });
    const fdists = fcenters.map((fcenter) => {
      const dist = lengthV(subV(camera.position, fcenter));
      return dist;
    });
    forder.sort((lhs, rhs) => fdists[rhs] - fdists[lhs]);
    // TODO: init before render all meshes

    const result = [];
    forder.forEach((fi) => {
      const vtns = geometry.f[fi];
      const fvertexModel = vtns.map(([vi, ti, ni]) => vertexModel[vi]);
      const fuvs = vtns.map(([vi, ti, ni]) => geometry.vt[ti]);
      const dirToCam = subV(camera.position, fvertexModel[0]);
      const normalFromVertex = normals[vtns[0][2]];
      if (dotProduct(dirToCam, normalFromVertex) < 0) {
        // not facing camera
        return;
      }
      const fcenter = fcenters[fi];
      const lightDir = normalizeV(subV(this.light.position, fcenter));
      const lum = dotProduct(lightDir, normalFromVertex);

      const fview = fvertexModel.map((vec4) => mulMatVec(viewMat, vec4));
      const fproj = fview.map((vec4) => mulMatVec(this.projMat, vec4));
      const fprojNormalized = fproj
        .map((vec4) => vec4normalize(vec4))
        .map((v) => v.slice(0, 3));
      const fuvsw = fuvs.map((v, i) => [
        ...v.map((vv) => vv / fproj[i][3]),
        1 / fproj[i][3],
      ]);

      const fprojNormalizedSigned = fprojNormalized.map((vec3,vi) => vec3.map((v) => v*Math.sign(fproj[vi][3])))
      const fvertexUvsDebug = this.clipTri(fprojNormalizedSigned, fuvsw);

      fvertexUvsDebug.forEach(([fvertexUvs, debugColor]) => {
        const fvertexScreen = fvertexUvs[0]
          .map((vec3) => [...vec3, 1])
          .map((vec4) => mulMatVec(this.screenMat, vec4))
          .map((vec4) => vec4normalize(vec4));
        const fuvsw = fvertexUvs[1];

        const z = fvertexScreen.reduce((s,v) => s+v[2], 0)/fvertexScreen.length;

        const posUvs = textFillTriTex(
          fvertexScreen, //.map((vec4) => vec4normalize(vec4)),
          this.vsize,
          this.vsize,
          fuvsw
        );

        posUvs.forEach(({ pos, uv: uvw }) => {
          const uv = vec4normalize(uvw);
          let trgb = material.color;
          if (material.texture) {
            trgb = getTextureColor(uv, material.texture);
          }
          if (!trgb) {
            return;
          }
          // vdata[pos[1]][pos[0]] = "#";

          const trgbl = trgb.map((v) =>
            Math.min(255, Math.floor(v * (this.light.ambient + lum)))
          );
          const tcolor = `rgb(${trgbl[0]},${trgbl[1]},${trgbl[2]})`;
          // vcolor[pos[1]][pos[0]] = tcolor;
          result.push({pos, z, color: tcolor});
        });
      });
    });
    return result;// [vdata, vcolor];
  }

  clipTri(tri, tcoords) {
    let queue = [[tri, tcoords]];
    for (const plane of this.frustrumPlanes) {
      queue = queue
        .map(([ctri, tcoords]) => clipTriTex(ctri, tcoords, plane[0], plane[1]))
        .flat();
    }
    if (queue.length === 1) {
      return [[queue[0], null]];
    }
    const colors = ["red", "lime", "cyan", "yellow", "purple", "orange"];
    return queue.map((tri, i) => [tri, colors[i]]);
  }
}

function clipTriTex(tri, tcoords, planePoint, planeNormal) {
  const pInside = tri.map((p) => distToPlane(p, planePoint, planeNormal) > 0);
  if (!pInside[0] && !pInside[1] && !pInside[2]) {
    return [];
  }
  if (pInside[0] && pInside[1] && pInside[2]) {
    return [[tri, tcoords]];
  }
  const clippedPoints = [];
  for (let i = 0; i < tri.length; i++) {
    const i2 = (i + 1) % tri.length;
    if (pInside[i]) {
      clippedPoints.push([tri[i], tcoords[i]]);
    }
    const [p01, frac] = intersectLinePlane(
      tri[i],
      tri[i2],
      planePoint,
      planeNormal
    );
    if (p01) {
      const tp01 = tcoords[i].map(
        (_, ti) => tcoords[i2][ti] * frac + tcoords[i][ti] * (1 - frac)
      );
      clippedPoints.push([p01, tp01]);
    }
  }
  if (clippedPoints.length === 3) {
    return [[clippedPoints.map((t) => t[0]), clippedPoints.map((t) => t[1])]];
  }
  if (clippedPoints.length === 4) {
    const idxs0 = [0, 1, 2];
    const idxs1 = [0, 2, 3];
    const triClipped0 = idxs0.map((i) => clippedPoints[i][0]);
    const triClipped1 = idxs1.map((i) => clippedPoints[i][0]);

    const tcoordsClipped0 = idxs0.map((i) => clippedPoints[i][1]);
    const tcoordsClipped1 = idxs1.map((i) => clippedPoints[i][1]);
    return [
      [triClipped0, tcoordsClipped0],
      [triClipped1, tcoordsClipped1],
    ];
  }
  return [];
}

function getTextureColor(uv, texture) {
  const tpos = uv.map((v, i) =>
    Math.min(texture.size[i] - 1, Math.floor(v * texture.size[i]))
  );
  if (
    tpos[0] < 0 ||
    tpos[0] >= texture.size[0] ||
    tpos[1] < 0 ||
    tpos[1] >= texture.size[1]
  ) {
    return null;
  }
  return texture.data[texture.size[1] - tpos[1] - 1][tpos[0]];
}
