

import {
  PDFDocument,
  rgb,
  StandardFonts,
} from 'pdf-lib';

export const loadPdf = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pageDimensions = pdfDoc.getPages().map(p => {
    const box = p.getCropBox() ?? p.getMediaBox();
    const { width, height } = box;
    const rotation = p.getRotation().angle;
    if (rotation === 90 || rotation === 270) {
        return { width: height, height: width };
    }
    return { width, height };
  });
  return { pdfDoc, pageDimensions };
};

export const convertImageToPdf = async (imageFile: File): Promise<File> => {
    const pdfDoc = await PDFDocument.create();
    const imageBytes = await imageFile.arrayBuffer();

    let image;
    if (imageFile.type === 'image/jpeg') {
        image = await pdfDoc.embedJpg(imageBytes);
    } else if (imageFile.type === 'image/png') {
        image = await pdfDoc.embedPng(imageBytes);
    } else {
        throw new Error('Unsupported image format. Please use JPEG or PNG.');
    }
    
    const imageDims = image.scale(1);
    
    // Using US Letter size (8.5 x 11 inches -> 612x792 points)
    const pageWidth = 612;
    const pageHeight = 792;
    
    // Scale image to fit page, respecting aspect ratio
    const pageAspectRatio = pageWidth / pageHeight;
    const imageAspectRatio = imageDims.width / imageDims.height;
    
    let scaledWidth, scaledHeight;
    const margin = 20; // smaller margin
    
    if (imageAspectRatio > pageAspectRatio) {
        // Image is wider than page
        scaledWidth = pageWidth - margin * 2;
        scaledHeight = scaledWidth / imageAspectRatio;
    } else {
        // Image is taller than page
        scaledHeight = pageHeight - margin * 2;
        scaledWidth = scaledHeight * imageAspectRatio;
    }
    
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    page.drawImage(image, {
        x: (pageWidth - scaledWidth) / 2,
        y: (pageHeight - scaledHeight) / 2,
        width: scaledWidth,
        height: scaledHeight,
    });
    
    const pdfBytes = await pdfDoc.save();
    
    const filename = `floorplan-from-photo.pdf`;
    return new File([pdfBytes], filename, { type: 'application/pdf' });
};