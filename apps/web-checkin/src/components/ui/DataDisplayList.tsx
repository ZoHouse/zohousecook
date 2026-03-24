import { useState } from "react";
import { cn } from "@zo/utils/font";
import { motion, AnimatePresence } from "framer-motion";
import { AngleDown, Edit } from "../icons";
interface DataDisplayListProps {
  className?: string;
  title?: string | React.ReactNode;
  collapsable?: boolean;
  data: {
    icon?: React.ReactNode | string;
    label?: string;
    value?: string;
  }[];
  onEdit?: () => void;
}

const DataDisplayList: React.FC<DataDisplayListProps> = ({
  className,
  title,
  collapsable,
  data,
  onEdit,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        {title && <div className="section-title">{title}</div>}

        <div className="flex items-center gap-2">
          {onEdit && (
            <button onClick={onEdit}>
              <Edit />
            </button>
          )}
          {collapsable && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="justify-self-end"
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <AngleDown />
              </motion.div>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <ul className="space-y-4 mt-4">
              {data.map(
                (item) =>
                  item.label &&
                  item.value && (
                    <li key={item.label}>
                      <span className="mr-4">{item.icon}</span>
                      <span className="body-text mr-1">{item.label}:</span>
                      <strong className="body-text-focus">{item.value}</strong>
                    </li>
                  )
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataDisplayList;
