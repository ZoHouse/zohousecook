import Icon from "@zo/assets/icons";
import { Breadcrumb } from "@zo/definitions/admin";
import { cn } from "@zo/utils/font";
import Link from "next/link";
import React, { useMemo } from "react";

interface BreadcrumbsProps {
  links?: Breadcrumb[];
  classname?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ links, classname }) => {
  const breadcrumbs = useMemo(
    () =>
      links && links.length > 0
        ? links
            .reduce(
              (r: Breadcrumb[], a: Breadcrumb) =>
                r.concat(a, { text: "->", to: "" }),
              []
            )
            .slice(0, 2 * links.length - 1)
        : [],
    [links]
  );

  return (
    <div
      className={`flex items-center text-[12px] font-medium gap-2 mb-2 ${classname}`}
    >
      {breadcrumbs.map((breadcrumb, i) =>
        breadcrumb.text === "->" ? (
          <Icon key={i} name="AngleRight" size={"16px"} />
        ) : (
          <Link
            className={cn(
              `capitalize hover:text-zui-neon`,
              i === breadcrumbs.length - 1 && "text-zui-silver"
            )}
            key={`${breadcrumb.text}-${i}`}
            href={breadcrumb.to}
            passHref
          >
            {breadcrumb.text}
          </Link>
        )
      )}
    </div>
  );
};

export default Breadcrumbs;
