import { Page, PageContent, PageHeader } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { combineRouteAndQueryParams, isValidString } from "@zo/utils/string";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import {
  SpotlightTripManagementSidebar,
  TripFeaturedTagsSidebar,
  TripOrderManagement,
} from "../../components/sidebars";

import { TOOLS } from "../../config/zoTrip";

const ZoTripToolsPage: NextPage = () => {
  const router = useRouter();

  const [
    isFeaturedTagManagementVisible,
    showFeaturedTagManagement,
    hideFeaturedTagManagement,
  ] = useVisibilityState(false);

  const [
    isSpotlightCardManagementVisible,
    showSpotlightCardManagement,
    hideSpotlightCardManagement,
  ] = useVisibilityState(false);

  const [
    isHeaderSortingManagementVisible,
    showHeaderSortingManagement,
    hideHeaderSortingManagement,
  ] = useVisibilityState(false);

  const toolsConfig: Record<string, { show: () => void; hide: () => void }> = {
    "featured-tags": {
      show: showFeaturedTagManagement,
      hide: hideFeaturedTagManagement,
    },
    spotlights: {
      show: showSpotlightCardManagement,
      hide: hideSpotlightCardManagement,
    },
    headers: {
      show: showHeaderSortingManagement,
      hide: hideHeaderSortingManagement,
    },
  };

  const handleToolClick = (toolId: string) => {
    toolsConfig[toolId]?.show();
    router.push(`/trip-tools/${toolId}`, undefined, { shallow: true });
  };

  // Handle sidebar close
  const handleSidebarClose = (toolId: string) => {
    toolsConfig[toolId]?.hide();
    router.replace(combineRouteAndQueryParams("/trip-tools", {}), undefined, {
      shallow: true,
    });
  };

  useEffect(() => {
    const slug = router.query.slug?.[0];
    if (slug && toolsConfig[slug]) {
      toolsConfig[slug].show();
    }
  }, [router.query]);

  return (
    <Page>
      <PageHeader title="Zo Trip Tools" />

      <PageContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className="group w-full text-left rounded-xl border border-zui-light p-6 hover:shadow-lg hover:border-zui-lightest transition"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-zui-lightest text-zui-white mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-semibold text-zui-neon group-hover:text-zui-white">
                  {tool.name}
                </h2>
                <p className="mt-1 text-zui-silver text-sm">
                  {tool.description}
                </p>
              </button>
            );
          })}
        </div>
      </PageContent>

      {/* Sidebars */}
      <TripFeaturedTagsSidebar
        isOpen={isFeaturedTagManagementVisible}
        onClose={() => handleSidebarClose("featured-tags")}
      />

      <SpotlightTripManagementSidebar
        isOpen={isSpotlightCardManagementVisible}
        onClose={() => handleSidebarClose("spotlights")}
      />

      <TripOrderManagement
        isOpen={isHeaderSortingManagementVisible}
        onClose={() => handleSidebarClose("headers")}
      />
    </Page>
  );
};

export default ZoTripToolsPage;
