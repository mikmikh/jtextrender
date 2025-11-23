export function parseObjInfo(wavefont) {
  const lines = wavefont
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const objs = [];
  let name = null;
  let obj = null;
  for (const line of lines) {
    const parts = line
      .split(" ")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!parts.length) {
      continue;
    }
    const paramType = parts[0];
    const args = parts
      .slice(1)
      .map((l) => l.trim())
      .filter(Boolean);
    if (paramType === "o") {
      name = args[0];
      if (obj) {
        objs.push({ name, obj });
      }
      obj = {
        v: [],
        vn: [],
        vt: [],
        f: [],
      };
    }
    if (paramType === "v") {
      obj.v.push(args.map((v) => parseFloat(v)));
    } else if (paramType === "vn") {
      obj.vn.push(args.map((v) => parseFloat(v)));
    } else if (paramType === "vt") {
      obj.vt.push(args.map((v) => parseFloat(v)));
    } else if (paramType === "f") {
      obj.f.push(args.map((vs) => vs.split("/").map((v) => parseInt(v)-1)));
    }
  }
  if (obj) {
    objs.push({ name, obj });
  }
  return objs;
}

export async function loadWavefrontObjectInfo(url) {
  const resp = await fetch(url);
  const data = await resp.text();
  const objs = parseObjInfo(data);
  const objectInfos = objs.map((obj) => ({
    name: obj.name,
    geometry: obj.obj,
  }));
  return objectInfos;
}

function loadTextureAsync(url) {
  console.log('loadTextureAsync', url);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      console.log('resolve', image);
      return resolve(image);
    };
    image.onerror = (error) => {
      reject(error);
    };
    image.src = url;
  });
}
export async function loadTexture(url, tsize = [64, 64]) {
  const image = await loadTextureAsync(url);
  const canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  const [width, height] = tsize;
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    width,
    height
  );
  const imgData = ctx.getImageData(0, 0, width, height);
  const textureData = [...new Array(height)].map(() =>
    [...new Array(width)].map(() => null)
  );
  for (let i = 0; i < imgData.data.length; i += 4) {
    const r = imgData.data[i];
    const g = imgData.data[i + 1];
    const b = imgData.data[i + 2];
    const a = imgData.data[i + 3];
    const [x, y] = [(i / 4) % width, Math.floor(i / 4 / width)];
    textureData[y][x] = [r, g, b];
  }
  const texture = { data: textureData, size: [width, height] };
  return texture;
}
