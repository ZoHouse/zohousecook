import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import * as Sentry from "@sentry/nextjs";
import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import {
  Avatar,
  Button,
  Collapse,
  Empty,
  List,
  Popconfirm,
  Tag,
  message,
} from "antd";
import { NextPage } from "next";
import { useMemo, useState } from "react";
import RoleAddSidebar from "../../components/sidebars/RoleAdd";
import RoleEditSidebar from "../../components/sidebars/RoleEdit";
import { Page, PageContent, PageHeader } from "../../components/ui";
import NoAccess from "../../components/ui/NoAccess";
import { useAssociation } from "../../hooks";

const accessGroups = ["8", "9", "17", "12", "19", "16", "20", "15", "11", "18"];

const StaffPage: NextPage = () => {
  const { selectedOperator, hasAccess } = useAssociation();
  const canView = hasAccess("property-manager");
  const [isAddRoleOpen, setIsAddRoleOpen] = useState<boolean>(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState<boolean>(false);
  const [editingAssociation, setEditingAssociation] =
    useState<GeneralObject | null>(null);
  const { data: allAssociations, refetch: refetchAssociations } = useQueryApi(
    "ADMIN_ASSOCIATION",
    {
      enabled: selectedOperator != null && canView,
    },
    "",
    `limit=1000&model=Operator&value=${selectedOperator.id}`
  );
  const { data: allAccessGroups } = useQueryApi(
    "ADMIN_ACCESS_GROUP",
    {},
    "",
    "limit=1000"
  );

  const { mutateAsync: deleteAssociation } = useMutationApi(
    "ADMIN_ASSOCIATION",
    {},
    "",
    "DELETE"
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const deleteUser = async (association: GeneralObject) => {
    try {
      setDeletingId(association?.user?.id);
      await deleteAssociation({
        route: `${association.id}/`,
        data: {},
      });
      message.success("Role removed successfully");
      await refetchAssociations();
    } catch (e) {
      Sentry.captureException(e);
      message.error("Failed to remove role");
    } finally {
      setDeletingId(null);
    }
  };

  const allowedAccessGroups = useMemo(() => {
    if (allAccessGroups) {
      const filtered = allAccessGroups.data.results.filter((f: GeneralObject) =>
        accessGroups.includes(String(f.id))
      );
      // Sort by priority order defined in accessGroups array
      return filtered.sort((a: GeneralObject, b: GeneralObject) => {
        const indexA = accessGroups.indexOf(String(a.id));
        const indexB = accessGroups.indexOf(String(b.id));
        return indexA - indexB;
      });
    }
    return [];
  }, [allAccessGroups]);

  const groupedAllowedAssociations = useMemo(() => {
    if (allAssociations) {
      const allAllowed = allAssociations.data.results.filter(
        (f: GeneralObject) => accessGroups.includes(String(f.access_group?.id))
      );
      return allAllowed.reduce(
        (acc: Record<string, GeneralObject[]>, curr: GeneralObject) => {
          acc[String(curr.access_group?.id)] =
            acc[String(curr.access_group?.id)] || [];
          acc[String(curr.access_group?.id)].push(curr);
          return acc;
        },
        {} as Record<string, GeneralObject[]>
      );
    }
    return {} as Record<string, GeneralObject[]>;
  }, [allAssociations]);

  if (!canView) {
    return <NoAccess />;
  }
  const handleOpenEdit = (association: GeneralObject) => {
    setEditingAssociation(association);
    setIsEditRoleOpen(true);
  };

  return (
    <Page>
      <PageHeader title="Staff Management" />
      <PageContent>
        <div className="flex justify-between gap-4 items-center">
          <h2 className="text-xl font-medium">Roles</h2>
          <Button onClick={() => setIsAddRoleOpen(true)}>Add Role</Button>
        </div>
        <div className="w-full mt-4">
          {allowedAccessGroups.length === 0 ? (
            <Empty description="No roles configured" />
          ) : (
            <Collapse
              bordered={false}
              items={allowedAccessGroups
                .filter((ag: GeneralObject) =>
                  Object.keys(groupedAllowedAssociations).includes(
                    String(ag.id)
                  )
                )
                .map((ag: GeneralObject) => {
                  const members = (
                    groupedAllowedAssociations[String(ag?.id)] || []
                  )
                    .slice()
                    .sort((a: GeneralObject, b: GeneralObject) => {
                      const an = `${a?.user?.first_name || ""} ${
                        a?.user?.last_name || ""
                      }`.trim();
                      const bn = `${b?.user?.first_name || ""} ${
                        b?.user?.last_name || ""
                      }`.trim();
                      return an.localeCompare(bn);
                    });

                  return {
                    key: String(ag?.id),
                    label: (
                      <div className="flex items-center justify-between w-full pr-2">
                        <span>{ag.name}</span>
                        <Tag>{members.length}</Tag>
                      </div>
                    ),
                    children: (
                      <List
                        dataSource={members}
                        renderItem={(a: GeneralObject) => {
                          const name =
                            `${a?.user?.first_name || ""} ${
                              a?.user?.last_name || ""
                            }`.trim() ||
                            a?.user?.mobile ||
                            "Unknown";
                          const mobile = a?.user?.mobile;
                          const initial = (name?.[0] || "U").toUpperCase();
                          return (
                            <List.Item
                              key={a?.user?.id}
                              actions={[
                                <Button
                                  key="edit"
                                  type="text"
                                  icon={<EditOutlined />}
                                  onClick={() => handleOpenEdit(a)}
                                />,
                                <Popconfirm
                                  key="delete"
                                  title="Remove role?"
                                  description="This will remove the association and the access group."
                                  okText="Yes"
                                  cancelText="No"
                                  onConfirm={() => deleteUser(a)}
                                >
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    loading={deletingId === a?.user?.id}
                                  />
                                </Popconfirm>,
                              ]}
                            >
                              <List.Item.Meta
                                avatar={<Avatar>{initial}</Avatar>}
                                title={name}
                                description={mobile}
                              />
                            </List.Item>
                          );
                        }}
                      />
                    ),
                  };
                })}
            />
          )}
        </div>
        {/* Openings section - Hidden until functionality is implemented */}
        <div className="hidden flex justify-between gap-4 mt-10 items-center">
          <h2 className="text-xl font-medium">Openings</h2>
          <Button>Add Opening</Button>
        </div>
        <Empty className="hidden mt-4" description="No openings" />
      </PageContent>
      <RoleAddSidebar
        isOpen={isAddRoleOpen}
        onClose={() => setIsAddRoleOpen(false)}
        onSuccess={() => {
          refetchAssociations();
        }}
        operator={selectedOperator}
        roles={allowedAccessGroups}
      />
      <RoleEditSidebar
        isOpen={isEditRoleOpen}
        onClose={() => {
          setIsEditRoleOpen(false);
          setEditingAssociation(null);
        }}
        onSuccess={() => {
          refetchAssociations();
        }}
        operator={selectedOperator}
        roles={allowedAccessGroups}
        association={editingAssociation}
      />
    </Page>
  );
};

export default StaffPage;
