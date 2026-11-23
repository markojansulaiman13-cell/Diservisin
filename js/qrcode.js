// Pure offline ISO/IEC 18004 QR Code SVG generator (Byte mode, ECC Level M, Versions 1-6)
// Zero external dependencies — works 100% offline in the workshop.

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data, ecCount) {
  const gen = rsGeneratorPoly(ecCount);
  const res = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.copyWithin(0, 1);
    res[ecCount - 1] = 0;
    for (let j = 0; j < ecCount; j++) {
      res[j] ^= gfMul(gen[j + 1], factor);
    }
  }
  return res;
}

// Version specs for ECC Level M (version 1..6)
// [dataCodewords, ecPerBlock, numBlocks, alignmentCenters]
const VERSION_M = {
  1: [16, 10, 1, []],
  2: [28, 16, 1, [6, 18]],
  3: [44, 26, 1, [6, 22]],
  4: [64, 18, 2, [6, 26]],
  5: [86, 24, 2, [6, 30]],
  6: [108, 16, 4, [6, 34]],
};

function chooseVersion(byteLen) {
  for (let v = 1; v <= 6; v++) {
    const capBytes = VERSION_M[v][0] - 2; // 4-bit mode + 8-bit count + 4-bit terminator = 2 bytes overhead
    if (byteLen <= capBytes) return v;
  }
  return 6;
}

function encodeData(bytes, version) {
  const [totalData, ecPerBlock, numBlocks] = VERSION_M[version];
  const bits = [];
  const pushBits = (val, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  pushBits(0b0100, 4); // Byte mode
  pushBits(bytes.length, 8);
  for (const b of bytes) pushBits(b, 8);
  const maxBits = totalData * 8;
  const termLen = Math.min(4, maxBits - bits.length);
  pushBits(0, termLen);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    codewords.push(byte);
  }
  let padToggle = true;
  while (codewords.length < totalData) {
    codewords.push(padToggle ? 0xec : 0x11);
    padToggle = !padToggle;
  }

  // Split into blocks & compute Reed-Solomon EC
  const blockLen = Math.floor(totalData / numBlocks);
  const dataBlocks = [];
  const ecBlocks = [];
  for (let b = 0; b < numBlocks; b++) {
    const slice = codewords.slice(b * blockLen, (b + 1) * blockLen);
    dataBlocks.push(slice);
    ecBlocks.push(Array.from(rsRemainder(slice, ecPerBlock)));
  }

  // Interleave
  const out = [];
  for (let i = 0; i < blockLen; i++) {
    for (let b = 0; b < numBlocks; b++) out.push(dataBlocks[b][i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < numBlocks; b++) out.push(ecBlocks[b][i]);
  }
  return out;
}

function computeFormatBits(mask) {
  // ECC Level M = 00
  const data = (0b00 << 3) | mask;
  let rem = data << 10;
  const poly = 0x537;
  for (let i = 14; i >= 10; i--) {
    if ((rem >>> i) & 1) rem ^= poly << (i - 10);
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function buildQRMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text)).slice(0, 104);
  const version = chooseVersion(bytes.length);
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Int8Array(size));
  const isFunc = Array.from({ length: size }, () => new Uint8Array(size));

  const setFunc = (r, c, val) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = val ? 1 : 0;
      isFunc[r][c] = 1;
    }
  };

  // Finder patterns + separators
  const drawFinder = (r0, c0) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = r0 + dr;
        const c = c0 + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFunc(r, c, inOuter && (onBorder || inCore));
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Alignment patterns
  const centers = VERSION_M[version][3];
  for (const r0 of centers) {
    for (const c0 of centers) {
      if ((r0 === 6 && c0 === 6) || (r0 === 6 && c0 === size - 7) || (r0 === size - 7 && c0 === 6)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFunc(r0 + dr, c0 + dc, dist !== 1);
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFunc(6, i, i % 2 === 0);
    setFunc(i, 6, i % 2 === 0);
  }

  // Dark module & reserve format info
  setFunc(size - 8, 8, true);
  for (let i = 0; i < 9; i++) {
    if (!isFunc[8][i]) setFunc(8, i, false);
    if (!isFunc[i][8]) setFunc(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    setFunc(8, size - 1 - i, false);
    setFunc(size - 1 - i, 8, false);
  }

  // Place data bits (mask 0: (r + c) % 2 === 0)
  const codewords = encodeData(bytes, version);
  const bitStream = [];
  for (const cw of codewords) {
    for (let b = 7; b >= 0; b--) bitStream.push((cw >>> b) & 1);
  }

  const mask = 0;
  let bitIdx = 0;
  let upward = true;
  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col--;
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (let d = 0; d < 2; d++) {
        const c = col - d;
        if (!isFunc[r][c]) {
          let bit = bitIdx < bitStream.length ? bitStream[bitIdx++] : 0;
          if ((r + c) % 2 === 0) bit ^= 1;
          modules[r][c] = bit;
        }
      }
    }
    upward = !upward;
  }

  // Write format info
  const fmt = computeFormatBits(mask);
  const fmtBits = [];
  for (let i = 0; i < 15; i++) fmtBits.push((fmt >>> i) & 1);
  const topLeftCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const bit = fmtBits[14 - i];
    const [r1, c1] = topLeftCoords[i];
    modules[r1][c1] = bit;
    if (i < 7) {
      modules[size - 1 - i][8] = bit;
    } else {
      modules[8][size - 15 + i] = bit;
    }
  }

  return modules;
}

export function renderQRSvg(text, pixelSize = 188, fgColor = '#0D172B', bgColor = '#FFFFFF') {
  const matrix = buildQRMatrix(String(text || 'DISERVISIN'));
  const n = matrix.length;
  const quiet = 3;
  const total = n + quiet * 2;
  let path = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c]) {
        path += `M${c + quiet},${r + quiet}h1v1h-1z`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" viewBox="0 0 ${total} ${total}" role="img" aria-label="QR Code ${text}" style="display:block;border-radius:12px;">
    <rect width="${total}" height="${total}" fill="${bgColor}" rx="1.5"/>
    <path d="${path}" fill="${fgColor}"/>
  </svg>`;
}
