/* eslint-disable @next/next/no-img-element */
import { GeneralObject } from "@zo/definitions/general";
import React from "react";

interface AllowedCollectionModalProps {
  data: GeneralObject[];
  close: () => void;
}

const AllowedCollectionModal: React.FC<AllowedCollectionModalProps> = ({
  close,
  data,
}) => {
  return (
    <div className="fixed inset-0 z-20 p-4 bg-zui-white bg-opacity-60 flex items-center justify-center">
      <div className="fixed inset-0" onClick={close} />
      <div className="max-h-[95vh] flex flex-col bg-zui-black relative max-w-md w-full">
        <div className="flex items-center justify-between p-4 flex-shrink-0">
          <h3 className=" text-lg mr-8 text-zui-magenta font-semibold">
            PFP Collection Allowlist
          </h3>
          <button
            className="flex items-center bg-zui-white justify-center w-6 h-6 text-zui-white text-xl text-zui-black"
            onClick={close}
          >
            <i className="uil uil-times" />
          </button>
        </div>
        <div className="flex-1 overflow-auto w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border border-zinc-700">#</th>
                <th className="text-left p-3 border border-zinc-700">
                  Collection Name
                </th>
                <th className="text-left p-3 border border-zinc-700">Links</th>
              </tr>
            </thead>
            <tbody>
              {data.map((collection, index) => (
                <tr key={collection.contract_ref_address}>
                  <td className="p-3 text-left border border-zinc-700">
                    {index + 1}
                  </td>
                  <td className="p-3 text-left border border-zinc-700">
                    {collection.name}
                  </td>
                  <td className="p-3 text-left border border-zinc-700">
                    <a
                      href={`https://etherscan.io/address/${collection.contract_ref_address}`}
                      rel="noreferrer"
                      className="underline font-medium"
                      target="_blank"
                    >
                      <img
                        src="https://static.cdn.zo.xyz/media/etherscan-light.svg"
                        className="w-auto h-4 md:h-6"
                        alt="opensea"
                      />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllowedCollectionModal;
