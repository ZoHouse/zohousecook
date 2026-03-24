import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import Icon from "@zo/assets/icons";
import { GeneralObject } from "@zo/definitions/general";

import { PlusOutlined } from "@ant-design/icons";
import { useQueryApi } from "@zo/auth";
import { cn } from "@zo/utils/font";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { App, Button, Drawer, Select, Spin } from "antd";
import { Operator, Policy as PolicyType } from "apps/admin/src/config";
import { rubikClassName } from "apps/admin/src/utils";
import EmojiPicker, { Theme } from "emoji-picker-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface PolicyProps {
  policies: PolicyType[];
  setPolicies: React.Dispatch<React.SetStateAction<PolicyType[]>>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (policies: PolicyType[]) => void;
  operatorId?: string;
}

function groupPoliciesByTitle(policies: PolicyType[]): {
  [key: string]: PolicyType[];
} {
  return policies.reduce((grouped, policy) => {
    const titleKey = policy.title || ""; // Use empty string if title is not present
    if (!grouped[titleKey]) {
      grouped[titleKey] = [];
    }
    grouped[titleKey].push(policy);
    return grouped;
  }, {} as { [key: string]: PolicyType[] });
}

const Policies: React.FC<PolicyProps> = ({
  policies,
  setPolicies,
  isOpen,
  onClose,
  onSave,
  operatorId,
}) => {
  const { message } = App.useApp();
  const [isAddSectionOpen, setIsAddSectionOpen] = useState<boolean>(false);
  const [selectedPartnerToCopy, setSelectedPartnerToCopy] = useState<
    string | undefined
  >(undefined);

  const { data: allPartners, isLoading: isLoadingPartners } = useQueryApi<
    Operator[]
  >(
    "CAS_OPERATORS",
    {
      enabled: isOpen,
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    "",
    "limit=-1"
  );

  const {
    data: copiedPoliciesData,
    isLoading: isCopyingPolicies,
    error: copyError,
  } = useQueryApi<PolicyType[]>(
    "CAS_OPERATORS",
    {
      enabled: isOpen && !!selectedPartnerToCopy,
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${selectedPartnerToCopy}/policies/`,
    "limit=-1"
  );

  useEffect(() => {
    if (copiedPoliciesData && selectedPartnerToCopy) {
      const copiedPolicies = copiedPoliciesData.map((policy) => ({
        id: policy.id,
        title: policy.title,
        icon: policy.icon,
        description: policy.description,
      }));

      if (copiedPolicies.length === 0) {
        message.warning("Selected partner has no policies to copy");
      } else {
        setPolicies(copiedPolicies as PolicyType[]);
        message.success(
          `Loaded ${copiedPolicies.length} policies. You can edit them before saving.`
        );
      }
    }
  }, [copiedPoliciesData, selectedPartnerToCopy, message, setPolicies]);

  useEffect(() => {
    if (copyError) {
      message.error("Failed to load policies from selected partner");
    }
  }, [copyError, message]);

  const partnerOptions = useMemo(
    () =>
      (allPartners || [])
        .filter((partner) => partner.id !== operatorId)
        .map((partner) => ({
          label: partner.name,
          value: partner.id,
        })),
    [allPartners, operatorId]
  );

  const handleCopyFromPartner = (partnerId: string) => {
    if (!partnerId) return;
    setSelectedPartnerToCopy(partnerId);
  };

  const policyGroupedByTitlte = useMemo(() => {
    return groupPoliciesByTitle(policies);
  }, [policies]);

  const handleNewSectionSave = (policy: PolicyType) => {
    setPolicies((prev) => [
      ...prev,
      { ...policy, id: policy.id },
    ]);
    setIsAddSectionOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedPartnerToCopy(undefined);
    }
  }, [isOpen]);

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title="Manage Policy"
      extra={
        <Button type="primary" onClick={() => onSave(policies)}>
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-4 overflow-visible pb-6">
        {/* Copy from Partner dropdown - always visible */}
        <div className="bg-zui-light border border-zui-stroke p-4 mb-2">
          <label className="block text-sm font-medium text-zui-silver mb-2">
            Copy policies from another partner
          </label>
          <Select
            showSearch
            placeholder="select partner"
            className="w-full"
            size="middle"
            value={selectedPartnerToCopy}
            onChange={handleCopyFromPartner}
            loading={isLoadingPartners || isCopyingPolicies}
            disabled={isCopyingPolicies}
            options={partnerOptions}
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            notFoundContent={
              isLoadingPartners ? <Spin size="small" /> : "No partners found"
            }
          />
          {isCopyingPolicies && (
            <p className="text-xs text-zui-silver mt-2">Loading policies...</p>
          )}
        </div>

        {Object.entries(policyGroupedByTitlte).map(([title, _policies]) => (
          <Policy
            setPolicies={setPolicies}
            key={title}
            title={title}
            policies={_policies}
            allPolicies={policies}
          />
        ))}
        <hr className="horizontal-divider" />
        {isAddSectionOpen ? (
          <PolicyForm
            showTitle={true}
            onSave={handleNewSectionSave}
            isOpen={isAddSectionOpen}
            onClose={() => setIsAddSectionOpen(false)}
            setOpen={setIsAddSectionOpen}
          />
        ) : (
          <Button
            icon={<PlusOutlined />}
            type="default"
            onClick={setIsAddSectionOpen.bind(null, true)}
            className="w-fit"
          >
            Add New Section
          </Button>
        )}
      </div>
    </Drawer>
  );
};

export default Policies;

const Policy: React.FC<{
  title: string;
  policies: PolicyType[];
  setPolicies: (policies: PolicyType[]) => void;
  allPolicies: PolicyType[];
}> = ({ title, policies, setPolicies, allPolicies }) => {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyType | null>(null);

  const handleDeletePolicy = (id: number) => {
    const _policies = allPolicies.filter((policy) => policy.id !== id);
    setPolicies(_policies);
  };

  const handleEditPolicy = (policy: PolicyType) => {
    setSelectedPolicy(policy);
    setIsAddFormOpen(true);
  };

const handleSave = (policy: PolicyType) => {
    if (selectedPolicy) {

  const updatedPolicies = allPolicies.map((existingPolicy) =>
    existingPolicy.id === selectedPolicy.id
      ? { ...policy, id: selectedPolicy.id }
      : existingPolicy
  );

  setPolicies(updatedPolicies);
  setSelectedPolicy(null);
    } else {
      const _policies = [
        ...allPolicies,
        { ...policy, title, id: policy.id },
      ];
      setPolicies(_policies);
    }
    setIsAddFormOpen(false);
  };

  const handleCloseForm = () => {
    setSelectedPolicy(null);
    setIsAddFormOpen(false);
  };

  return (
    <div className={cn("group relative", rubikClassName)} key={title}>
      <span className="flex justify-between items-center mb-4">
        {title && (
          <h3 className={cn("text-xl font-semibold self-start")}>{title}</h3>
        )}
      </span>
      {policies.map((policy) => (
        <div
          className="flex gap-4 items-center w-full mb-4 group/policy relative"
          key={policy.id}
        >
          {policy.icon && <span>{policy.icon}</span>}
          <p className="text-sm font-medium relative w-full max-w-[320px] whitespace-normal">
            {policy.description}
          </p>
          {!isAddFormOpen && (
            <div className="flex items-center gap-2 invisible group-hover/policy:visible">
              <button
                title="Edit Policy"
                className="bg-zui-light p-2"
                onClick={handleEditPolicy.bind(null, policy)}
              >
                <Icon name="Edit" fill="#fff" size={16} />
              </button>
              <button
                title="Delete Policy"
                className="bg-zui-light p-2"
                onClick={handleDeletePolicy.bind(null, policy.id)}
              >
                <Icon name="Delete" fill="#fff" size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
      {isAddFormOpen ? (
        <PolicyForm
          onSave={handleSave}
          isOpen={isAddFormOpen}
          setOpen={setIsAddFormOpen}
          selectedPolicy={selectedPolicy}
          showTitle={isValidObject(selectedPolicy)}
          onClose={handleCloseForm}
        />
      ) : (
        <Button
          icon="Plus"
          type="default"
          onClick={setIsAddFormOpen.bind(null, true)}
        >
          New Policy
        </Button>
      )}

      <hr className=" border-t border-zui-silver mt-4" />
    </div>
  );
};

const PolicyForm: React.FC<{
  className?: string;
  setOpen: (open: boolean) => void;
  isOpen: boolean;
  selectedPolicy?: PolicyType | null;
  onSave: (policy: PolicyType) => void;
  onClose: () => void;
  showTitle?: boolean;
}> = ({
  className,
  setOpen,
  isOpen,
  selectedPolicy,
  onSave,
  onClose,
  showTitle = false,
}) => {
  const addPolicyFormRef = useRef<HTMLDivElement>(null);

  const [policy, setPolicy] = useState<GeneralObject>(
    selectedPolicy
      ? {
          ...selectedPolicy,
        }
      : {
          title: "",
          description: "",
          icon: "",
        }
  );

  const handleAddPolicy = () => {
    onSave(policy as PolicyType);
    setOpen(false);
  };

  const handleEmojiSelect = (emojiData: any) =>
    setPolicy((prev) => ({ ...prev, icon: emojiData.emoji }));

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setPolicy({ ...policy, [e.target.name]: e.target.value });
  };

  //   when isOpen is true scroll to the form
  useEffect(() => {
    if (isOpen) {
      addPolicyFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [isOpen]);

  return (
    <div
      ref={addPolicyFormRef}
      className={cn(
        "flex flex-col gap-4 w-full bg-zui-light border border-zui-stroke p-4 overflow-x-visible",
        className
      )}
    >
      {showTitle && (
        <div>
          <input
            className="bg-transparent px-4 py-2 border border-zui-stroke w-full focus:outline-none"
            type="text"
            name="title"
            id="title"
            value={policy.title}
            placeholder="Title"
            onChange={handleChange}
          />
        </div>
      )}
      <div className="flex gap-4 items-start w-full">
        <div className="relative">
          <Popover>
            <PopoverTrigger className="cursor-pointer">
              {isValidString(policy.icon) ? (
                <div className="text-2xl py-2">{policy.icon}</div>
              ) : (
                <div className="cursor-pointer border-2 border-zui-stroke p-2">
                  <Icon name="Plus" fill="#5A5A5A" size={24} />
                </div>
              )}
            </PopoverTrigger>
            <PopoverContent
              className="w-fit p-0 bg-zui-dark border border-zui-light z-30"
              align="center"
            >
              <EmojiPicker
                theme={Theme.DARK}
                style={{
                  top: "0",
                  zIndex: 1000,
                }}
                height="400px"
                width="300px"
                autoFocusSearch={true}
                onEmojiClick={handleEmojiSelect}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex-1">
          <textarea
            value={policy.description}
            className="bg-transparent px-4 py-2 border border-zui-stroke w-full focus:outline-none"
            name="description"
            id="description"
            placeholder="Description"
            rows={4}
            onChange={handleChange}
          ></textarea>
        </div>
      </div>
      <div className="flex gap-4 z-0">
        <Button type="link" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!isValidString(policy.description)}
          type="primary"
          onClick={handleAddPolicy}
        >
          Add
        </Button>
      </div>
    </div>
  );
};
