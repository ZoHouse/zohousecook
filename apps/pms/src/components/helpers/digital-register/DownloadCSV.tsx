import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { QueryEndpoints, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { cn } from "@zo/utils/font";
import { showToast } from "libs/moal/src/utils";
import React, { useCallback, useState } from "react";

interface DownloadCSVProps {
  queryEndpoint: QueryEndpoints;
  additionalRoute?: string;
  search?: string;
  fileName: string;
  className?: string;
  hideText?: boolean;
  iconSize?: number;
  csvDataMapper: (item: GeneralObject, index: number) => GeneralObject;
}

const generateCSV = (csvData: GeneralObject[], fileName: string) => {
  const CSV = [
    Object.keys(csvData[0]).join(","),
    ...csvData.map((row) =>
      Object.values(row)
        .map((t) => (typeof t === "string" ? t.replace(/,/g, " ") : t))
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${fileName}.csv`);
  link.click();
};

const DownloadCSV: React.FC<DownloadCSVProps> = ({
  queryEndpoint,
  additionalRoute,
  search,
  hideText,
  className,
  iconSize = 16,
  fileName,
  csvDataMapper,
}) => {
  const [isLoading, setLoading] = useState<boolean>(false);

  const { refetch } = useQueryApi<GeneralObject>(
    queryEndpoint,
    {
      enabled: false,
      select: (data) => data?.data,
    },
    additionalRoute,
    search
  );

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      const data: GeneralObject = await refetch();

      const formattedData = data?.data?.results
        ? data.data.results.map((item: GeneralObject, index: number) =>
            csvDataMapper(item, index)
          )
        : data?.data
        ? Array.isArray(data.data)
          ? data.data.map((item: GeneralObject, index: number) =>
              csvDataMapper(item, index)
            )
          : [csvDataMapper(data.data, 0)]
        : [];

      generateCSV(formattedData, fileName);

      showToast("success", "CSV generated successfully");
    } catch (error) {
      showToast("error", "Error generating CSV");
    } finally {
      setLoading(false);
    }
  }, [refetch, csvDataMapper, fileName]);

  return (
    <button
      className={cn(
        "p-4 gap-4 h-12 text-xs flex items-center justify-start border border-zui-light relative",
        className
      )}
      onClick={handleExport}
      disabled={isLoading}
    >
      <Icon name="Download" size={iconSize} fill="#FFF" />
      {!hideText && (
        <span className="whitespace-nowrap font-semibold">Export CSV</span>
      )}
      {isLoading && (
        <span className="flex items-center justify-center absolute inset-0 bg-zui-dark">
          <Loader className="w-4 h-4" />
        </span>
      )}
    </button>
  );
};

export default DownloadCSV;
