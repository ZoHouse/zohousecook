import { LoadingOutlined } from "@ant-design/icons";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { processResponseError } from "@zo/utils/auth";
import { formatCapitalize, isValidString } from "@zo/utils/string";
import React, { useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { useReadContract } from "wagmi";
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Statistic,
  Spin,
  message,
} from "antd";

interface AirdropInfoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  airdropDetails: GeneralObject;
  isLoadingAirdrop: boolean;
  isRefetchingAirdrop: boolean;
  seedData: GeneralObject;
}

const AirdropInfoSidebar: React.FC<AirdropInfoSidebarProps> = ({
  isOpen,
  onClose,
  airdropDetails,
  seedData,
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [cityWallet, setCityWallet] = useState<string>("");

  const { mutate: createAirdrop } = useMutationApi(
    "CAS_NFTAIRDROPS",
    {},
    "",
    "POST"
  );

  const { data: contractData } = useQueryApi<GeneralObject>(
    "CAS_EVM_CONTRACTS",
    {
      enabled: isValidString(airdropDetails?.id),
      select: (data) => data.data,
      refetchOnWindowFocus: false,
    },
    `${airdropDetails?.contract?.id}/`
  );

  const { data: allowanceData, isLoading: isLoadingAllowance } =
    useReadContract({
      address: airdropDetails?.contract?.address,
      abi: contractData?.abi,
      chainId: airdropDetails?.contract?.chain?.ref_id,
      functionName: "allowance",
      args: [seedData?.["zo-points-treasury-address"], cityWallet],
    });

  const currentAllowance = useMemo(() => {
    if (!allowanceData) return "0.00";
    const allowanceValue = Number(allowanceData.toString()) / Math.pow(10, 8);
    return allowanceValue.toFixed(2);
  }, [allowanceData]);

  const hasSufficientAllowance = useMemo(() => {
    if (!allowanceData) return false;
    return BigInt(allowanceData.toString()) > BigInt(0);
  }, [allowanceData]);

  const cityWalletOptions = useMemo(() => {
    if (!seedData?.["city-wallets"]) return [];
    return seedData["city-wallets"].map((cityWallet: GeneralObject) => ({
      label: cityWallet.name,
      value: cityWallet.address,
    }));
  }, [seedData]);

  const handleSave = (values: GeneralObject) => {
    if (!airdropDetails?.id || !values.wallet?.id || !values.value) return;

    createAirdrop(
      {
        data: {
          collection: airdropDetails.id,
          transacted_from: cityWallet,
          web3_wallet: values.wallet.id,
          drop_function_inputs: {
            from: seedData?.["zo-points-treasury-address"],
            to: values.wallet.wallet_address,
            value: values.value * Math.pow(10, 8),
          },
        },
      },
      {
        onSuccess() {
          message.success("Airdrop created successfully");
          queryClient.invalidateQueries(["cas", "inventory"]);
          form.resetFields();
          onClose();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleCityWalletChange = (value: string) => {
    setCityWallet(value);
    form.setFieldsValue({ city_wallet: value });
  };

  const isCreateButtonDisabled = (values: GeneralObject) => {
    if (!values?.value || !allowanceData) return true;
    return values.value * Math.pow(10, 8) > Number(allowanceData);
  };

  const handleClose = () => {
    form.resetFields();
    setCityWallet("");
    onClose();
  };

  return (
    <Drawer
      title="Add Zo Points"
      onClose={handleClose}
      open={isOpen}
      extra={
        <Button
          type="primary"
          htmlType="submit"
          form="airdropForm"
          disabled={isCreateButtonDisabled(form.getFieldsValue())}
        >
          Save
        </Button>
      }
    >
      <Form
        id="airdropForm"
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="h-full"
      >
        {cityWallet && (
          <div className="mb-6">
            {isLoadingAllowance ? (
              <Spin
                indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
              />
            ) : (
              <Statistic
                title="Current Allowance"
                value={currentAllowance}
                precision={2}
                suffix="Points"
              />
            )}
          </div>
        )}

        <Form.Item
          name="city_wallet"
          label="City Wallet"
          rules={[{ required: true, message: "Please select a city wallet" }]}
        >
          <Select
            options={cityWalletOptions}
            size="large"
            placeholder="Select city wallet"
            onChange={handleCityWalletChange}
          />
        </Form.Item>

        {hasSufficientAllowance &&
          airdropDetails?.drop_function?.inputs?.map((input: any) => {
            if (input.type === "address" && input.name === "to") {
              return (
                <Form.Item
                  key={input.name}
                  name="wallet"
                  label={formatCapitalize(input.name)}
                  rules={[{ required: true, message: "Please select a user" }]}
                >
                  <Select
                    showSearch
                    placeholder="Search for user"
                    optionFilterProp="children"
                    optionLabelProp="label"
                  >
                    {/* Add user options here */}
                  </Select>
                </Form.Item>
              );
            }

            if (input.type === "uint256") {
              return (
                <Form.Item
                  key={input.name}
                  name="value"
                  label={formatCapitalize(input.name)}
                  rules={[
                    { required: true, message: "Please enter a value" },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        if (value * Math.pow(10, 8) > Number(allowanceData)) {
                          return Promise.reject(
                            "Value exceeds current allowance"
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input type="number" min="0" step="0.01" />
                </Form.Item>
              );
            }

            return null;
          })}
      </Form>
    </Drawer>
  );
};

export default AirdropInfoSidebar;
