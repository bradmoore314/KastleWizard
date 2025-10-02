import React, { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import type { PDFDocument } from 'pdf-lib';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

interface PageThumbnailsProps {
  pdfDoc: PDFDocument | null;
  pdfJsDoc: PDFDocumentProxy | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onDeletePage: (pageIndex: number) => void;
  onDeletePageRangeRequest: () => void;
}

const PageThumbnails: React.FC<PageThumbnailsProps> = ({ pdfDoc, pdfJsDoc, currentPage, setCurrentPage, onDeletePage, onDeletePageRangeRequest }) => {
  const thumbnailRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const renderTasksRef = useRef<RenderTask[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const renderAllThumbnails = async () => {
      if (!pdfJsDoc) return;

      // Ensure the refs array is the correct size for the new document
      thumbnailRefs.current = thumbnailRefs.current.slice(0, pdfJsDoc.numPages);
      
      for (let i = 0; i < pdfJsDoc.numPages; i++) {
        if (isCancelled) break;
        
        const canvas = thumbnailRefs.current[i];
        if (canvas) {
          try {
            const page = await pdfJsDoc.getPage(i + 1);
            if (isCancelled) break;

            const viewport = page.getViewport({ scale: 0.2 });
            const context = canvas.getContext('2d');
            if (!context) continue;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // FIX: Added 'canvas' property to render parameters to align with pdf.js v4+ API.
            const renderContext = {
              canvas: canvas,
              canvasContext: context,
              viewport: viewport,
            };
            
            const task = page.render(renderContext);
            renderTasksRef.current[i] = task;
            
            await task.promise;
          } catch (error: any) {
            if (!isCancelled && error.name !== 'RenderingCancelledException') {
              console.error(`Failed to render thumbnail for page ${i + 1}`, error);
            }
          }
        }
      }
    };

    renderAllThumbnails();
    
    return () => {
      isCancelled = true;
      renderTasksRef.current.forEach(task => task?.cancel());
      renderTasksRef.current = [];
    };
  }, [pdfJsDoc]);

  const numPages = pdfJsDoc?.numPages || pdfDoc?.getPageCount() || 0;

  return (
    <div className="w-48 bg-surface p-2 h-full border-r border-white/10 flex flex-col">
      <h3 className="text-lg font-semibold text-center text-on-surface p-2 flex-shrink-0">Pages</h3>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {Array.from({ length: numPages }, (_, index) => (
          <div
            key={index}
            className={`relative group p-1 rounded-md cursor-pointer transition-all ${currentPage === index + 1 ? 'bg-primary-600' : 'hover:bg-white/10'}`}
            onClick={() => setCurrentPage(index + 1)}
          >
            {numPages > 1 && (
              <button
                  onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(index);
                  }}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-lg"
                  title="Delete Page"
              >
                  <Trash2 className="w-3 h-3" />
              </button>
            )}
            {pdfJsDoc ? (
              <canvas
                ref={el => { thumbnailRefs.current[index] = el; }}
                className="w-full h-auto rounded-sm shadow-md"
              />
            ) : (
              <div className="w-full h-auto aspect-[8.5/11] bg-white rounded-sm shadow-md flex items-center justify-center">
                <span className="text-sm text-gray-500">Blank Canvas</span>
              </div>
            )}
            <p className={`text-center text-sm mt-1 ${currentPage === index + 1 ? 'text-white' : 'text-on-surface-variant'}`}>
              Page {index + 1}
            </p>
          </div>
        ))}
      </div>
      {numPages > 1 && (
        <div className="flex-shrink-0 pt-2 border-t border-white/10">
          <button
            onClick={onDeletePageRangeRequest}
            className="w-full text-center p-2 text-sm text-on-surface-variant bg-background rounded-md hover:bg-white/10"
          >
            Delete Page Range...
          </button>
        </div>
      )}
    </div>
  );
};

export default PageThumbnails;