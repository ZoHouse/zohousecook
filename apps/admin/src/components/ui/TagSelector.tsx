import Icon, { IconName } from "@zo/assets/icons";
import { cn } from "@zo/utils/font";
import React from "react";

export type TagType = {
  id: string;
  name: string;
  icon?: IconName;
  desctiption?: string;
};

interface TagSelectorProps {
  onSelect: (selectedTags: string[]) => void;
  selectedTagList: string[];
  tagList: TagType[];
  containerClassName?: string;
  tagContainerClassName?: string;
  tagClassName?: string;
  title?: string;
  icon?: IconName;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  tagList,
  onSelect,
  containerClassName,
  tagContainerClassName,
  tagClassName,
  selectedTagList,
  title,
  icon,
}) => {
  const handleOnSelect = (item: TagType) => {
    if (selectedTagList.includes(item.id)) {
      const newList: string[] = selectedTagList.filter(
        (tag) => tag !== item.id
      );
      onSelect(newList);
    } else {
      const newList = [...selectedTagList, item.id];
      onSelect(newList);
    }
  };

  return (
    <div
      className={cn(
        "w-full flex flex-col items-start relative",
        containerClassName
      )}
    >
      <div className="flex space-x-3 mb-4">
        {icon && <Icon name={icon} size={25} fill="#5A5A5A" />}
        {title && <span>{title}</span>}
      </div>
      <div
        className={cn(
          "gap-4 flex flex-wrap justify-start items-start",
          tagContainerClassName
        )}
      >
        {tagList.map((tag: TagType) => {
          const isSelected = selectedTagList.includes(tag.id);
          return (
            <div
              key={tag.id}
              onClick={handleOnSelect.bind(null, tag)}
              className={cn(
                "border flex flex-col items-start justify-between p-4 cursor-pointer",
                isSelected
                  ? "bg-zui-green/10 border-zui-green/10"
                  : "border-zui-silver",
                tagClassName
              )}
            >
              {tag.icon && (
                <Icon
                  name={tag?.icon}
                  size={20}
                  fill={isSelected ? "#CFFF50" : "#5A5A5A"}
                />
              )}

              <p className="text-sm">{tag?.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TagSelector;
