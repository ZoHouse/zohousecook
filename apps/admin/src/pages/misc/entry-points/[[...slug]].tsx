import { useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { FormFieldType, Zud, ZudColumnType } from "@zo/zud";
import { Space } from "apps/admin/src/config";
import { NextPage } from "next";
import { useMemo } from "react";

const EntryPoints: NextPage = () => {
  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/entry-points", label: "Entry Points" },
  ];

  const columns: ZudColumnType[] = useMemo(
    () => [
      {
        key: "category",
        title: "Category ",
        dataIndex: "category",
      },
      {
        key: "code",
        title: "Code ",
        dataIndex: "code",
      },
      {
        key: "space",
        title: "Space ",
        dataIndex: "space",
        render: (cell, row) => {
          return <span>{cell.name}</span>;
        },
      },
      {
        key: "lock",
        title: "Lock ",
        dataIndex: "lock",
        render: (cell, row) => {
          return <span>{cell.name}</span>;
        },
      },
    ],
    []
  );

  const { data: lockOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_LOCKS",
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.results.map((lock: GeneralObject) => ({
          value: lock.id,
          label: lock.name,
        })),
    },
    "",
    "limit=100"
  );

  const { data: spaceOptions } = useQueryApi<
    Array<{ label: string; value: string }>
  >(
    "CAS_SPACES",
    {
      refetchOnWindowFocus: false,
      select: (data) =>
        data.data.results.map((space: Space) => ({
          value: space.id,
          label: space.name,
        })),
    },
    "",
    "limit=100"
  );

  const formFields: FormFieldType[] = [
    {
      name: "category",
      label: "category",
      type: "select",
      options: [
        { label: "Direct", value: "direct" },
        { label: "Indirect", value: "indirect" },
      ],
      required: true,
    },
    {
      name: "lock",
      type: "select",
      label: "Lock",
      options: lockOptions,
      required: true,
    },
    {
      name: "space",
      type: "select",
      label: "Space",
      options: spaceOptions,
      required: true,
    },
  ];

  return (
    <Zud
      title="Entry Points"
      breadCrumbs={breadcrumbs}
      columns={columns}
      formFields={formFields}
      name="entry-points"
      mutationEndpoint="CAS_ENTRY_POINTS"
      queryEndpoint="CAS_ENTRY_POINTS"
    />
  );
};

export default EntryPoints;
