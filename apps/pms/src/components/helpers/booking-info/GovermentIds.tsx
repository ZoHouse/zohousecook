import Icon from "@zo/assets/icons";
import { GeneralObject } from "@zo/definitions/general";
import React, { useMemo } from "react";
import { getAssetUrlByType } from "../../../utils";
import { UserDocument } from "../../ui";

interface GovermentIdsProps {
  assets: GeneralObject[];
  areFieldsEditable: boolean;
  editPersonalInfo: () => void;
}

const GovermentIds: React.FC<GovermentIdsProps> = ({
  assets,
  areFieldsEditable,
  editPersonalInfo,
}) => {
  const aadhaarFront = useMemo(
    () => getAssetUrlByType(assets || [], 110),
    [assets]
  );
  const aadhaarBack = useMemo(
    () => getAssetUrlByType(assets || [], 111),
    [assets]
  );
  const passportMain = useMemo(
    () => getAssetUrlByType(assets || [], 112),
    [assets]
  );
  const passportAddress = useMemo(
    () => getAssetUrlByType(assets || [], 113),
    [assets]
  );
  const passportVisa = useMemo(
    () => getAssetUrlByType(assets || [], 114),
    [assets]
  );
  const aiFront = useMemo(() => getAssetUrlByType(assets || [], 116), [assets]);
  const aiBack = useMemo(() => getAssetUrlByType(assets || [], 117), [assets]);
  const idNumber = useMemo(
    () => assets.find((asset) => asset.type === 116)?.identifier || "",
    [assets]
  );

  const selectedIdDocument = useMemo(() => {
    if (aiFront && aiBack) {
      return "AI";
    } else if (aadhaarFront && aadhaarBack) {
      return "AADHAAR";
    } else if (passportMain && passportAddress && passportVisa) {
      return "PASSPORT";
    } else {
      return null;
    }
  }, [
    aiFront,
    aiBack,
    aadhaarFront,
    aadhaarBack,
    passportMain,
    passportAddress,
    passportVisa,
  ]);

  const frontIdDocument = useMemo(() => {
    if (selectedIdDocument === "AI") {
      return aiFront;
    } else if (selectedIdDocument === "AADHAAR") {
      return aadhaarFront;
    } else if (selectedIdDocument === "PASSPORT") {
      return passportMain;
    } else {
      return null;
    }
  }, [aiFront, aadhaarFront, passportMain, selectedIdDocument]);

  const backIdDocument = useMemo(() => {
    if (selectedIdDocument === "AI") {
      return aiBack;
    } else if (selectedIdDocument === "AADHAAR") {
      return aadhaarBack;
    } else if (selectedIdDocument === "PASSPORT") {
      return passportAddress;
    } else {
      return null;
    }
  }, [aiBack, aadhaarBack, passportAddress, selectedIdDocument]);

  const extraDocumemt = useMemo(() => {
    if (selectedIdDocument === "PASSPORT") {
      return passportVisa;
    } else {
      return null;
    }
  }, [passportVisa, selectedIdDocument]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-6 border-t border-zui-light pb-2">
        <p className="text-base font-semibold text-zui-silver uppercase">
          Government IDs
        </p>
        {areFieldsEditable && (
          <button className="relative z-10" onClick={editPersonalInfo}>
            <Icon name="Edit" size={24} fill="#FFF" />
          </button>
        )}
      </div>

      {idNumber && (
        <p className="font-semibold text-zui-silver mx-6 p-2 text-sm">
          ID Number:{" "}
          <span className="text-white font-normal">
            {idNumber || "Not Available"}
          </span>
        </p>
      )}

      <div className="flex flex-col gap-6 mb-6 mt-4">
        {frontIdDocument && backIdDocument && (
          <div className="flex flex-col gap-4 px-6">
            <div className="flex flex-col gap-4">
              {frontIdDocument && (
                <UserDocument name="Front" src={frontIdDocument} />
              )}
              {backIdDocument && (
                <UserDocument name="Back" src={backIdDocument} />
              )}
              {extraDocumemt && (
                <UserDocument name="Extra" src={extraDocumemt} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GovermentIds;
