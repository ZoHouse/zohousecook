import Typo from "@zo/coal/typography";
import { Breadcrumb, Breadcrumbs, Button } from "@zo/coal/ui";
import React from "react";

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  rightOptions?: React.ReactNode | React.ReactNode[];
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  breadcrumbs = [],
  rightOptions,
}) => {
  return (
    <div className="flex items-center justify-between h-12 relative">
      {breadcrumbs.length > 0 && (
        <Breadcrumbs className="absolute bottom-12" links={breadcrumbs} />
      )}
      <Typo type="title">{title}</Typo>
      {rightOptions != null && rightOptions}
    </div>
  );
};

export default PageHeader;
