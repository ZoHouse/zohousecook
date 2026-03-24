import { UserOutlined } from "@ant-design/icons";
import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page, PageContent, PageHeader } from "@zo/moal";
import {
  Alert,
  Avatar,
  Card,
  Col,
  Descriptions,
  Divider,
  Image,
  Rate,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

const User: NextPage = () => {
  const router = useRouter();
  const { slug } = router.query;

  // --- State for Pagination ---
  const [paginationState, setPaginationState] = useState({
    devices: { current: 1, pageSize: 10 },
    zoHouseBookings: { current: 1, pageSize: 10 },
    tripBookings: { current: 1, pageSize: 10 },
    reviews: { current: 1, pageSize: 10 },
    zostelStayBookings: { current: 1, pageSize: 10 },
    ledger: { current: 1, pageSize: 10 },
  });

  // Helper to update pagination state for a specific table
  const handleTableChange = (
    tableKey: keyof typeof paginationState,
    pagination: any
  ) => {
    setPaginationState((prev) => ({
      ...prev,
      [tableKey]: {
        current: pagination.current,
        pageSize: pagination.pageSize,
      },
    }));
  };
  // --- End State for Pagination ---

  const {
    data: userData,
    isLoading,
    error,
  } = useQueryApi<GeneralObject>(
    "CAS_USERS",
    {
      select: (data: any) => data.data,
      enabled: !!slug,
      refetchOnWindowFocus: false,
    },
    slug ? `${slug as string}/` : undefined
  );

  // --- API Calls with Pagination ---
  const { data: userDevices, isLoading: isLoadingUserDevices } = useQueryApi(
    "CAS_USERDEVICES", // Endpoint Key
    {
      select: (data: any) => data.data,
      enabled: typeof slug === "string",
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    },
    "", // Path Segment
    // Query Params
    `user=${slug}&limit=${paginationState.devices.pageSize}&offset=${
      (paginationState.devices.current - 1) * paginationState.devices.pageSize
    }`
  );

  const { data: userTripBookings, isLoading: isLoadingUserTripBookings } =
    useQueryApi(
      "CAS_TRIP_BOOKINGS", // Endpoint Key
      {
        select: (data: any) => data.data,
        enabled: typeof slug === "string",
        keepPreviousData: true,
        refetchOnWindowFocus: false,
      },
      "", // Path Segment
      // Query Params
      `user=${slug}&limit=${paginationState.tripBookings.pageSize}&offset=${
        (paginationState.tripBookings.current - 1) *
        paginationState.tripBookings.pageSize
      }`
    );

  // const { data: zostelStayBookings, isLoading: isLoadingZostelStayBookings } =
  //   useQueryApi(
  //     "CRS_USER_BOOKINGS",
  //     {
  //       select: (data: any) => data.data,
  //       enabled: !!userData?.profile?.id,
  //       keepPreviousData: true,
  //       refetchOnWindowFocus: false,
  //     },
  //     `${userData?.profile?.id}/`, // Path Segment
  //     // Query Params
  //     `limit=${paginationState.zostelStayBookings.pageSize}&offset=${
  //       (paginationState.zostelStayBookings.current - 1) *
  //       paginationState.zostelStayBookings.pageSize
  //     }`
  //   );

  const { data: userLedger, isLoading: isLoadingUserLedger } = useQueryApi(
    "CAS_LEDGER",
    {
      select: (data: any) => data.data,
      enabled: !!slug,
    },
    "",
    // Query Params
    `web3_wallet__user=${slug}&limit=${
      paginationState.ledger.pageSize
    }&offset=${
      (paginationState.ledger.current - 1) * paginationState.ledger.pageSize
    }`
  );

  const { data: userLedgerBalance, isLoading: isLoadingUserLedgerBalance } =
    useQueryApi<number>(
      "CAS_LEDGER",
      {
        select: (data: any) => data.data.balance,
        enabled: !!slug,
      },
      `${slug}/balance/`
    );

  const { data: userReviews, isLoading: isLoadingUserReviews } = useQueryApi(
    "CAS_REVIEWS", // Endpoint Key
    {
      select: (data: any) => data.data,
      enabled: typeof slug === "string",
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    },
    "", // Path Segment
    // Query Params
    `user=${slug}&limit=${paginationState.reviews.pageSize}&offset=${
      (paginationState.reviews.current - 1) * paginationState.reviews.pageSize
    }`
  );

  const { data: userZoHouseBookings, isLoading: isLoadingZoHouseBookings } =
    useQueryApi(
      "CAS_STAY_BOOKINGS", // Endpoint Key
      {
        select: (data: any) => data.data,
        enabled: typeof slug === "string",
        keepPreviousData: true,
        refetchOnWindowFocus: false,
      },
      "", // Path Segment
      // Query Params
      `user=${slug}&limit=${paginationState.zoHouseBookings.pageSize}&offset=${
        (paginationState.zoHouseBookings.current - 1) *
        paginationState.zoHouseBookings.pageSize
      }`
    );
  // --- End API Calls ---

  const renderJson = (jsonData: any) => {
    try {
      // Attempt to parse if it's a string, otherwise assume it's an object
      const obj =
        typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
      return <pre>{JSON.stringify(obj, null, 2)}</pre>;
    } catch (e) {
      // If parsing fails or it's not valid JSON/object, display as string
      return <Typography.Text>{String(jsonData)}</Typography.Text>;
    }
  };

  const formatLabel = (key: string): string => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderSocialValue = (value: any) => {
    if (typeof value === "boolean") {
      return <Tag color={value ? "green" : "red"}>{value ? "Yes" : "No"}</Tag>;
    }
    // Render simple arrays as comma-separated strings in a tag
    if (Array.isArray(value)) {
      const simpleArray = value.every(
        (item) => typeof item === "string" || typeof item === "number"
      );
      if (simpleArray) {
        return (
          <Space wrap size={[0, 8]}>
            {value.map((item, index) => (
              <Tag key={index}>{item}</Tag>
            ))}
          </Space>
        );
      }
    }
    // Render nested objects/complex arrays using the existing renderJson logic
    if (typeof value === "object" && value !== null) {
      return renderJson(value); // Reuse renderJson for complex nested structures
    }
    if (value === null || typeof value === "undefined") {
      return <Typography.Text type="secondary">N/A</Typography.Text>;
    }

    // Try to render URLs as links
    if (
      typeof value === "string" &&
      (value.startsWith("http://") || value.startsWith("https://"))
    ) {
      try {
        new URL(value);
        return (
          <Typography.Link href={value} target="_blank">
            {value}
          </Typography.Link>
        );
      } catch (_) {
        // Not a valid URL, render as string
      }
    }

    return String(value);
  };

  // Helper function to recursively render flattened data for social cards
  const renderFlattenedData = (
    data: any,
    parentKey: string = ""
  ): React.ReactNode[] | null => {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      // Handle non-objects or arrays directly if needed, though current structure focuses on objects
      return null;
    }

    return Object.entries(data).flatMap(([key, value]): React.ReactNode[] => {
      const currentLabel = formatLabel(key);

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // If the value is a nested object, recurse
        // We don't display a label for the object container itself, just its contents
        const nestedNodes = renderFlattenedData(value, key);
        return nestedNodes ? nestedNodes : []; // Return empty array if recursion returns null
      } else {
        // Otherwise, render the key-value pair
        return [
          <Descriptions.Item key={`${parentKey}-${key}`} label={currentLabel}>
            {renderSocialValue(value)}
          </Descriptions.Item>,
        ];
      }
    });
  };

  // Define Table Columns
  const deviceColumns: ColumnsType<any> = [
    {
      title: "Device ID",
      dataIndex: "device_id",
      key: "device_id",
      ellipsis: true,
    },
    {
      title: "Platform",
      dataIndex: ["client", "platform"],
      key: "platform",
    },
    {
      title: "Application",
      dataIndex: ["client", "application", "name"],
      key: "application",
    },
    {
      title: "Revoked",
      dataIndex: "revoked",
      key: "revoked",
      render: (revoked) => (
        <Tag color={revoked ? "red" : "green"}>{revoked ? "Yes" : "No"}</Tag>
      ),
    },
    {
      title: "Client Version",
      dataIndex: "client_version",
      key: "client_version",
    },
    {
      title: "Device Info",
      dataIndex: "device_info",
      key: "device_info",
      render: (info) => renderJson(info), // Use renderJson for complex object
      ellipsis: true,
    },
  ];

  const bookingColumns: ColumnsType<any> = [
    { title: "Booking PID", dataIndex: "pid", key: "pid" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag>{status}</Tag>,
    },
    {
      title: "Start Date",
      dataIndex: "start_at",
      key: "start_at",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "End Date",
      dataIndex: "end_at",
      key: "end_at",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Final Amount",
      dataIndex: "final_amount",
      key: "final_amount",
      render: (amount) => (amount / 10 ** 9).toFixed(2), // Assuming 9 decimal places
    },
    {
      title: "Reserved By",
      dataIndex: ["reserved_by", "nickname"],
      key: "reserved_by",
      render: (nickname, record) =>
        nickname || record.reserved_by?.pid || "N/A",
    },
    {
      title: "SKUs Booked",
      dataIndex: "booked_skus",
      key: "skus",
      render: (skus) => skus?.length || 0,
    },
  ];

  const reviewColumns: ColumnsType<any> = [
    { title: "Review ID", dataIndex: "id", key: "id", ellipsis: true },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      render: (rating) => <Rate disabled defaultValue={rating} />,
    },
    {
      title: "Comment",
      dataIndex: "comment",
      key: "comment",
      ellipsis: true,
    },
    {
      title: "Booking Ref",
      dataIndex: "booking_ref_id",
      key: "booking_ref_id",
    },
    { title: "Source", dataIndex: "source", key: "source" },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  // --- Define Table Columns ---

  const walletColumns: ColumnsType<any> = [
    {
      title: "Address",
      dataIndex: "wallet_address",
      key: "address",
      render: (address) => (
        <Typography.Text copyable>{address}</Typography.Text>
      ),
      ellipsis: true,
    },
    { title: "Type", dataIndex: "address_type", key: "type" },
    {
      title: "Primary",
      dataIndex: "primary",
      key: "primary",
      render: (isPrimary) => (
        <Tag color={isPrimary ? "blue" : "default"}>
          {isPrimary ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Verified",
      dataIndex: "verified",
      key: "verified",
      render: (isVerified) => (
        <Tag color={isVerified ? "green" : "red"}>
          {isVerified ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Custodial",
      dataIndex: "is_custodial",
      key: "custodial",
      render: (isCustodial) => <Tag>{isCustodial ? "Yes" : "No"}</Tag>,
    },
    {
      title: "Delegate",
      dataIndex: "is_delegate",
      key: "delegate",
      render: (isDelegate) => <Tag>{isDelegate ? "Yes" : "No"}</Tag>,
    },
    {
      title: "Added At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  const emailColumns: ColumnsType<any> = [
    {
      title: "Email Address",
      dataIndex: "email_address",
      key: "email",
      render: (email) => <Typography.Text copyable>{email}</Typography.Text>,
      ellipsis: true,
    },
    {
      title: "Primary",
      dataIndex: "primary",
      key: "primary",
      render: (isPrimary) => (
        <Tag color={isPrimary ? "blue" : "default"}>
          {isPrimary ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Verified",
      dataIndex: "verified",
      key: "verified",
      render: (isVerified) => (
        <Tag color={isVerified ? "green" : "red"}>
          {isVerified ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Verification Type",
      dataIndex: "verification_type",
      key: "verification_type",
    },
    {
      title: "DND",
      dataIndex: "dnd",
      key: "dnd",
      render: (isDnd) => (
        <Tag color={isDnd ? "orange" : "default"}>{isDnd ? "Yes" : "No"}</Tag>
      ),
    },
    {
      title: "Promotional",
      dataIndex: "promotional",
      key: "promotional",
      render: (isPromo) => (
        <Tag color={isPromo ? "geekblue" : "default"}>
          {isPromo ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Added At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  const mobileColumns: ColumnsType<any> = [
    {
      title: "Number",
      key: "number",
      render: (_, record) => (
        <Typography.Text copyable>
          +{record.mobile_country_code} {record.mobile_number}
        </Typography.Text>
      ),
    },
    {
      title: "Primary",
      dataIndex: "primary",
      key: "primary",
      render: (isPrimary) => (
        <Tag color={isPrimary ? "blue" : "default"}>
          {isPrimary ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Verified",
      dataIndex: "verified",
      key: "verified",
      render: (isVerified) => (
        <Tag color={isVerified ? "green" : "red"}>
          {isVerified ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "WhatsApp",
      dataIndex: "has_whatsapp",
      key: "whatsapp",
      render: (hasWhatsApp) => (
        <Tag color={hasWhatsApp ? "green" : "default"}>
          {hasWhatsApp ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "DND",
      dataIndex: "dnd",
      key: "dnd",
      render: (isDnd) => (
        <Tag color={isDnd ? "orange" : "default"}>{isDnd ? "Yes" : "No"}</Tag>
      ),
    },
    {
      title: "Added At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  const userDisplayName = useMemo(
    () => userData?.profile?.nickname || userData?.profile?.full_name || slug,
    [userData?.profile?.nickname, userData?.profile?.full_name, slug]
  );

  // --- Ledger Table Columns ---
  const ledgerColumns: ColumnsType<any> = [
    {
      title: "Wallet Address",
      dataIndex: "wallet_address",
      key: "wallet_address",
      render: (address) => (
        <Typography.Text copyable>{address}</Typography.Text>
      ),
      ellipsis: true,
    },
    {
      title: "From Address",
      dataIndex: "from_address",
      key: "from_address",
      render: (address) => (
        <Typography.Text copyable>{address}</Typography.Text>
      ),
      ellipsis: true,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      // Add formatting if needed, e.g., for decimals
      render: (amount) => amount, // Basic render for now
    },
    {
      title: "Transaction Hash",
      dataIndex: "transaction_hash",
      key: "transaction_hash",
      render: (hash) => (
        <Typography.Link
          href={`https://basescan.org/tx/${hash}`}
          target="_blank"
          copyable
        >
          {hash}
        </Typography.Link>
      ),
      ellipsis: true,
    },
    {
      title: "Block Number",
      dataIndex: "block_number",
      key: "block_number",
    },
  ];

  return (
    <Page
      breadCrumbs={[
        { label: "Users", href: "/users" },
        {
          label: userDisplayName,
          href: `/users/${slug}`,
        },
      ]}
    >
      <PageHeader title={userDisplayName} />
      <PageContent>
        {isLoading && <Spin size="large" />}
        {error && (
          <Alert
            message="Error loading user data"
            type="error"
            description={error.message}
            showIcon
          />
        )}
        {userData && !isLoading && !error && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card title="Basic Information">
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="User ID">
                  {userData.id}
                </Descriptions.Item>
                <Descriptions.Item label="Membership">
                  {userData.membership}
                </Descriptions.Item>
                <Descriptions.Item label="Verified">
                  <Tag color={userData.verified ? "green" : "red"}>
                    {userData.verified ? "Yes" : "No"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {new Date(userData.created_at).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Updated At">
                  {new Date(userData.updated_at).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Scheduled Erase">
                  <Tag color={userData.scheduled_erase ? "orange" : "default"}>
                    {userData.scheduled_erase ? "Yes" : "No"}
                  </Tag>
                </Descriptions.Item>
                {userData.merged_into && (
                  <Descriptions.Item label="Merged Into">
                    {userData.merged_into}
                  </Descriptions.Item>
                )}
                {userData.founder_token_ids &&
                  userData.founder_token_ids.length > 0 && (
                    <Descriptions.Item
                      label={`Founder Tokens (${userData.founder_token_ids.length})`}
                    >
                      <Space wrap>
                        {userData.founder_token_ids.map((id: string) => (
                          <Tag key={id}>{id}</Tag>
                        ))}
                      </Space>
                    </Descriptions.Item>
                  )}
              </Descriptions>
            </Card>

            {userData.profile && (
              <Card title="Profile">
                <Descriptions
                  bordered
                  column={{ xs: 1, sm: 1, md: 2 }}
                  size="small"
                >
                  <Descriptions.Item label="Profile Picture" span={2}>
                    <Space align="center">
                      <Avatar
                        size={64}
                        src={userData.profile.pfp_image}
                        icon={<UserOutlined />}
                      />
                      <Typography.Link
                        href={userData.profile.pfp_image}
                        target="_blank"
                      >
                        View Full Image
                      </Typography.Link>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="PID">
                    {userData.profile.pid}
                  </Descriptions.Item>
                  <Descriptions.Item label="$Zo Balance">
                    {isLoadingUserLedgerBalance ? (
                      <Spin size="small" />
                    ) : typeof userLedgerBalance === "number" ? (
                      userLedgerBalance.toLocaleString() // Humanize with commas
                    ) : (
                      <Typography.Text type="secondary">N/A</Typography.Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nickname">
                    {userData.profile.nickname}
                  </Descriptions.Item>
                  <Descriptions.Item label="Full Name">
                    {userData.profile.full_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Gender">
                    {userData.profile.gender || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Date of Birth">
                    {userData.profile.date_of_birth
                      ? new Date(
                          userData.profile.date_of_birth
                        ).toLocaleDateString()
                      : "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Relationship Status">
                    {userData.profile.relationship_status || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Bio" span={2}>
                    {userData.profile.bio}
                  </Descriptions.Item>
                  {userData.profile.country && (
                    <Descriptions.Item label="Country" span={2}>
                      {userData.profile.country.name} (
                      {userData.profile.country.code})
                    </Descriptions.Item>
                  )}
                  {userData.profile.avatar && (
                    <Descriptions.Item label="Citizen Avatar" span={2}>
                      <Space>
                        <Image
                          src={userData.profile.avatar.image}
                          alt="Avatar"
                          width={40}
                          preview={false}
                        />
                        <Typography.Text
                          copyable={{
                            text: userData.profile.avatar.metadata,
                          }}
                        >
                          Metadata Ref: {userData.profile.avatar.ref_id}
                        </Typography.Text>
                      </Space>
                    </Descriptions.Item>
                  )}
                </Descriptions>

                {userData.profile.socials &&
                  userData.profile.socials.length > 0 && (
                    <>
                      <Divider orientation="left">Socials</Divider>
                      <Row gutter={16}>
                        {userData.profile.socials
                          .filter((s: any) => s.category === "telegram")
                          .map((social: any) => (
                            <Col key={social.id} xs={24} md={12}>
                              <Card title="Telegram" size="small">
                                <Descriptions column={1} size="small" bordered>
                                  <Descriptions.Item label="Link">
                                    <Typography.Link
                                      href={social.link}
                                      target="_blank"
                                    >
                                      {social.link}
                                    </Typography.Link>
                                  </Descriptions.Item>
                                  <Descriptions.Item label="Verified">
                                    <Tag
                                      color={social.verified ? "green" : "red"}
                                    >
                                      {social.verified ? "Yes" : "No"}
                                    </Tag>
                                  </Descriptions.Item>
                                  {social.data &&
                                    renderFlattenedData(social.data)}
                                </Descriptions>
                              </Card>
                            </Col>
                          ))}
                        {userData.profile.socials
                          .filter((s: any) => s.category === "twitter")
                          .map((social: any) => (
                            <Col key={social.id} xs={24} md={12}>
                              <Card title="Twitter" size="small">
                                <Descriptions column={1} size="small" bordered>
                                  <Descriptions.Item label="Link">
                                    <Typography.Link
                                      href={social.link}
                                      target="_blank"
                                    >
                                      {social.link}
                                    </Typography.Link>
                                  </Descriptions.Item>
                                  <Descriptions.Item label="Verified">
                                    <Tag
                                      color={social.verified ? "green" : "red"}
                                    >
                                      {social.verified ? "Yes" : "No"}
                                    </Tag>
                                  </Descriptions.Item>
                                  {social.data &&
                                    renderFlattenedData(social.data)}
                                </Descriptions>
                              </Card>
                            </Col>
                          ))}
                      </Row>
                    </>
                  )}

                {userData.profile.cultures &&
                  userData.profile.cultures.length > 0 && (
                    <>
                      <Divider orientation="left">Cultures</Divider>
                      <Space wrap size={[8, 8]}>
                        {userData.profile.cultures.map((culture: any) => (
                          <Tag
                            key={culture.id}
                            icon={<Avatar size="small" src={culture.icon} />}
                            color="blue"
                          >
                            {culture.name}
                          </Tag>
                        ))}
                      </Space>
                    </>
                  )}
              </Card>
            )}

            {/* --- Web3 Wallets Table --- */}
            {userData.web3_wallets && userData.web3_wallets.length > 0 && (
              <Card
                title={`Web3 Wallets (${userData.web3_wallets.length} total)`}
              >
                <Table
                  dataSource={userData.web3_wallets}
                  columns={walletColumns}
                  rowKey="id" // Use 'id' from wallet object if available and unique
                  pagination={{ pageSize: 5 }} // Smaller page size for potentially shorter lists
                  scroll={{ x: "max-content" }}
                />
              </Card>
            )}

            {/* --- Emails Table --- */}
            {userData.emails && userData.emails.length > 0 && (
              <Card title={`Emails (${userData.emails.length} total)`}>
                <Table
                  dataSource={userData.emails}
                  columns={emailColumns}
                  rowKey="id" // Use 'id' from email object
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: "max-content" }}
                />
              </Card>
            )}

            {/* --- Mobile Numbers Table --- */}
            {userData.mobiles && userData.mobiles.length > 0 && (
              <Card title={`Mobile Numbers (${userData.mobiles.length} total)`}>
                <Table
                  dataSource={userData.mobiles}
                  columns={mobileColumns}
                  rowKey="id" // Use 'id' from mobile object
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: "max-content" }}
                />
              </Card>
            )}

            {/* User Devices Table */}
            <Card
              title={`User Devices (${(userDevices as any)?.count || 0} total)`}
              loading={isLoadingUserDevices}
            >
              <Table
                dataSource={(userDevices as any)?.results || []}
                columns={deviceColumns}
                rowKey="id"
                pagination={{
                  current: paginationState.devices.current,
                  pageSize: paginationState.devices.pageSize,
                  total: (userDevices as any)?.count || 0,
                }}
                onChange={(pagination) =>
                  handleTableChange("devices", pagination)
                }
                loading={isLoadingUserDevices}
                scroll={{ x: "max-content" }}
              />
            </Card>

            {/* Zo House Bookings Table */}
            <Card
              title={`Zo House Bookings (${
                (userZoHouseBookings as any)?.count || 0
              } total)`}
              loading={isLoadingZoHouseBookings}
            >
              <Table
                dataSource={(userZoHouseBookings as any)?.results || []}
                columns={bookingColumns}
                rowKey="id"
                pagination={{
                  current: paginationState.zoHouseBookings.current,
                  pageSize: paginationState.zoHouseBookings.pageSize,
                  total: (userZoHouseBookings as any)?.count || 0,
                }}
                onChange={(pagination) =>
                  handleTableChange("zoHouseBookings", pagination)
                }
                loading={isLoadingZoHouseBookings}
                scroll={{ x: "max-content" }}
              />
            </Card>

            {/* Trip Bookings Table */}
            <Card
              title={`Trip Bookings (${
                (userTripBookings as any)?.count || 0
              } total)`}
              loading={isLoadingUserTripBookings}
            >
              <Table
                dataSource={(userTripBookings as any)?.results || []}
                columns={bookingColumns}
                rowKey="id"
                pagination={{
                  current: paginationState.tripBookings.current,
                  pageSize: paginationState.tripBookings.pageSize,
                  total: (userTripBookings as any)?.count || 0,
                }}
                onChange={(pagination) =>
                  handleTableChange("tripBookings", pagination)
                }
                loading={isLoadingUserTripBookings}
                scroll={{ x: "max-content" }}
              />
            </Card>

            {/* Reviews Table */}
            <Card
              title={`Reviews (${(userReviews as any)?.count || 0} total)`}
              loading={isLoadingUserReviews}
            >
              <Table
                dataSource={(userReviews as any)?.results || []}
                columns={reviewColumns}
                rowKey="id"
                pagination={{
                  current: paginationState.reviews.current,
                  pageSize: paginationState.reviews.pageSize,
                  total: (userReviews as any)?.count || 0,
                }}
                onChange={(pagination) =>
                  handleTableChange("reviews", pagination)
                }
                loading={isLoadingUserReviews}
                scroll={{ x: "max-content" }}
              />
            </Card>

            {/* User Ledger Table */}
            <Card
              title={`$Zo Ledger (${(userLedger as any)?.count || 0} total)`}
              loading={isLoadingUserLedger}
            >
              <Table
                dataSource={(userLedger as any)?.results || []}
                columns={ledgerColumns}
                rowKey="transaction_hash" // Use tx hash as unique key
                pagination={{
                  current: paginationState.ledger.current,
                  pageSize: paginationState.ledger.pageSize,
                  total: (userLedger as any)?.count || 0,
                }}
                onChange={(pagination) =>
                  handleTableChange("ledger", pagination)
                }
                loading={isLoadingUserLedger}
                scroll={{ x: "max-content" }}
              />
            </Card>
          </Space>
        )}
      </PageContent>
    </Page>
  );
};

export default User;
