import Icon, { IconName } from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import { useResponseFlash } from "@zo/utils/hooks";
import { copyTextToClipboard, isValidString } from "@zo/utils/string";
import React from "react";

export type DataList = {
  id: string;
  title?: string;
  data: Array<{
    id: string;
    content: string | undefined;
    icon: IconName;
    link?: string;
    copyText?: string;
    isHidden?: boolean;
    onClick?: () => void;
  }>;
  isHidden?: boolean;
};

interface DataListDisplayProps {
  className?: string;
  data: DataList[];
}

const DataListDisplay: React.FC<DataListDisplayProps> = ({
  className,
  data,
}) => {
  const [copied, setCopied] = useResponseFlash(2000);

  const copy = (copyText: string) => {
    copyTextToClipboard(copyText);
    setCopied("copied");
  };

  return (
    <div
      className={cn(
        "flex flex-col w-full divide-y divide-zui-light",
        className
      )}
    >
      {data
        .filter((list) => !list.isHidden)
        .map((list) => (
          <div key={list.id} className="flex flex-col w-full py-6">
            {isValidString(list.title) && (
              <p className="text-base font-semibold text-zui-silver uppercase">
                {list.title}
              </p>
            )}
            <div className="flex flex-col w-full mt-6 space-y-6 ">
              {list.data
                .filter((item) => !item.isHidden && item.content != null)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex space-x-3 items-start w-full"
                  >
                    <div className="h-6 w-6 flex-shrink-0">
                      <Icon name={item.icon} size={24} fill="#5a5a5a" />
                    </div>
                    {item.link ? (
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={item.link}
                        className="text-base inline-flex space-x-2 items-center"
                      >
                        <span>{item.content}</span>
                        <Icon name="NewTab" size={16} fill="#FFF" />
                      </a>
                    ) : (
                      <p className="text-base">{item.content}</p>
                    )}

                    {item.onClick && (
                      <div onClick={item.onClick} className="pl-16">
                        <p className="text-zui-neon text-base inline-flex  items-center hover:cursor-pointer">
                          Add
                        </p>
                      </div>
                    )}

                    {isValidString(item.copyText) && (
                      <button
                        className="pt-1"
                        onClick={copy.bind(null, String(item.copyText))}
                      >
                        <Icon
                          name={isValidString(copied) ? "Check" : "Copy"}
                          size="16"
                          fill="#FFF"
                        />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export default DataListDisplay;
