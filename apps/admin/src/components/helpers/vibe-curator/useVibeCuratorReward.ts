import { useMutationApi } from "@zo/auth";
import { processResponseError } from "@zo/utils/auth";
import { App } from "antd";
import { useForm } from "antd/es/form/Form";
import type { UploadFile } from "antd/es/upload/interface";
import { useCallback, useMemo, useState } from "react";
import { parsePhoneNumberIntoCountryCodeAndPhoneNumber } from "../../Form/FormElement/Phone";
import { FilterType, RewardEntry, RewardStats } from "./EntriesTable";

const CREDITS_DECIMALS = 8;

export const useVibeCuratorReward = (onClose: () => void) => {
  const [Form] = useForm();
  const { message } = App.useApp();
  const [rewardEntries, setRewardEntries] = useState<RewardEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { mutateAsync: addVibeCuratorReward } = useMutationApi(
    "CAS_REWARDS_VIBE_CURATORS",
    {},
    "",
    "POST"
  );

  const formatCredits = (displayValue: number) => {
    return displayValue * Math.pow(10, CREDITS_DECIMALS);
  };

  // Reset and close
  const handleClose = useCallback(() => {
    Form.resetFields();
    setRewardEntries([]);
    setProcessedCount(0);
    setIsProcessing(false);
    setActiveFilter("all");
    setSelectedRowKeys([]);
    onClose();
  }, [onClose, Form]);

  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add single entry
  const handleAddEntry = useCallback(() => {
    Form.validateFields().then((values) => {
      const parsed = parsePhoneNumberIntoCountryCodeAndPhoneNumber(
        values.mobile_number
      );
      const mobile_country_code = parsed
        ? parsed.countryCode.replace("+", "")
        : "91";
      const mobile_number = parsed ? parsed.phoneNumber : values.mobile_number;

      const newEntry: RewardEntry = {
        id: generateId(),
        mobile_country_code,
        mobile_number,
        credits: values.credits,
        $zo: values["$zo"],
        status: "pending",
      };

      setRewardEntries((prev) => [...prev, newEntry]);
      Form.resetFields();
      message.success("Entry added to list");
    });
  }, [Form, message]);

  // Remove single entry
  const handleRemoveEntry = useCallback((id: string) => {
    setRewardEntries((prev) => prev.filter((entry) => entry.id !== id));
    setSelectedRowKeys((prev) => prev.filter((key) => key !== id));
  }, []);

  // Remove selected entries
  const handleRemoveSelected = useCallback(() => {
    const count = selectedRowKeys.length;
    setRewardEntries((prev) =>
      prev.filter((entry) => !selectedRowKeys.includes(entry.id))
    );
    setSelectedRowKeys([]);
    message.success(`Removed ${count} entries`);
  }, [selectedRowKeys, message]);

  // Parse CSV file
  const parseCSV = (csvText: string): Omit<RewardEntry, "id" | "status">[] => {
    const lines = csvText.trim().split("\n");
    const entries: Omit<RewardEntry, "id" | "status">[] = [];

    // Skip header row if present
    const startIndex = lines[0]?.toLowerCase().includes("mobile") ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map((v) => v.trim());

      // Expected format: mobile_country_code, mobile_number, credits, $zo
      entries.push({
        mobile_country_code: values[0].replace("+", ""),
        mobile_number: values[1],
        credits: parseFloat(values[2]) || 0,
        $zo: parseFloat(values[3]) || 0,
      });
    }

    return entries;
  };

  // Handle CSV upload

  const handleCSVUpload = useCallback(
    (file: UploadFile) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsedEntries = parseCSV(text);

        const newEntries: RewardEntry[] = parsedEntries.map((entry) => ({
          ...entry,
          id: generateId(),
          status: "pending" as const,
        }));

        setRewardEntries((prev) => [...prev, ...newEntries]);
        message.success(`${newEntries.length} entries added from CSV`);
      };
      reader.readAsText(file as unknown as Blob);
      return false;
    },
    [message]
  );

  // Process all entries
  const handleProcessAllEntries = useCallback(async () => {
    const entriesToProcess = rewardEntries.filter(
      (e) => e.status === "pending" || e.status === "failed"
    );

    if (entriesToProcess.length === 0) {
      message.warning("No entries to process");
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);

    const updatedEntries = [...rewardEntries];
    let processed = 0;

    for (let i = 0; i < updatedEntries.length; i++) {
      const entry = updatedEntries[i];

      if (entry.status === "success") continue;

      updatedEntries[i] = { ...entry, status: "processing", error: undefined };
      setRewardEntries([...updatedEntries]);

      try {
        await addVibeCuratorReward({
          data: {
            mobile_country_code: entry.mobile_country_code,
            mobile_number: entry.mobile_number,
            credits: formatCredits(entry.credits),
            $zo: entry.$zo,
          },
        });

        updatedEntries[i] = { ...entry, status: "success", error: undefined };
      } catch (error) {
        const errorMsg = processResponseError(error);
        updatedEntries[i] = {
          ...entry,
          status: "failed",
          error: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg,
        };
      }

      setRewardEntries([...updatedEntries]);
      processed++;
      setProcessedCount(processed);
    }

    setIsProcessing(false);

    const successCount = updatedEntries.filter(
      (e) => e.status === "success"
    ).length;
    const failedCount = updatedEntries.filter(
      (e) => e.status === "failed"
    ).length;

    if (failedCount === 0) {
      message.success(`All ${successCount} entries processed successfully!`);
    } else {
      message.warning(
        `Processed: ${successCount} success, ${failedCount} failed`
      );
    }
  }, [rewardEntries, addVibeCuratorReward, message]);

  // Stats
  const stats: RewardStats = useMemo(() => {
    const total = rewardEntries.length;
    const pending = rewardEntries.filter((e) => e.status === "pending").length;
    const success = rewardEntries.filter((e) => e.status === "success").length;
    const failed = rewardEntries.filter((e) => e.status === "failed").length;
    const processing = rewardEntries.filter(
      (e) => e.status === "processing"
    ).length;
    const totalCredits = rewardEntries.reduce((sum, e) => sum + e.credits, 0);
    const totalZo = rewardEntries.reduce((sum, e) => sum + e.$zo, 0);
    return {
      total,
      pending,
      success,
      failed,
      processing,
      totalCredits,
      totalZo,
    };
  }, [rewardEntries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    if (activeFilter === "all") return rewardEntries;
    return rewardEntries.filter((e) => e.status === activeFilter);
  }, [rewardEntries, activeFilter]);

  // Entries to process count
  const entriesToProcess = useMemo(
    () =>
      rewardEntries.filter(
        (e) => e.status === "pending" || e.status === "failed"
      ).length,
    [rewardEntries]
  );

  return {
    Form,
    // State
    rewardEntries,
    isProcessing,
    processedCount,
    activeFilter,
    setActiveFilter,
    selectedRowKeys,
    setSelectedRowKeys,
    // Computed
    stats,
    filteredEntries,
    entriesToProcess,
    // Actions
    handleClose,
    handleAddEntry,
    handleRemoveEntry,
    handleRemoveSelected,
    handleCSVUpload,
    handleProcessAllEntries,
  };
};
