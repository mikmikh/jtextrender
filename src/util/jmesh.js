// [-+0]-[++0]
//   |     |
// [--0]-[+-0]
export class JPlaneGeometry {
  constructor() {
    this.v = [
      [-0.5, -0.5, 0],
      [-0.5, 0.5, 0],
      [0.5, 0.5, 0],
      [0.5, -0.5, 0],
    ];
    this.vt = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ];
    this.vn = [[0, 0, -1]];
    this.f = [
      [
        [0, 0, 0],
        [1, 1, 0],
        [2, 2, 0],
      ],
      [
        [0, 0, 0],
        [2, 2, 0],
        [3, 3, 0],
      ],
    ];
  }
}

//          top
//   6[-++]------5[+++]
//      / |      /|
// 1[-+-]--2[++-] |   / north
// west|7[--+]_|__|4[+-+]
//     |/      | /      -> east
// 0[---]----3[+--]
//       /  |
//   south  v

export class JBoxGeometry {
  constructor() {
    this.v = [
      // south
      [-1, -1, -1], // 0
      [-1, 1, -1], // 1
      [1, 1, -1], // 2
      [1, -1, -1], // 3
      // north
      [1,-1,1], // 4
      [1,1,1], // 5
      [-1,1,1], // 6
      [-1,-1,1], // 7
    ];
    this.vt = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ];
    this.vn = [
        [0, 0, -1], // south
        [0, 0, 1], // north
        [-1, 0, 0], // west
        [1, 0, 0], // east
        [0, -1, 0], // bottom
        [0, 1, 0], // top
    ];
    this.f = [
        // south
      [
        [0, 0, 0],
        [1, 1, 0],
        [2, 2, 0],
      ],
      [
        [0, 0, 0],
        [2, 2, 0],
        [3, 3, 0],
      ],
      // north
      [
        [4, 0, 1],
        [5, 1, 1],
        [6, 2, 1],
      ],
      [
        [4, 0, 1],
        [6, 2, 1],
        [7, 3, 1],
      ],
      // west
      [
        [7, 0, 2],
        [6, 1, 2],
        [1, 2, 2],
      ],
      [
        [7, 0, 2],
        [1, 2, 2],
        [0, 3, 2],
      ],
      // east
      [
        [3, 0, 3],
        [2, 1, 3],
        [5, 2, 3],
      ],
      [
        [3, 0, 3],
        [5, 2, 3],
        [4, 3, 3],
      ],
      // bottom
      [
        [7, 0, 4],
        [0, 1, 4],
        [3, 2, 4],
      ],
      [
        [7, 0, 4],
        [3, 2, 4],
        [4, 3, 4],
      ],
      // top
      [
        [1, 0, 5],
        [6, 1, 5],
        [5, 2, 5],
      ],
      [
        [1, 0, 5],
        [5, 2, 5],
        [2, 3, 5],
      ],
    ];
  }
}

export class JMaterial {
    /**
     * 
     * @param {[number,number,number]} color 
     * @param {{data:number[][][], size: [number,number]}} texture 
     */
    constructor(color=[255,255,255],texture=null) {
        this.color=color;
        this.texture=texture;
    }
}

export class JMesh {
    constructor(geometry, material) {
        this.geometry = geometry;
        this.material = material;
        this.position = [0,0,0];
        this.rotation = [0,0,0];
        this.scale = [1,1,1];
    }
}