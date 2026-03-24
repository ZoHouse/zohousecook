/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @next/next/no-img-element */
import { FounderBadge } from "@zo/assets/brands";
import Icon from "@zo/assets/icons";
import { useProfile } from "@zo/auth";
import React, { useState } from "react";
import { Button } from "../common";
import { FounderNFTsModal } from "../modals";

interface FounderBarProps {}

const FounderBar: React.FC<FounderBarProps> = () => {
  const { profile } = useProfile();

  const [isFounderNFTsModalVisible, setFounderNFTsModalVisible] =
    useState<boolean>(false);

  return profile?.membership === "founder" ? (
    <div className="flex flex-col md:flex-row md:items-center p-4 mb-4 bg-zui-yellow border border-zui-black text-zui-black justify-between">
      <div className="flex items-center">
        <div className="hidden md:flex">
          <Icon name="FounderBadge" size={64} />
        </div>
        <div className="md:hidden">
          <Icon name="FounderBadge" size={32} />
        </div>
        <h2 className="ml-4 font-bold text-xl md:text-2xl">Founder Member</h2>
      </div>
      <Button
        fixedsize
        icon="arrow-right"
        className="bg-black mt-4 md:mt-0"
        onClick={setFounderNFTsModalVisible.bind(null, true)}
      >
        View your Founder NFTs
      </Button>
      {isFounderNFTsModalVisible && (
        <FounderNFTsModal
          close={setFounderNFTsModalVisible.bind(null, false)}
        />
      )}
    </div>
  ) : null;
};

export default FounderBar;
