import { Page, PageContent, PageHeader } from "@zo/moal";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import {
  TripVendorDestinationsSidebar,
  TripVendorsListSidebar,
  TripVendorsServiceSidebar,
} from "../../components/sidebars";
import { TRIP_VENDOR_OPTIONS } from "../../config/zoTrip";

const TripVendor: NextPage = () => {
  const router = useRouter();
  const [activeSidebar, setActiveSidebar] = useState<string | null>(null);

  const handleOptionClick = useCallback(
    (optionId: string) => {
      setActiveSidebar(optionId);
      router.push(`/trip-vendors/${optionId}`, undefined, { shallow: true });
    },
    [router]
  );

  const handleSidebarClose = useCallback(() => {
    setActiveSidebar(null);
    router.replace("/trip-vendors", undefined, { shallow: true });
  }, [router]);

  useEffect(() => {
    const slug = Array.isArray(router.query.slug) ? router.query.slug[0] : null;

    if (slug) {
      setActiveSidebar(slug);
    } else {
      setActiveSidebar(null);
    }
  }, [router.query.slug]);

  return (
    <Page>
      <PageHeader title="Trip Vendors" />

      <PageContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {TRIP_VENDOR_OPTIONS.map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                className="group w-full text-left rounded-xl border border-zui-light p-6 hover:shadow-lg hover:border-zui-lightest transition"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-zui-lightest text-zui-white mb-4">
                  <Icon className="w-6 h-6" />
                </div>

                <h2 className="text-lg font-semibold text-zui-neon group-hover:text-zui-white">
                  {option.name}
                </h2>

                <p className="mt-1 text-zui-silver text-sm">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </PageContent>

      <TripVendorsListSidebar
        isOpen={activeSidebar === "vendor-list"}
        onClose={handleSidebarClose}
      />

      <TripVendorsServiceSidebar
        isOpen={activeSidebar === "vendor-service"}
        onClose={handleSidebarClose}
      />

      <TripVendorDestinationsSidebar
        isOpen={activeSidebar === "vendor-destinations"}
        onClose={handleSidebarClose}
      />
    </Page>
  );
};

export default TripVendor;
