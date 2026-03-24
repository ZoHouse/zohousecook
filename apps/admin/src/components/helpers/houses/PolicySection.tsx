import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import EmojiPicker, { Theme } from "emoji-picker-react";
import React, { useEffect, useState } from "react";
import { TextAreaPolicy } from "../../ui";

export type Policy = {
  title: string;
  icon: string;
};

interface PolicySectionProps {
  policies: Policy[];
  setPolicies: React.Dispatch<React.SetStateAction<Policy[]>>;
}

const PolicySection: React.FC<PolicySectionProps> = ({
  policies,
  setPolicies,
}) => {
  const [activePolicyIndex, setActivePolicyIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    policies.length === 0
      ? addNewPolicy()
      : setActivePolicyIndex(policies.length - 1);
  }, [policies]);

  const updatePolicy = (index: number, updates: Partial<Policy>) =>
    setPolicies((prevPolicies) =>
      prevPolicies.map((policy, i) =>
        i === index ? { ...policy, ...updates } : policy
      )
    );

  const handleEmojiSelect = (emojiData: any, index: number) =>
    updatePolicy(index, { icon: emojiData.emoji });

  const handleTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    index: number
  ) => updatePolicy(index, { title: e.target.value });

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    const currentPolicy = policies[index];

    if (e.key === "Enter" && !e.shiftKey && currentPolicy?.title.trim()) {
      e.preventDefault();
      addNewPolicy();
    } else if (e.key === "Backspace" && currentPolicy?.title === "") {
      e.preventDefault();
      deletePolicy(index);
    }
  };

  const addNewPolicy = () => {
    const newPolicy: Policy = { title: "", icon: "😊" };
    setPolicies((prevPolicies) => [...prevPolicies, newPolicy]);
    setActivePolicyIndex(policies.length);
  };

  const deletePolicy = (index: number) => {
    const updatedPolicies = policies.filter((_, i) => i !== index);
    setPolicies(updatedPolicies);

    if (updatedPolicies.length === 0) {
      addNewPolicy();
    } else {
      setActivePolicyIndex(Math.max(index - 1, 0));
    }
  };

  const handleTextChangeWrapper =
    (index: number) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleTextChange(e, index);
    };

  const handleKeyDownWrapper =
    (index: number) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      handleKeyDown(e, index);
    };

  return (
    <div className="my-6 p-4">
      {policies.map(({ icon, title }, index) => (
        <div
          key={index}
          className="flex gap-4 items-start mb-2 p-2 rounded-md hover:bg-zui-hover cursor-pointer"
          onClick={setActivePolicyIndex.bind(null, index)}
        >
          <Popover>
            <PopoverTrigger className="cursor-pointer">
              <div className="text-2xl">{icon}</div>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-zui-dark border border-zui-light"
              align="center"
            >
              <EmojiPicker
                theme={Theme.DARK}
                height="400px"
                width="300px"
                autoFocusSearch={true}
                onEmojiClick={(emojiData) =>
                  handleEmojiSelect(emojiData, index)
                }
              />
            </PopoverContent>
          </Popover>
          {activePolicyIndex === index ? (
            <TextAreaPolicy
              value={title}
              policyId={index}
              isActive={activePolicyIndex === index}
              onTextChange={handleTextChangeWrapper(index)}
              onKeyDown={handleKeyDownWrapper(index)}
            />
          ) : (
            <div className="w-full text-white break-words pr-12">{title}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PolicySection;
