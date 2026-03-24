import { useQueryApi } from "@zo/auth";
import { Page, PageContent, PageHeader } from "@zo/moal";
import { isValidUUID } from "@zo/utils/string";
import dayjs from "dayjs";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { PartnerAvailabilityCalendar } from "../../components/helpers/partners";
import { SelectionsInventory } from "../../config";

const AvailabilityViewPage: NextPage = () => {
  const router = useRouter();

  const startDate = dayjs().format("YYYY-MM-DD");
  const endDate = dayjs().add(7, "days").format("YYYY-MM-DD");

  const params: { operator_id: string; start_date: string; end_date: string } =
    useMemo(() => {
      const slug = router.query.slug;
      if (Array.isArray(slug) && slug.length > 0) {
        const [operator_id] = slug;
        return {
          operator_id,
          start_date: String(router.query.start_date) || "",
          end_date: String(router.query.end_date) || "",
        };
      }
      return { operator_id: "", start_date: startDate, end_date: endDate };
    }, [router.query]);

  const { data: operators } = useQueryApi<{ value: string; label: string }[]>(
    "CAS_OPERATORS",
    {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      refetchOnMount: false,
      select: (data) =>
        data.data.map((item: any) => ({
          value: item.id,
          label: item.name,
        })),
    },
    "",
    "ordering=-created_at&limit=-1"
  );

  const queryStartDate = params.start_date || startDate;
  const queryEndDate = params.end_date || endDate;

  const { data: allInventories } = useQueryApi<SelectionsInventory[]>(
    "CAS_SELECTIONS",
    {
      enabled:
        isValidUUID(params?.operator_id) && !!queryStartDate && !!queryEndDate,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      refetchOnMount: false,
      select: (data) => data.data,
    },
    `availability-pricing/${params.operator_id}/`,
    `start_date=${queryStartDate}&end_date=${queryEndDate}`
  );

  return (
    <Page>
      <PageHeader title="Room Availability Calendar" />
      <PageContent>
        <div className="max-w-full mx-auto">
          <PartnerAvailabilityCalendar
            inventories={allInventories || []}
            operators={operators || []}
            params={params}
          />
        </div>
      </PageContent>
    </Page>
  );
};

export default AvailabilityViewPage;
