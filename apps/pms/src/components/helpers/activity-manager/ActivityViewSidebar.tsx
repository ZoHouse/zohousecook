import { useMutationApi, useProfile, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import {
  Button,
  Divider,
  Drawer,
  Empty,
  Image,
  Input,
  List,
  Space,
  Tag,
  Typography,
} from "antd";
import Tabs from "antd/es/tabs";
import React, { useState } from "react";
import { useAssociation } from "../../../hooks";
import ActivityEditSidebar from "./ActivityEditSidebar";

const { Title, Text, Paragraph } = Typography;

interface ActivityViewSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  id: string | null;
  selectedOperator: GeneralObject;
  onUpdated: () => void;
}

const ActivityViewSidebar: React.FC<ActivityViewSidebarProps> = ({
  isOpen,
  onClose,
  id,
  selectedOperator,
  onUpdated,
}) => {
  const { data, isLoading, refetch } = useQueryApi<GeneralObject>(
    "CAS_PM_INVENTORY",
    { enabled: !!id && isOpen, select: (resp) => resp.data },
    `${id || ""}/`
  );
  const {
    data: mediaData,
    isLoading: isLoadingMedia,
    refetch: refetchMedia,
  } = useQueryApi<GeneralObject>(
    "CAS_PM_MEDIA_INVENTORY",
    { enabled: !!id && isOpen, select: (resp) => resp.data.results },
    `${id || ""}/`,
    "limit=-1"
  );
  const { effectiveRole } = useAssociation();

  const status: string = data?.status ?? "";
  const showComments = status === "pending" || status === "inactive";

  const { profile } = useProfile();
  const author = React.useMemo(
    () =>
      profile && {
        id: profile.pid,
        name:
          profile.nickname ||
          `${profile.first_name} ${profile.last_name}`.trim(),
        role: effectiveRole,
      },
    [effectiveRole, profile]
  );

  const { mutate: updateActivity } = useMutationApi(
    "CAS_PM_INVENTORY",
    {},
    `${id || ""}/`,
    "PUT"
  );

  const [localComments, setLocalComments] = useState<GeneralObject[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>("");

  React.useEffect(() => {
    if (isOpen && data) {
      setLocalComments(
        Array.isArray(data.approval_comments) ? data.approval_comments : []
      );
    } else {
      setLocalComments([]);
    }
  }, [isOpen, data]);

  React.useEffect(() => {
    if (!id) return;
    const serverLen = Array.isArray(data?.approval_comments)
      ? data?.approval_comments.length
      : 0;
    if (
      serverLen != null &&
      localComments &&
      localComments.length > serverLen
    ) {
      updateActivity({
        data: { approval_comments: localComments },
        route: `${id}/`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localComments]);

  const handleAddComment = () => {
    const trimmed = newCommentText.trim();
    if (!trimmed) return;
    const newComment = {
      id: `${Date.now()}`,
      author,
      message: trimmed,
      created_at: new Date().toISOString(),
    } as GeneralObject;
    setLocalComments((prev) => [newComment, ...prev]);
    setNewCommentText("");
  };

  const [isEditOpen, setEditOpen] = useState(false);

  return (
    <>
      <Drawer
        title={data?.name ?? "Activity"}
        placement="right"
        size="large"
        onClose={onClose}
        open={isOpen}
        loading={isLoading || isLoadingMedia}
        extra={
          <Space>
            <Button type="primary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          </Space>
        }
      >
        {showComments ? (
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
                      <Text type="secondary">Name</Text>
                      <Paragraph className="!mb-2">
                        {data?.name || "—"}
                      </Paragraph>
                      <Text type="secondary">Description</Text>
                      <Paragraph className="!mb-0">
                        {data?.description || "—"}
                      </Paragraph>
                    </div>

                    <div>
                      <Title level={4} className="!mb-2">
                        Media
                      </Title>
                      {(mediaData || []).length > 0 ? (
                        <div className="grid grid-cols-2 gap-6">
                          {(mediaData || []).map((m: GeneralObject) => (
                            <div key={m.id} className="relative">
                              <Image
                                src={m.url}
                                alt={m.alt || m.title || "media"}
                                width="100%"
                                className="w-full h-full"
                                preview={{ mask: "Preview" }}
                              />
                              <Tag
                                className="absolute top-2 right-2 mr-0"
                                color={
                                  m.status === "active" ? "green" : "orange"
                                }
                              >
                                {m.status}
                              </Tag>
                            </div>
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
                      <Empty description="No comments" />
                    ) : (
                      <List
                        itemLayout="horizontal"
                        dataSource={localComments}
                        renderItem={(item: GeneralObject) => (
                          <List.Item>
                            <List.Item.Meta
                              title={
                                <Space size={8} wrap>
                                  <Text strong>
                                    {item.author?.name || "User"}
                                  </Text>
                                  {item.author?.role && (
                                    <Tag>{item.author.role}</Tag>
                                  )}
                                  {item.metadata?.reference?.type && (
                                    <Tag color="blue">
                                      Ref: {item.metadata.reference.type}
                                    </Tag>
                                  )}
                                  {item.created_at && (
                                    <Text type="secondary">
                                      {new Date(
                                        item.created_at
                                      ).toLocaleString()}
                                    </Text>
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
                                        className="w-full h-full object-cover"
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
        ) : (
          <Space direction="vertical" size="large" className="w-full">
            <div>
              <Title level={4} className="!mb-1">
                Basic Details
              </Title>
              <Text type="secondary">Name</Text>
              <Paragraph className="!mb-2">{data?.name || "—"}</Paragraph>
              <Text type="secondary">Description</Text>
              <Paragraph className="!mb-0">
                {data?.description || "—"}
              </Paragraph>
            </div>

            <div>
              <Title level={4} className="!mb-2">
                Media
              </Title>
              {(mediaData || []).length > 0 ? (
                <div className="grid grid-cols-2 gap-6">
                  {(mediaData || []).map((m: GeneralObject) => (
                    <div key={m.id} className="relative">
                      <Image
                        src={m.url}
                        alt={m.alt || m.title || "media"}
                        style={{ width: "100%", objectFit: "cover" }}
                        preview={{ mask: "Preview" }}
                      />
                      <Tag
                        className="absolute top-2 right-2"
                        color={m.status === "active" ? "green" : "orange"}
                      >
                        {m.status}
                      </Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="No media available" />
              )}
            </div>
          </Space>
        )}
      </Drawer>

      <ActivityEditSidebar
        isModalOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          refetch();
          refetchMedia();
          setEditOpen(false);
          onUpdated();
        }}
        selectedOperator={selectedOperator}
        activityToEdit={{ ...data, media: mediaData } as GeneralObject}
      />
    </>
  );
};

export default ActivityViewSidebar;
