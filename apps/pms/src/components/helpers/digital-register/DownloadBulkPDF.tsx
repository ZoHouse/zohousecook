import { pdf } from "@react-pdf/renderer";
import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { QueryEndpoints, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { getAssetUrlByType } from "apps/pms/src/utils";
import JSZip from "jszip";
import { showToast } from "libs/moal/src/utils";
import moment from "moment";
import { PDFDocument } from "pdf-lib";
import React, { useState } from "react";
import { CheckinPDF } from "../../ui";

type DownloadBulkPDFProps = {
  queryEndpoint: QueryEndpoints;
  additionalRoute?: string;
  search?: string;
  fileName: string;
  className?: string;
  hideText?: boolean;
  iconSize?: number;
};

const downloadZipFile = (zipBlob: Blob, fileName: string) => {
  const link = document.createElement("a");
  const url = URL.createObjectURL(zipBlob);
  link.href = url;
  link.download = `${fileName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const combinePDFs = async (pdfBlobs: GeneralObject[]) => {
  const combinedPdf = await PDFDocument.create();
  for (const pdfBlob of pdfBlobs) {
    const pdfBytes = await pdfBlob.arrayBuffer();
    const pdf = await PDFDocument.load(pdfBytes);
    const pages = await combinedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => combinedPdf.addPage(page));
  }
  return await combinedPdf.save();
};

const DownloadBulkPDF: React.FC<DownloadBulkPDFProps> = ({
  queryEndpoint,
  additionalRoute,
  search,
  fileName,
  hideText,
  className,
  iconSize = 16,
}) => {
  const { refetch } = useQueryApi<GeneralObject>(
    queryEndpoint,
    {
      enabled: false,
      select: (data) => data?.data,
    },
    additionalRoute,
    search
  );
  const [isLoading, setLoading] = useState<boolean>(false);

  const generatePDFsAndZip = async () => {
    setLoading(true);
    try {
      const data = await refetch();
      const formattedData = Array.isArray(data?.data?.results)
        ? data?.data?.results
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const zip = new JSZip();
      const pdfBlobs: GeneralObject[] = [];

      const Pdfs = formattedData?.map(async (checkin) => {
        const stayInfo = checkin.bookings;
        const assets = checkin?.approved
          ? checkin?.data?.assets || []
          : checkin?.profile?.assets || [];

        const doc = (
          <CheckinPDF checkin={checkin} stayInfo={stayInfo} assets={assets} />
        );

        const pdfBlob = await pdf(doc).toBlob();
        pdfBlobs.push(pdfBlob);
        const formattedArrivalDate = moment(checkin.arrival_on).format(
          "YYYY-MM-DD"
        );
        const formattedDepartureDate = moment(checkin.departure_on).format(
          "YYYY-MM-DD"
        );

        zip.file(
          `${checkin.profile.full_name}_${formattedArrivalDate}__${formattedDepartureDate}__${checkin.id}.pdf`,
          pdfBlob
        );
      });

      await Promise.all(Pdfs || []);

      const combinedPdfBytes = await combinePDFs(pdfBlobs);
      zip.file("all_checkin.pdf", combinedPdfBytes);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadZipFile(zipBlob, fileName);
      showToast("success", "PDF generated successfully");
    } catch (error) {
      showToast("error", "Error generating PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={cn(
        "p-4 gap-4 h-12 text-xs flex items-center justify-start border border-zui-light relative",
        className
      )}
      onClick={generatePDFsAndZip}
      disabled={isLoading}
    >
      <Icon name="Download" size={iconSize} fill="#FFF" />
      {!hideText && (
        <span className="whitespace-nowrap font-semibold">Export PDF</span>
      )}
      {isLoading && (
        <span className="flex items-center justify-center absolute inset-0 bg-zui-dark">
          <Loader className="w-4 h-4" />
        </span>
      )}
    </button>
  );
};

export default DownloadBulkPDF;
