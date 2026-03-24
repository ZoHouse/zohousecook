import { useMutationApi, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { Page, PageHeader, useInfiniteTable } from "@zo/moal";
import {
  combineRouteAndQueryParams,
  isValidString,
  isValidUUID,
} from "@zo/utils/string";

import { Person } from "@mui/icons-material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import { processResponseError } from "@zo/utils/auth";
import { ZudColumnType, ZudTable } from "@zo/zud";
import { Avatar, Flex, message } from "antd";
import moment from "moment";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import {
  UserAccessGroupSidebar,
  UserInfoSidebar,
} from "../../../components/sidebars";
import { AccessGroup } from "../../../config";

const Roles: NextPage = () => {
  const router = useRouter();

  const param = useMemo(() => {
    if (router.query.slug && Array.isArray(router.query.slug)) {
      const [accessGroup, mode, roleId] = router.query.slug;
      return {
        accessGroup,
        mode: !isValidUUID(mode) ? mode : null,
        userId: isValidUUID(mode) ? mode : null,
        roleId,
      };
    }
    return {
      accessGroup: null,
      mode: null,
      userId: null,
      roleId: null,
    };
  }, [router.query]);

  const [data, setData] = useState<GeneralObject[]>([]);

  const { data: currentAccessGroup } = useQueryApi<AccessGroup>(
    "CAS_ACCESSGROUP",
    {
      refetchOnWindowFocus: false,
      enabled: isValidString(param.accessGroup),
      select: (data) => data.data,
    },
    `${param.accessGroup}/`
  );

  const { mutate: deleteUserRole } = useMutationApi(
    "CAS_USERACCESSGROUPS",
    {},
    "",
    "DELETE"
  );

  const route = useMemo(() => {
    if (isValidString(param.accessGroup)) {
      return `access_group=${param.accessGroup}`;
    }
  }, [param.accessGroup]);

  const { isLoading: isLoadingTableData, refetch } = useInfiniteTable({
    name: "user-roles",
    setter: setData,
    queryEndpoint: "CAS_USERACCESSGROUPS",
    customSearchQuery: route,
    enabled: isValidString(route),
  });

  const getUserName = (user: GeneralObject) => {
    const fullName = [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ");
    return (
      fullName ||
      user.nickname ||
      user.email ||
      user.email_address ||
      user.mobile_numbers
    );
  };

  const columns: ZudColumnType[] = [
    {
      key: "user",
      title: "User",
      dataIndex: "user",
      render: (cell, row) => (
        <Flex align="center" gap={8}>
          <Avatar icon={<Person />} src={cell?.avatar.image} />
          {getUserName(cell)}
        </Flex>
      ),
    },
    {
      key: "created_at",
      title: "Created At",
      dataIndex: "created_at",
      render(cell) {
        return cell ? moment(cell).format("LLL") : "-";
      },
    },
    {
      key: "updated_at",
      title: "Updated At",
      dataIndex: "updated_at",
      render(cell) {
        return cell ? moment(cell).format("LLL") : "-";
      },
    },
  ];

  const handleDeleteUserRole = (id: string | null) => {
    if (!id) return;
    deleteUserRole(
      {
        data: {},
        route: `${id}/`,
      },
      {
        onSuccess() {
          message.success("User Role Deleted");
          refetch();
          handleClose();
        },
        onError(error) {
          message.error(processResponseError(error));
        },
      }
    );
  };

  const handleAddClick = () => {
    router.push(
      combineRouteAndQueryParams(`${router.asPath}/new`, router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleClose = () => {
    router.push(
      combineRouteAndQueryParams(
        `/user-roles/users/${param.accessGroup}`,
        router.query
      ),
      undefined,
      { shallow: true }
    );
  };

  const handleSuccess = (user: GeneralObject) => {
    setData([user, ...data]);
  };

  const handleRowClick = (record: GeneralObject) => {
    router.push(
      combineRouteAndQueryParams(
        `${router.asPath}/${record.user.id}/${record.id}`,
        router.query
      ),
      undefined,
      { shallow: true }
    );
  };

  return (
    <Page
      breadCrumbs={[
        { href: "/user-roles", label: "User Role" },
        {
          href: `${router.asPath}`,
          label: currentAccessGroup?.name || "Role",
        },
      ]}
    >
      <PageHeader
        title={currentAccessGroup?.name || "Role"}
        buttons={[
          {
            icon: <AddOutlinedIcon />,
            label: "Add User",
            onClick: handleAddClick,
            type: "secondary",
          },
        ]}
      />
      <div className="py-10">
        <ZudTable
          isLoading={isLoadingTableData}
          className="!bg-zui-lighter"
          columns={columns}
          data={data as GeneralObject[]}
          onRowClick={handleRowClick}
        />
      </div>

      {param.accessGroup && (
        <UserAccessGroupSidebar
          isOpen={param.mode === "new"}
          onClose={handleClose}
          selectedGroup={param.accessGroup}
          onSuccess={handleSuccess}
        />
      )}

      <UserInfoSidebar
        isOpen={isValidUUID(param.userId)}
        onClose={handleClose}
        userId={param.userId}
        removeAccessHandler={handleDeleteUserRole.bind(null, param.roleId)}
      />
    </Page>
  );
};

export default Roles;
