import { GeneralObject } from "@zo/definitions/general";
import { useVisibilityState } from "@zo/utils/hooks";
import { combineRouteAndQueryParams, isValidString } from "@zo/utils/string";
import { Zud, ZudColumnType } from "@zo/zud";
import { TemplatesSidebar } from "apps/admin/src/components/sidebars";
import { StatusCell } from "apps/admin/src/components/ui";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

interface TemplatesProps {}

const Templates: React.FC<TemplatesProps> = () => {
  const router = useRouter();

  const breadcrumbs = [
    { href: "/misc", label: "Miscellaneous" },
    { href: "/misc/templates", label: "Templates" },
  ];

  const [isTemplateSidebarVisible, showTemplateSidebar, hideTemplateSidebar] =
    useVisibilityState();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const columns: ZudColumnType[] = [
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (v) => <StatusCell status={String(v)} />,
    },
    {
      key: "category",
      title: "Category",
      dataIndex: "category",
    },
    {
      key: "channel",
      title: "Channel",
      dataIndex: "channel",
    },
    {
      key: "slug",
      title: "Slug",
      dataIndex: "slug",
    },
  ];

  const handleShowAddTemplate = () => {
    showTemplateSidebar();
    router.push("new", undefined, { shallow: true });
  };

  const handleTemplateSidebarClose = () => {
    hideTemplateSidebar();
    setSelectedTemplate(null);
    router.replace(
      combineRouteAndQueryParams(router.pathname, router.query),
      undefined,
      { shallow: true }
    );
  };

  const handleRowClick = (data: GeneralObject) => {
    if (data.id) {
      setSelectedTemplate(data.id);
      showTemplateSidebar();
      router.push(`${data.id}/edit`, undefined, { shallow: true });
    }
  };

  useEffect(() => {
    if (router.query.slug?.[0] == "new") {
      showTemplateSidebar();
      return;
    }
    if (
      router.query.slug?.[0] &&
      isValidString(router.query.slug?.[0]) &&
      router.query.slug?.[1] === "edit"
    ) {
      setSelectedTemplate(router.query.slug?.[0]);
      showTemplateSidebar();
    }
  }, [router.query]);

  return (
    <>
      <Zud
        title="Templates"
        breadCrumbs={breadcrumbs}
        queryEndpoint="CAS_TEMPLATES"
        mutationEndpoint="CAS_TEMPLATES"
        columns={columns}
        name="templates"
        onAddClick={handleShowAddTemplate}
        onRowClick={handleRowClick}
        customSearchQuery="ordering=-created_at"
      />
      <TemplatesSidebar
        isOpen={isTemplateSidebarVisible}
        onClose={handleTemplateSidebarClose}
        templateId={selectedTemplate}
      />
    </>
  );
};

export default Templates;
