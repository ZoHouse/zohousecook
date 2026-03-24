import Paid from "@mui/icons-material/Paid";
import { Page, PageContent, PageHeader } from "@zo/moal";
import { useVisibilityState } from "@zo/utils/hooks";
import { combineRouteAndQueryParams } from "@zo/utils/string";
import { NextPage } from "next";
import { useRouter } from "next/router";
import type { ElementType } from "react";
import { useEffect } from "react";
import VibeCuratorRewardSidebar from "../../components/sidebars/VibeCuratorRewardSidebar";
import vibeCuratorConfig from "../../config/vibeCurator.json";

const ICON_MAP: Record<string, ElementType> = {
  Paid,
};

const VIBE_CURATOR_TOOLS = vibeCuratorConfig.tools.map((tool) => ({
  ...tool,
  Icon: ICON_MAP[tool.icon],
}));

const VibeCurator: NextPage = () => {
  const router = useRouter();

  const [isRewardSidebarVisible, showRewardSidebar, hideRewardSidebar] =
    useVisibilityState(false);

  const toolsConfig: Record<string, { show: () => void; hide: () => void }> = {
    reward: {
      show: showRewardSidebar,
      hide: hideRewardSidebar,
    },
  };

  const handleToolClick = (toolId: string) => {
    toolsConfig[toolId]?.show();
    router.push(`/vibe-curator/${toolId}`, undefined, { shallow: true });
  };

  const handleSidebarClose = (toolId: string) => {
    toolsConfig[toolId]?.hide();
    router.replace(combineRouteAndQueryParams("/vibe-curator", {}), undefined, {
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
      <PageHeader title="Vibe Curator" />

      <PageContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {VIBE_CURATOR_TOOLS.map((tool) => {
            const Icon = tool.Icon;
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
      <VibeCuratorRewardSidebar
        isOpen={isRewardSidebarVisible}
        onClose={() => handleSidebarClose("reward")}
      />
    </Page>
  );
};

export default VibeCurator;
