const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const PDFDocument = require('pdfkit');

async function run() {
  try {
    const svgPath = path.resolve(__dirname, '..', 'docs', 'architecture.svg');
    const pngPath = path.resolve(__dirname, '..', 'docs', 'architecture.png');
    const pdfPath = path.resolve(__dirname, '..', 'docs', 'architecture.pdf');

    if (!fs.existsSync(svgPath)) {
      console.error('SVG not found:', svgPath);
      process.exit(1);
    }

    const svgBuffer = fs.readFileSync(svgPath);

    // Generate a high-DPI PNG (2x size by default)
    console.log('Rendering PNG...');
    const pngBuffer = await sharp(svgBuffer, { density: 300 })
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(pngPath, pngBuffer);
    console.log('Saved PNG ->', pngPath);

    // Create a simple PDF that embeds the PNG centered on a page
    console.log('Rendering PDF...');
    const doc = new PDFDocument({ autoFirstPage: false });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    const img = pngBuffer;
    // Get image size
    const metadata = await sharp(img).metadata();
    const imgWidth = metadata.width || 1000;
    const imgHeight = metadata.height || 600;

    // Add a page sized to the image (scale down if too large)
    const maxW = 1200; const maxH = 900;
    let pageW = imgWidth, pageH = imgHeight;
    const scale = Math.min(1, maxW / imgWidth, maxH / imgHeight);
    pageW = Math.round(imgWidth * scale);
    pageH = Math.round(imgHeight * scale);

    doc.addPage({ size: [pageW, pageH] });
    doc.image(img, 0, 0, { width: pageW, height: pageH });

    doc.end();

    await new Promise((res, rej) => writeStream.on('finish', res).on('error', rej));
    console.log('Saved PDF ->', pdfPath);

    console.log('Done.');
  } catch (e) {
    console.error('Conversion failed', e);
    process.exit(1);
  }
}

run();