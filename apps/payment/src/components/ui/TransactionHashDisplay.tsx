import Icon from "@zo/assets/icons";
import { useResponseFlash } from "@zo/utils/hooks";
import { copyTextToClipboard, isValidString } from "@zo/utils/string";
import { FC } from "react";

const TransactionHashDisplay: FC<{ hash: string }> = ({ hash }) => {
  const [copied, setCopied] = useResponseFlash(2000);

  const copy = (copyText: string) => {
    copyTextToClipboard(copyText);
    setCopied("copied");
  };

  return (
    <>
      {hash && (
        <div className="flex flex-col w-full py-6">
          <div className="flex flex-col w-full mt-6 space-y-6">
            <div className="flex space-x-3 items-start w-full">
              <p>
                <strong>Hash:</strong>{" "}
                <span className="text-zui-silver break-all">{hash}</span>
              </p>
              {isValidString(hash) && (
                <button className="pt-1" onClick={() => copy(hash)}>
                  <Icon
                    name={isValidString(copied) ? "Check" : "Copy"}
                    size="16"
                    fill="#FFF"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionHashDisplay;
