const fs = require('fs');

// Code 128 (Subset B) Generator
const CODE128_PATTERNS = [
  '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
  '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
  '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
  '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
  '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
  '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
  '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
  '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
  '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
  '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
  '114131','311141','411131','211412','211214','211232','2331112'
];

function generateCode128Svg(text, customHeight = 110) {
  const START_B = 104;
  const STOP = 106;
  const codes = [START_B];
  let checkSum = START_B;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    codes.push(code);
    checkSum += code * (i + 1);
  }

  codes.push(checkSum % 103);
  codes.push(STOP);

  let binary = '';
  for (let i = 0; i < codes.length; i++) {
    const pattern = CODE128_PATTERNS[codes[i]];
    for (let j = 0; j < pattern.length; j++) {
      const count = parseInt(pattern[j], 10);
      const isBar = j % 2 === 0;
      binary += (isBar ? '1' : '0').repeat(count);
    }
  }

  const quietZone = 24;
  const moduleWidth = 2.8;
  const barHeight = customHeight;
  const totalModules = binary.length + (quietZone * 2);
  const svgWidth = Math.ceil(totalModules * moduleWidth);
  const svgHeight = barHeight + 48;

  let rects = '';
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      const x = (i + quietZone) * moduleWidth;
      rects += `<rect x="${x}" y="15" width="${moduleWidth}" height="${barHeight}" fill="#000"/>`;
    }
  }

  const textX = svgWidth / 2;
  const textY = barHeight + 38;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" style="background:#fff;display:block;margin:0 auto;max-width:100%;">
  <rect width="${svgWidth}" height="${svgHeight}" fill="#fff"/>
  ${rects}
  <text x="${textX}" y="${textY}" font-family="monospace, monospace" font-size="16" font-weight="bold" fill="#000" text-anchor="middle" letter-spacing="2">${text}</text>
</svg>`;
}

// Code 39 Table
const CODE39_ENCODINGS = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
};

function generateCode39Svg(text, customHeight = 110) {
  const fullText = `*${text.toUpperCase()}*`;
  let bits = '';
  for (let i = 0; i < fullText.length; i++) {
    const char = fullText[i];
    const pattern = CODE39_ENCODINGS[char] || CODE39_ENCODINGS['-'];
    for (let j = 0; j < 9; j++) {
      const isBar = j % 2 === 0;
      const isWide = pattern[j] === '1';
      const width = isWide ? 3 : 1;
      bits += (isBar ? '1' : '0').repeat(width);
    }
    if (i < fullText.length - 1) {
      bits += '0';
    }
  }

  const quietZone = 20;
  const unitWidth = 2.4;
  const barHeight = customHeight;
  const totalUnits = bits.length + (quietZone * 2);
  const svgWidth = Math.ceil(totalUnits * unitWidth);
  const svgHeight = barHeight + 48;

  let rects = '';
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      const x = (i + quietZone) * unitWidth;
      rects += `<rect x="${x}" y="15" width="${unitWidth}" height="${barHeight}" fill="#000"/>`;
    }
  }

  const textX = svgWidth / 2;
  const textY = barHeight + 38;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" style="background:#fff;display:block;margin:0 auto;max-width:100%;">
  <rect width="${svgWidth}" height="${svgHeight}" fill="#fff"/>
  ${rects}
  <text x="${textX}" y="${textY}" font-family="monospace, monospace" font-size="16" font-weight="bold" fill="#000" text-anchor="middle" letter-spacing="2">${text}</text>
</svg>`;
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>SLT MatriX Universal Router Barcode Suite</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0B1120;
      color: #F8FAFC;
      padding: 32px 16px;
      text-align: center;
    }
    header {
      margin-bottom: 24px;
    }
    h1 {
      color: #00E5FF;
      font-size: 1.8rem;
      margin-bottom: 6px;
    }
    .desc {
      color: #94A3B8;
      font-size: 0.92rem;
      max-width: 800px;
      margin: 0 auto 24px;
      line-height: 1.5;
    }
    .grid {
      max-width: 1080px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
      gap: 20px;
      text-align: left;
    }
    .card {
      background: #FFFFFF;
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      color: #0F172A;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      background: #E0F2FE;
      color: #0369A1;
      margin-bottom: 6px;
      width: fit-content;
    }
    .card h2 {
      font-size: 1.05rem;
      color: #0F172A;
      margin-bottom: 4px;
    }
    .card p {
      font-size: 0.8rem;
      color: #64748B;
      margin-bottom: 12px;
    }
    .barcode-wrap {
      background: #FFFFFF;
      padding: 12px;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      overflow-x: auto;
      text-align: center;
    }
    .router-mockup {
      grid-column: 1 / -1;
      background: #1E293B;
      color: #FFFFFF;
      border: 2px solid #334155;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.5);
    }
    .router-label-box {
      background: #FFFFFF;
      color: #000000;
      border-radius: 8px;
      padding: 18px;
      margin-top: 14px;
      border: 3px solid #64748B;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      align-items: center;
    }
  </style>
</head>
<body>
  <header>
    <h1>SLT MatriX Universal Router Barcode Suite</h1>
    <p class="desc">
      Every telecommunication router, ONT, modem, switch, and warehouse package has different barcode standards.
      This suite verifies reading across <strong>Huawei, ZTE, Nokia, FiberHome, Cisco</strong> linear barcodes, DataMatrix, and QR.
    </p>
  </header>

  <!-- Complete Real-World Router Label Simulation -->
  <div style="max-width: 1080px; margin: 0 auto 24px;">
    <div class="router-mockup">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <span style="background:#0284C7; color:#fff; font-size:0.75rem; font-weight:700; padding:3px 10px; border-radius:4px;">REAL DEVICE SIMULATION</span>
          <h2 style="color:#38BDF8; font-size:1.3rem; margin-top:4px;">Physical Huawei EchoLife HG8245H5 Backplate Label</h2>
        </div>
        <div style="color:#94A3B8; font-size:0.8rem;">Point scanner directly at this realistic multi-barcode sticker</div>
      </div>

      <div class="router-label-box">
        <div style="text-align:left;">
          <div style="font-weight:900; font-size:1.1rem; letter-spacing:1px;">HUAWEI EchoLife HG8245H5</div>
          <div style="font-size:0.75rem; color:#475569; margin-bottom:10px;">GPON Terminal • Power: 12V = 1.5A • Made in China</div>
          
          <div style="margin-bottom:12px;">
            <div style="font-size:0.72rem; font-weight:700; color:#334155;">GPON Serial Number (Code 128):</div>
            ${generateCode128Svg('48575443F8B310A4', 80)}
          </div>

          <div>
            <div style="font-size:0.72rem; font-weight:700; color:#334155;">MAC Address (Code 128):</div>
            ${generateCode128Svg('485702F8B310', 70)}
          </div>
        </div>

        <div style="display:flex; flex-direction:column; align-items:center; gap:14px; text-align:center;">
          <div>
            <div style="font-size:0.72rem; font-weight:700; color:#334155; margin-bottom:4px;">Micro PCB DataMatrix:</div>
            <img src="https://barcode.tec-it.com/barcode.ashx?data=48575443F8B310A4&code=DataMatrix" alt="DataMatrix" style="max-height:110px;">
            <div style="font-family:monospace; font-size:0.75rem; font-weight:700; margin-top:4px;">48575443F8B310A4</div>
          </div>
          <div>
            <div style="font-size:0.72rem; font-weight:700; color:#334155; margin-bottom:4px;">Wi-Fi Quick Registration QR:</div>
            <img src="https://barcode.tec-it.com/barcode.ashx?data=SLT-ONT-98205&code=QRCode" alt="QR" style="max-height:110px;">
            <div style="font-family:monospace; font-size:0.75rem; font-weight:700; margin-top:4px;">SLT-ONT-98205</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="grid">
    <!-- 1. Huawei ONT Serial (Code 128) -->
    <div class="card">
      <div>
        <span class="badge">Code 128 (1D Linear)</span>
        <h2>Huawei GPON ONT Serial</h2>
        <p>Standard alphanumeric serial on Huawei HG8145X6 / EG8145V5 / HG8245</p>
      </div>
      <div class="barcode-wrap">
        ${generateCode128Svg('4857544321A8B9C0')}
      </div>
    </div>

    <!-- 2. ZTE Router Serial (Code 39) -->
    <div class="card">
      <div>
        <span class="badge">Code 39 (1D Linear)</span>
        <h2>ZTE Router Serial (Code 39)</h2>
        <p>Alphanumeric Code 39 serial on ZTE ZXHN H268A / F670L</p>
      </div>
      <div class="barcode-wrap">
        ${generateCode39Svg('ZTEGC8217391')}
      </div>
    </div>

    <!-- 3. Nokia ONT Serial (Code 128) -->
    <div class="card">
      <div>
        <span class="badge">Code 128 (1D Linear)</span>
        <h2>Nokia G-140W-ME ONT Serial</h2>
        <p>Standard equipment serial on Nokia Alcatel-Lucent GPON devices</p>
      </div>
      <div class="barcode-wrap">
        ${generateCode128Svg('ALCLB8341902')}
      </div>
    </div>

    <!-- 4. FiberHome ONT Serial (Code 128) -->
    <div class="card">
      <div>
        <span class="badge">Code 128 (1D Linear)</span>
        <h2>FiberHome AN5506 ONT Serial</h2>
        <p>Alphanumeric serial on FiberHome optical network units</p>
      </div>
      <div class="barcode-wrap">
        ${generateCode128Svg('FHTT8391024')}
      </div>
    </div>

    <!-- 5. SLT MatriX ONT Asset Barcode -->
    <div class="card">
      <div>
        <span class="badge">Code 128 (1D Linear)</span>
        <h2>SLT MatriX Customer Allocation ONT</h2>
        <p>Internal SLT stock allocation tag for subscriber connection</p>
      </div>
      <div class="barcode-wrap">
        ${generateCode128Svg('SLT-ONT-98205')}
      </div>
    </div>

    <!-- 6. SLT Router Asset Barcode -->
    <div class="card">
      <div>
        <span class="badge">Code 128 (1D Linear)</span>
        <h2>SLT MatriX Wi-Fi Router</h2>
        <p>Internal SLT stock allocation tag for dual-band router</p>
      </div>
      <div class="barcode-wrap">
        ${generateCode128Svg('SLT-RTR-4014')}
      </div>
    </div>

    <!-- 7. Data Matrix: Huawei / ZTE PCB & Micro Tag -->
    <div class="card">
      <div>
        <span class="badge" style="background:#FEE2E2; color:#B91C1C;">Data Matrix (2D Matrix)</span>
        <h2>Router PCB / Micro Serial Tag</h2>
        <p>High-density 2D Data Matrix code found on modern router labels and SFP optical modules</p>
      </div>
      <div class="barcode-wrap">
        <img src="https://barcode.tec-it.com/barcode.ashx?data=2102353GBH10M4000123&code=DataMatrix" alt="DataMatrix Router Barcode" style="max-height:160px;">
        <div style="font-family:monospace; font-size:0.8rem; font-weight:700; margin-top:8px; color:#0F172A;">2102353GBH10M4000123</div>
      </div>
    </div>

    <!-- 8. QR Code: Wi-Fi Registration -->
    <div class="card">
      <div>
        <span class="badge" style="background:#DCFCE7; color:#15803D;">QR Code (2D Matrix)</span>
        <h2>Device Wi-Fi & MAC Registration QR</h2>
        <p>Quick connect & MAC registration QR code printed on router bottom label</p>
      </div>
      <div class="barcode-wrap">
        <img src="https://barcode.tec-it.com/barcode.ashx?data=SLT-ONT-98205&code=QRCode" alt="QR Code" style="max-height:160px;">
        <div style="font-family:monospace; font-size:0.8rem; font-weight:700; margin-top:8px; color:#0F172A;">SLT-ONT-98205</div>
      </div>
    </div>

    <!-- 9. EAN-13: Packaging Box Barcode -->
    <div class="card">
      <div>
        <span class="badge">EAN-13 (1D Retail / Box)</span>
        <h2>Router Master Box EAN-13</h2>
        <p>13-digit standard retail barcode on outer router packaging box</p>
      </div>
      <div class="barcode-wrap">
        <img src="https://barcode.tec-it.com/barcode.ashx?data=4792025098205&code=EAN13" alt="EAN-13 Barcode" style="max-height:130px;">
      </div>
    </div>

    <!-- 10. ITF: Warehouse Shipping Carton -->
    <div class="card">
      <div>
        <span class="badge">ITF / Interleaved 2 of 5</span>
        <h2>Warehouse Dispatch Shipping Carton</h2>
        <p>Standard bulk equipment distribution carton barcode</p>
      </div>
      <div class="barcode-wrap">
        <img src="https://barcode.tec-it.com/barcode.ashx?data=14792025098202&code=ITF14" alt="ITF Barcode" style="max-height:130px;">
      </div>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync('test-barcodes.html', html);
console.log('SUCCESS: test-barcodes.html updated with realistic Huawei, ZTE, Nokia, FiberHome router barcodes!');
