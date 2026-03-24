import { EditOutlined, SaveOutlined } from "@ant-design/icons";
import { useMutationApi, useProfile, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { isValidString } from "@zo/utils/string";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Drawer,
  Empty,
  Image,
  Input,
  List,
  Modal,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import Tabs from "antd/es/tabs";
import React, { useEffect, useMemo, useState } from "react";
import { v4 } from "uuid";

const { Title, Text, Paragraph } = Typography;

export type ApprovalComment = {
  id: string;
  author: {
    id: string;
    name: string;
    role: "admin" | "user" | "system" | string;
  };
  message: string;
  created_at: string;
  updated_at?: string;
  attachments?: Array<{
    id: string;
    url: string;
    type?: string;
    name?: string;
    size?: number;
  }>;
  metadata?: GeneralObject;
};

interface ActivityApprovalSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  id: string | null;
}

const ActivityApprovalSidebar: React.FC<ActivityApprovalSidebarProps> = ({
  isOpen,
  onClose,
  id,
}) => {
  const { profile } = useProfile();

  const author = useMemo(
    () =>
      profile && {
        id: profile.pid,
        name:
          profile.nickname ||
          `${profile.first_name} ${profile.last_name}`.trim(),
        role: "admin",
      },
    [profile]
  );

  const { data, isLoading, refetch } = useQueryApi<GeneralObject>(
    "CAS_PM_INVENTORY",
    {
      enabled: isValidString(id) && isOpen,
      select: (resp) => resp.data,
    },
    `${id}/`
  );
  const {
    data: mediaData,
    isLoading: isLoadingMedia,
    refetch: refetchMedia,
  } = useQueryApi<GeneralObject>(
    "CAS_PM_MEDIA_INVENTORY",
    {
      enabled: isValidString(id) && isOpen,
      select: (resp) => resp.data.results,
    },
    `${id}/`,
    "limit=-1"
  );

  const { mutate: updateActivity, isLoading: isUpdatingActivity } =
    useMutationApi("CAS_PM_INVENTORY", {}, `${id}/`, "PUT");

  const { mutate: updateMedia, isLoading: isUpdatingMedia } = useMutationApi(
    "CAS_PM_MEDIA_INVENTORY",
    {},
    "",
    "PUT"
  );

  const [localComments, setLocalComments] = useState<ApprovalComment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>("");
  // Role selection removed (UI-only). Defaulting to admin for local comments.
  const [reasonModalOpen, setReasonModalOpen] = useState<boolean>(false);
  const [reasonText, setReasonText] = useState<string>("");
  const [reasonContext, setReasonContext] = useState<
    | { kind: "activity"; callback?: () => void }
    | { kind: "media"; media: GeneralObject; callback?: () => void }
    | null
  >(null);

  // Inline editing states
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isEditingDescription, setIsEditingDescription] =
    useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>("");
  const [editedDescription, setEditedDescription] = useState<string>("");

  const isAnyMediaApproved = useMemo(() => {
    if (!Array.isArray(mediaData) || mediaData.length === 0) return false;
    return mediaData.some((m) => m.status === "active");
  }, [mediaData]);

  // Since basic field approvals were removed, only gate by media approval now.
  const isActivityFullyApproved = isAnyMediaApproved;

  const handleApproveMedia = (mediaId: string) => {
    ////// API TO APPROVE MEDIA //////
    updateMedia(
      {
        data: { status: "active" },
        route: `${data?.id}/${mediaId}/`,
      },
      {
        onSuccess: () => {
          refetchMedia();
        },
      }
    );
  };

  const handleRejectMedia = (media: GeneralObject) => {
    setReasonContext({
      kind: "media",
      media,
      callback: () => {
        updateMedia(
          {
            data: { status: "inactive" },
            route: `${data?.id}/${media.media_relation_id}/`,
          },
          {
            onSuccess: () => {
              refetchMedia();
            },
          }
        );
      },
    });
    setReasonText("");
    setReasonModalOpen(true);
  };

  const handleApproveActivity = () => {
    ////// API TO APPROVE ACTIVITY //////
    updateActivity(
      {
        data: { status: "active" },
        route: `${id}/`,
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  const handleRejectActivity = () => {
    setReasonContext({
      kind: "activity",
      callback: () => {
        updateActivity(
          {
            data: { status: "pending" },
            route: `${id}/`,
          },
          {
            onSuccess: () => {
              refetch();
            },
          }
        );
      },
    });
    setReasonText("");
    setReasonModalOpen(true);
  };

  const handleAddComment = () => {
    const trimmed = newCommentText.trim();
    if (!trimmed) {
      message.warning("Please enter a comment.");
      return;
    }
    const newComment: ApprovalComment = {
      id: v4(),
      author,
      message: trimmed,
      created_at: new Date().toISOString(),
    };
    setLocalComments((prev) => [newComment, ...prev]);
    setNewCommentText("");
  };

  const handleSaveName = () => {
    const trimmed = editedName.trim();
    if (!trimmed) {
      message.warning("Name cannot be empty.");
      return;
    }
    updateActivity(
      {
        data: { name: trimmed },
        route: `${id}/`,
      },
      {
        onSuccess: () => {
          refetch();
          setIsEditingName(false);
          message.success("Name updated successfully.");
        },
        onError: () => {
          message.error("Failed to update name.");
        },
      }
    );
  };

  const handleSaveDescription = () => {
    const trimmed = editedDescription.trim();
    if (!trimmed) {
      message.warning("Description cannot be empty.");
      return;
    }
    updateActivity(
      {
        data: { description: trimmed },
        route: `${id}/`,
      },
      {
        onSuccess: () => {
          refetch();
          setIsEditingDescription(false);
          message.success("Description updated successfully.");
        },
        onError: () => {
          message.error("Failed to update description.");
        },
      }
    );
  };

  useEffect(() => {
    if (isOpen && data) {
      setLocalComments(data.approval_comments ?? []);
      setEditedName(data.name || "");
      setEditedDescription(data.description || "");
      setIsEditingName(false);
      setIsEditingDescription(false);
    } else {
      setLocalComments([]);
      setEditedName("");
      setEditedDescription("");
      setIsEditingName(false);
      setIsEditingDescription(false);
    }
  }, [isOpen, data]);

  useEffect(() => {
    if (
      localComments &&
      localComments.length > data?.approval_comments?.length
    ) {
      updateActivity({
        data: { approval_comments: localComments },
        route: `${id}/`,
      });
    }
  }, [localComments]);

  return (
    <Drawer
      title={data?.name ?? "Activity"}
      placement="right"
      size="large"
      onClose={onClose}
      open={isOpen}
      loading={isLoading || isLoadingMedia}
      extra={
        data?.status === "pending" ? (
          <Space>
            <Button type="link" danger onClick={handleRejectActivity}>
              Suggest Changes
            </Button>
            <Button
              type="primary"
              disabled={!isActivityFullyApproved}
              onClick={handleApproveActivity}
            >
              Approve
            </Button>
          </Space>
        ) : (
          <Space>
            <Button type="primary" onClick={handleRejectActivity}>
              Un-Approve
            </Button>
          </Space>
        )
      }
    >
      <Tabs
        defaultActiveKey="details"
        className="-mt-4"
        items={[
          {
            key: "details",
            label: "Details",
            children: (
              <Space direction="vertical" size="large" className="w-full">
                <div>
                  <Title level={4} className="!mb-1">
                    Basic Details
                  </Title>

                  {/* Name Field */}
                  <div className="mb-4">
                    <Space className="w-full" direction="vertical" size={4}>
                      <div className="flex items-center justify-between">
                        <Text type="secondary">Name</Text>
                        {!isEditingName && (
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => setIsEditingName(true)}
                          />
                        )}
                      </div>
                      {isEditingName ? (
                        <Space.Compact className="w-full">
                          <Input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            placeholder="Enter activity name"
                            onPressEnter={handleSaveName}
                          />
                          {editedName.trim() !== data?.name && (
                            <Button
                              type="primary"
                              icon={<SaveOutlined />}
                              onClick={handleSaveName}
                              loading={isUpdatingActivity}
                            >
                              Save
                            </Button>
                          )}
                          <Button
                            onClick={() => {
                              setEditedName(data?.name || "");
                              setIsEditingName(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </Space.Compact>
                      ) : (
                        <Paragraph className="!mb-0">
                          {data?.name || "—"}
                        </Paragraph>
                      )}
                    </Space>
                  </div>

                  {/* Description Field */}
                  <div>
                    <Space className="w-full" direction="vertical" size={4}>
                      <div className="flex items-center justify-between">
                        <Text type="secondary">Description</Text>
                        {!isEditingDescription && (
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => setIsEditingDescription(true)}
                          />
                        )}
                      </div>
                      {isEditingDescription ? (
                        <Space direction="vertical" className="w-full" size={8}>
                          <Input.TextArea
                            value={editedDescription}
                            onChange={(e) =>
                              setEditedDescription(e.target.value)
                            }
                            placeholder="Enter activity description"
                            rows={4}
                          />
                          <Space>
                            {editedDescription.trim() !== data?.description && (
                              <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={handleSaveDescription}
                                loading={isUpdatingActivity}
                              >
                                Save
                              </Button>
                            )}
                            <Button
                              onClick={() => {
                                setEditedDescription(data?.description || "");
                                setIsEditingDescription(false);
                              }}
                            >
                              Cancel
                            </Button>
                          </Space>
                        </Space>
                      ) : (
                        <Paragraph className="!mb-0">
                          {data?.description || "—"}
                        </Paragraph>
                      )}
                    </Space>
                  </div>
                </div>

                <div>
                  <Title level={4} className="!mb-2">
                    Media
                  </Title>
                  <Text type="secondary" className="block !mb-3">
                    Approve at least one media to enable approving the activity.
                  </Text>
                  {mediaData && mediaData.length > 0 ? (
                    <div className="grid grid-cols-2 gap-6">
                      {mediaData.map((m: GeneralObject) => (
                        <Card
                          key={m.id}
                          hoverable
                          actions={
                            m.status === "inactive"
                              ? [
                                  <div
                                    key="actions"
                                    className="w-full px-3 flex gap-3"
                                  >
                                    <Button
                                      className="flex-1"
                                      type="primary"
                                      onClick={() =>
                                        handleApproveMedia(m.media_relation_id)
                                      }
                                    >
                                      Approve Media
                                    </Button>
                                    <Button
                                      className="flex-1"
                                      type="link"
                                      danger
                                      onClick={() => handleRejectMedia(m)}
                                    >
                                      Suggest Changes
                                    </Button>
                                  </div>,
                                ]
                              : [
                                  <div
                                    key="actions"
                                    className="w-full px-3 flex gap-3"
                                  >
                                    <Button
                                      className="flex-1"
                                      type="link"
                                      onClick={() => handleRejectMedia(m)}
                                    >
                                      Un-Approve Media
                                    </Button>
                                  </div>,
                                ]
                          }
                        >
                          <div className="relative w-[calc(100%+48px)] aspect-[4/3] -m-6">
                            <img
                              src={m.url}
                              alt={m.alt || m.title || "media"}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <Tag
                              className="absolute top-2 right-2 mr-0"
                              color={m.status === "active" ? "green" : "orange"}
                            >
                              {m.status}
                            </Tag>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Empty description="No media available" />
                  )}
                </div>
              </Space>
            ),
          },
          {
            key: "comments",
            label: `Comments (${localComments.length})`,
            children: (
              <Space direction="vertical" size="large" className="w-full">
                {localComments.length === 0 ? (
                  <Empty description="No approval comments yet" />
                ) : (
                  <List
                    itemLayout="horizontal"
                    dataSource={localComments}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar>
                              {item.author.name?.[0]?.toUpperCase() || "U"}
                            </Avatar>
                          }
                          title={
                            <Space size={8} wrap>
                              <Text strong>{item.author.name}</Text>
                              {item.author.role && (
                                <Tag>{item.author.role}</Tag>
                              )}
                              <Text type="secondary">
                                {new Date(item.created_at).toLocaleString()}
                              </Text>
                              {item.metadata?.reference?.type && (
                                <Tag color="blue">
                                  Ref: {item.metadata.reference.type}
                                </Tag>
                              )}
                            </Space>
                          }
                          description={
                            <Space
                              direction="vertical"
                              size={8}
                              className="w-full"
                            >
                              {item.metadata?.reference?.type === "media" &&
                                item.metadata?.reference?.url && (
                                  <Image
                                    src={item.metadata.reference.url}
                                    alt="media"
                                    height={60}
                                    className="object-cover"
                                  />
                                )}
                              <Paragraph className="!mb-0">
                                {item.message}
                              </Paragraph>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
                <Divider />
                <Space direction="vertical" size="small" className="w-full">
                  <Text type="secondary">Add a comment</Text>
                  <Input.TextArea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    rows={3}
                    placeholder="Write your comment..."
                  />
                  <Button type="primary" onClick={handleAddComment}>
                    Add Comment
                  </Button>
                </Space>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title="Rejection Reason"
        open={reasonModalOpen}
        onCancel={() => setReasonModalOpen(false)}
        onOk={() => {
          const trimmed = reasonText.trim();
          if (!trimmed) {
            message.warning("Please provide a reason.");
            return;
          }
          if (!reasonContext) {
            setReasonModalOpen(false);
            return;
          }

          if (reasonContext.kind === "activity") {
            const comment: ApprovalComment = {
              id: v4(),
              author,
              message: trimmed,
              created_at: new Date().toISOString(),
              metadata: { reference: { type: "activity" } },
            };
            setLocalComments((prev) => [comment, ...prev]);
          }

          if (reasonContext.kind === "media") {
            const media = reasonContext.media;
            const comment: ApprovalComment = {
              id: v4(),
              author,
              message: trimmed,
              created_at: new Date().toISOString(),
              metadata: {
                reference: {
                  type: "media",
                  id: media.id,
                  url: media.url,
                },
              },
            };
            setLocalComments((prev) => [comment, ...prev]);
          }

          if (reasonContext.callback) {
            reasonContext.callback();
          }

          setReasonModalOpen(false);
          setReasonText("");
          setReasonContext(null);
        }}
      >
        <Space direction="vertical" className="w-full">
          <Text type="secondary">Please provide a reason for rejection</Text>
          <Input.TextArea
            rows={4}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            placeholder="Write your reason..."
          />
        </Space>
      </Modal>
    </Drawer>
  );
};

export default ActivityApprovalSidebar;
