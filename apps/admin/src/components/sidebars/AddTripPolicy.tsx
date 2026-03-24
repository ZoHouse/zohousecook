import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import Icon from "@zo/assets/icons";
import { GeneralObject } from "@zo/definitions/general";

import { PlusOutlined } from "@ant-design/icons";
import { cn } from "@zo/utils/font";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { Button, Drawer } from "antd";
import { Policy as PolicyType } from "apps/admin/src/config";
import { rubikClassName } from "apps/admin/src/utils";
import EmojiPicker, { Theme } from "emoji-picker-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface PolicyProps {
  policies: PolicyType[];
  setPolicies: React.Dispatch<React.SetStateAction<PolicyType[]>>;
  isOpen: boolean;
  onClose: () => void;
  onSave: (policies: PolicyType[]) => void;
}

function groupPoliciesByTitle(policies: PolicyType[]): {
  [key: string]: PolicyType[];
} {
  return policies.reduce((grouped, policy) => {
    const titleKey = policy.title || "";
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
}) => {
  const [isAddSectionOpen, setIsAddSectionOpen] = useState<boolean>(false);

  const policyGroupedByTitle = useMemo(() => {
    return groupPoliciesByTitle(policies);
  }, [policies]);

  const handleNewSectionSave = (policy: PolicyType) => {
    setPolicies((prev) => {
      const existingSortIndexes = prev.map((p) => p.sort_index || 0);
      const nextSortIndex =
        existingSortIndexes.length > 0
          ? Math.min(...existingSortIndexes) - 1
          : prev.length;
      const updatedPolicies = [
        ...prev,
        {
          ...policy,
          sort_index: nextSortIndex,
        },
      ];
      return updatedPolicies;
    });
    setIsAddSectionOpen(false);
  };

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
        {Object.entries(policyGroupedByTitle).map(([title, _policies]) => (
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
      const _policies = allPolicies.map((p) =>
        p.id === selectedPolicy.id
          ? { ...policy, sort_index: selectedPolicy.sort_index }
          : p
      );
      setPolicies(_policies);
      setSelectedPolicy(null);
    } else {
      const existingSortIndexes = allPolicies.map((p) => p.sort_index || 0);
      const nextSortIndex =
        existingSortIndexes.length > 0
          ? Math.min(...existingSortIndexes) - 1
          : allPolicies.length;
      const _policies = [
        ...allPolicies,
        {
          ...policy,
          title,
          sort_index: nextSortIndex,
        },
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
          className="flex gap-4 items-center w-full mb-4 relative"
          key={policy.id}
        >
          {policy.icon && <span>{policy.icon}</span>}
          <p className="text-sm font-medium relative w-full max-w-[320px] whitespace-normal">
            {policy.description}
          </p>
          {!isAddFormOpen && (
            <div className="flex items-center gap-2">
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

  const [policy, setPolicy] = useState<GeneralObject>(() => {
    if (selectedPolicy) {
      return { ...selectedPolicy };
    }

    const initialPolicy = {
      title: "",
      description: "",
      icon: "",
      sort_index: 0,
    };
    return initialPolicy;
  });

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
