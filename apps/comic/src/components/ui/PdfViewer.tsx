import Icon from "@zo/assets/icons";
import { useWindowSize } from "@zo/utils/hooks";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  pdf: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdf }) => {
  const { isMobile } = useWindowSize();

  const [numPages, setNumPages] = useState<number>(0);
  const [isFullScreen, setFullScreen] = useState<boolean>(false);
  const [pdfPageWidth, setPdfPageWidth] = useState<number>(
    window.innerWidth / 3 || 400
  );

  const viewerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLCanvasElement>(null);

  function onDocumentLoadSuccess({
    numPages: loadedNumPages,
  }: {
    numPages: number;
  }) {
    setNumPages(loadedNumPages);
  }

  const toggleFullScreen = () => {
    if (viewerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setFullScreen(false);
      } else {
        viewerRef.current.requestFullscreen();
        setFullScreen(true);
      }
    }
  };

  const downloadPdf = async () => {
    try {
      const response = await fetch(pdf);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "Quantum Surfing - The First Zo Trip - Ch 1.pdf";
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

  useEffect(() => {
    const updatepdfPageWidth = () => {
      if (pageRef.current) {
        setPdfPageWidth(pageRef.current.width);
      }
    };

    updatepdfPageWidth();

    window.addEventListener("resize", updatepdfPageWidth);
    return () => {
      window.removeEventListener("resize", updatepdfPageWidth);
    };
  }, []);

  return (
    <div ref={viewerRef} className="flex flex-col items-center justify-center">
      <div className="w-full h-fit overflow-auto">
        <Document
          file={pdf}
          className="flex flex-col items-center justify-center"
          onLoadSuccess={onDocumentLoadSuccess}
        >

          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={`page_${index + 1}`}
              canvasRef={pageRef}
              pageNumber={index + 1}
              className="mb-4"
              width={isMobile ? window.innerWidth - 48 : undefined}
              height={isMobile ? undefined : window.innerHeight - 80}
            />
          ))}

        </Document>
      </div>

      <div
        id="toolbar"
        className={`fixed bottom-6 w-screen px-6 md:px-10 flex justify-between items-center z-50`}
        style={{ width: isMobile ? window.innerWidth - 48 : pdfPageWidth }}
      >
        <button
          onClick={toggleFullScreen}
          className="p-2 bg-zui-dark/60 rounded-full"
        >
          <Icon
            name={isFullScreen ? "Minimize" : "Maximise"}
            size={20}
            fill="#fff"
          />
        </button>
        <button onClick={downloadPdf} className="p-2 bg-zui-dark/60 rounded-full">
          <Icon name="Download" size={20} fill="#fff" />
        </button>
      </div>
    </div>
  );
};

export default PdfViewer;
