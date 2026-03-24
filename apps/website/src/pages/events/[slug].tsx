import Icon from "@zo/assets/icons";
import { Loader } from "@zo/assets/lotties";
import { useAuth, useMutationApi, useProfile, useQueryApi } from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { useFormData } from "@zo/utils/hooks";
import { isValidObject } from "@zo/utils/object";
import { isValidString } from "@zo/utils/string";
import { formatAddress } from "@zo/utils/web3";
import axios from "axios";
import moment from "moment";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "react-query";
import { toast } from "sonner";
import { MetaTags, Page } from "../../components/common";
import { InvalidEventsPage } from "../../components/helpers/events";
import { Form, SidebarMini } from "../../components/ui";
import { FormElement } from "../../components/ui/FormElement/FormElement";
import { fetchMetaData, formatDateTimeRange } from "../../components/utils";
import {
  Availability,
  BookingExperienceResponse,
  BookingsQuestionnaireResponse,
  Pricing,
  Question,
  Sku,
} from "../../config";

export default function EventDetails({
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const { isLoggedIn, showLoginModal } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<"REGISTER" | "QUESTIONNAIRE">("REGISTER");
  const [isRegistrationSidebarVisible, setRegistrationSidebarVisibile] =
    useState<boolean>(false);
  const [bookingData, setBookingData] =
    useState<BookingExperienceResponse | null>(null);

  const initialData = useMemo(() => {
    if (profile) {
      return {
        name: profile?.nickname || "Zo User",
        email: profile?.email_address || "Email Not Provided",
        wallet: formatAddress(profile.wallet_address),
      };
    } else {
      return {};
    }
  }, [profile]);

  const { formData, getFormValue, handleChange, resetFormData } =
    useFormData(initialData);
  const {
    formData: questionnaireData,
    handleChange: setQuestionnaireData,
    resetFormData: resetAnswers,
  } = useFormData({});

  const { data: _bookingData } = useQueryApi<BookingExperienceResponse[]>(
    "BOOKINGS_EXPERIENCE_BOOKINGS",
    {
      enabled: isValidString(data?.pid),
      select: (data) => data.data.results,
    },
    "",
    `inventory=${data?.pid}`
  );
  const { data: questionnaire, status } =
    useQueryApi<BookingsQuestionnaireResponse>(
      "BOOKINGS",
      {
        enabled: isValidString(bookingData?.pid),
        select: (data) => data.data,
      },
      `/${bookingData?.pid}/questionnaire`
    );
  const { data: pricingData } = useQueryApi<Pricing[]>(
    "BOOKINGS_EXPERIENCE_PRICING",
    {
      select: (data) => data.data.results,
      enabled: isValidString(data?.pid) && data.skus?.length > 0,
    },
    "",
    `skus=${data?.skus?.map((sku: Sku) => sku.pid).join(",")}`
  );
  const { data: availabilityData } = useQueryApi<Availability[]>(
    "BOOKINGS_EXPERIENCE_AVAILABILITY",
    {
      select: (data) => data.data.results,
      enabled: isValidString(data?.pid) && data.skus?.length > 0,
    },
    "",
    `skus=${data?.skus?.map((sku: Sku) => sku.pid).join(",")}`
  );

  const { mutateAsync: submitQuestions } = useMutationApi("BOOKINGS");

  const ticketOptions = useMemo(() => {
    if (data) {
      return data?.skus?.map((sku: Sku) => {
        const pricing = pricingData?.find((pricing) => pricing.pid === sku.pid);
        const availability = availabilityData?.find(
          (availability) => availability.pid === sku.pid
        );
        return {
          label: `${sku.name} • ${
            pricing?.price
              ? (
                  pricing.price * Math.pow(10, -pricing.currency.decimals)
                ).toLocaleString()
              : 0
          }`,
          value: sku.pid,
          subtext: availability?.sellable
            ? `${availability?.units} Left`
            : "Unavailable",
        };
      });
    } else {
      return [];
    }
  }, [pricingData, availabilityData, data]);

  const hasRegistered = useMemo<boolean>(() => {
    if (_bookingData && _bookingData?.length > 0) {
      return (
        _bookingData?.find((booking) => booking.pid === data?.pid) === undefined
      );
    } else {
      return false;
    }
  }, [_bookingData, data]);

  const { mutate: createBooking } = useMutationApi(
    "BOOKINGS_EXPERIENCE_BOOKINGS"
  );

  const eventStatus = useMemo(() => {
    if (data && isValidObject(data)) {
      const currentTime = moment();
      const startAt = moment(data.start_at);
      const endAt = moment(data.end_at);

      let statusText = "";

      if (currentTime.isBefore(startAt)) {
        statusText = "Upcoming";
      } else if (currentTime.isBetween(startAt, endAt, undefined, "[)")) {
        statusText = "Live";
      } else {
        statusText = "Expired";
      }

      return statusText;
    } else {
      return "Event";
    }
  }, [data]);

  const eventTitle = useMemo(() => {
    if (data) {
      return `${data?.name} at ${data?.operator?.name}`;
    } else {
      return undefined;
    }
  }, [data]);

  const requestPassHandler = () => {
    createBooking(
      {
        data: {
          sku: formData.ticket,
          units: 1,
        },
      },
      {
        onSuccess(data) {
          setBookingData(data.data);
          setIsLoading(true);
        },
      }
    );
  };

  const goto = (link: string) => {
    window.open(link);
  };

  const handleRequestPass = () => {
    if (!isLoggedIn) {
      showLoginModal();
      return;
    } else {
      setRegistrationSidebarVisibile(true);
    }
  };

  const formFields: FormElement[] = [
    {
      label: "What should i call you?",
      name: "name",
      icon: "Username",
      type: "text",
      required: true,
      disabled: true,
      isHidden: !isValidString(profile?.nickname),
    },
    {
      label: "Email",
      name: "email",
      icon: "Email",
      type: "email",
      required: true,
      disabled: true,
      isHidden: !isValidString(profile?.email_address),
    },
    {
      label: "Wallet Address",
      name: "wallet",
      icon: "WalletConnect",
      type: "text",
      required: true,
      disabled: true,
      isHidden: !isValidString(profile?.wallet_address),
    },
    {
      label: "Ticket Type",
      name: "ticket",
      icon: "Ticket",
      type: "radio",
      required: true,
      options: ticketOptions,
    },
  ];

  const questionnaireFormFields: FormElement[] = useMemo(() => {
    if (questionnaire) {
      return questionnaire?.questionnaire.questions
        .filter((question: Question) => question.status === "active")
        .map((question: Question) => ({
          label: question.text,
          type: question.format,
          name: question.id,
          required: true,
          icon: "Ticket",
          options: question.choices,
        }));
    } else {
      return [];
    }
  }, [questionnaire]);

  const submitQuestionHandler = () => {
    if (Object.keys(questionnaireData).length > 0) {
      Object.keys(questionnaireData).forEach((key: string) => {
        const data: GeneralObject = {};
        data["question"] = key;

        const field = questionnaireFormFields.find(
          (field) => field.name === key
        );
        if (field?.type === "multiselect") {
          data["choices"] = questionnaireData[key];
        }
        if (field?.type === "select") {
          data["choices"] = [questionnaireData[key]];
        } else {
          data["content"] = questionnaireData[key];
        }
        submitQuestions(
          {
            data: data,
            route: `${bookingData?.pid}/questionnaire/`,
          },
          {
            onSuccess() {
              toast.success("Ticket has been booked successfully!");
              setRegistrationSidebarVisibile(false);
              setStep("REGISTER");
            },
            onError() {
              toast.error("Failed to book tickets.");
            },
          }
        );
      });
    } else {
      toast.warning("Fill in the data properly");
    }
  };

  const handleOnClose = () => {
    resetAnswers();
    resetFormData();
    setStep("REGISTER");
    setRegistrationSidebarVisibile(false);
  };

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
    }
    if (status === "error") {
      setIsLoading(false);
      setRegistrationSidebarVisibile(false);
    }
    if (status === "success") {
      setIsLoading(false);
      if (
        questionnaire?.questionnaire?.questions &&
        questionnaire?.questionnaire?.questions?.filter(
          (question) => question.status === "active"
        )?.length > 0
      ) {
        setStep("QUESTIONNAIRE");
      } else {
        toast.success("Ticket has been booked successfully!");
        setRegistrationSidebarVisibile(false);
      }

      queryClient.invalidateQueries(["bookings", "experience", "bookings"]);
    }
  }, [status, questionnaire, queryClient]);

  if (!isValidObject(data)) {
    return <InvalidEventsPage />;
  }

  return (
    <Page>
      <MetaTags
        title={eventTitle}
        image={data?.media && data?.media.length > 0 ? data?.media[0].url : ""}
        description={
          data?.description
            ? data?.description.replace(/<[^>]+>/g, "")
            : undefined
        }
      />

      <span className="zui-text-1 text-zui-silver">{eventStatus} Event</span>
      <h1 className="zui-heading-1">{data?.name}</h1>

      <div className="my-10 md:my-[104px] flex flex-col md:flex-row gap-10 md:gap-[128px]">
        <div className="w-[344px] h-[200px] flex-shrink-0">
          <img
            className="w-full h-full object-cover"
            src={
              data?.media && data?.media?.length > 0 ? data?.media[0].url : ""
            }
            height={200}
            width={344}
            alt="cover image"
          />
        </div>

        <div className="space-y-10 ">
          <div>
            <span className="uppercase text-base text-zui-silver">when</span>
            <h5 className="text-2xl text-white font-medium">
              {formatDateTimeRange(data?.start_at, data?.end_at)}
            </h5>
          </div>
          <div>
            <span className="uppercase text-base text-zui-silver">where</span>
            <h5 className="text-2xl text-white font-medium">
              <span>{data?.operator?.name}</span>
            </h5>
          </div>
          <div>
            <span className="uppercase text-base text-zui-silver">
              about event
            </span>
            <h5
              className="text-2xl text-white font-medium md:w-[70%]"
              dangerouslySetInnerHTML={{
                __html: data?.description || "",
              }}
            ></h5>
          </div>
          {data?.link && (
            <div>
              <span className="flex flex-col uppercase text-base text-zui-silver">
                Link
              </span>
              <a
                className="text-2xl text-white font-medium flex gap-2 items-center"
                href={data.link}
                target="_blank"
              >
                Link <Icon name="NewTab" size={24} />
              </a>
            </div>
          )}
        </div>
      </div>

      {eventStatus !== "Expired" && (
        <div className="border-t border-zui-light pt-10">
          {hasRegistered ? (
            <>
              <h4 className="text-2xl leading-9 md:w-[490px]">
                Zo Zo Zo! Your request received. Download Zo Club App to check
                status
              </h4>
              <div className="flex gap-6 md:gap-[114px] mt-3">
                <button
                  className="group flex items-center space-x-10"
                  onClick={goto.bind(
                    null,
                    "https://play.google.com/store/apps/details?id=xyz.zo.club"
                  )}
                >
                  <span className="zui-heading-1 text-zui-neon font-bold whitespace-nowrap">
                    Android
                  </span>
                  <div className="hidden md:grid w-20 h-20 flex-shrink-0 lg:w-[120px] lg:h-[120px] relative grid place-content-center">
                    <div className="absolute inset-0 cta-clip-path transition-all ease-in-out duration-100 animate-spin-slow bg-zui-neon" />
                    <Icon
                      className="relative"
                      name="ArrowRight"
                      size={40}
                      fill="#121212"
                    />
                  </div>
                </button>
                <button
                  onClick={goto.bind(
                    null,
                    "https://apps.apple.com/us/app/zo-club/id6449470618"
                  )}
                  className="group flex items-center space-x-10"
                >
                  <span className="zui-heading-1 text-zui-neon font-bold whitespace-nowrap">
                    iOS
                  </span>
                  <div className="hidden md:grid w-20 h-20 flex-shrink-0 lg:w-[120px] lg:h-[120px] relative grid place-content-center">
                    <div className="absolute inset-0 cta-clip-path transition-all ease-in-out duration-100 animate-spin-slow bg-zui-neon" />
                    <Icon
                      className="relative"
                      name="ArrowRight"
                      size={40}
                      fill="#121212"
                    />
                  </div>
                </button>
              </div>
            </>
          ) : (
            <button
              className="mt-20 group flex items-center space-x-10"
              onClick={handleRequestPass}
            >
              <span className="zui-heading-1 text-zui-neon font-bold whitespace-nowrap">
                Request Pass
              </span>
              <div className="w-20 h-20 flex-shrink-0 lg:w-[120px] lg:h-[120px] relative grid place-content-center">
                <div className="absolute inset-0 cta-clip-path transition-all ease-in-out duration-100 animate-spin-slow bg-zui-neon" />
                <Icon
                  className="relative"
                  name="ArrowRight"
                  size={40}
                  fill="#121212"
                />
              </div>
            </button>
          )}
        </div>
      )}
      <SidebarMini
        isOpen={isRegistrationSidebarVisible}
        onClose={handleOnClose}
        headerOptions={{
          title: isLoading ? "" : "Request Event Pass",
          hasCloseButton: true,
        }}
        footerOptions={{
          actionButtons: [
            {
              label: step === "REGISTER" ? "LFZ!" : "Send Request",
              onClick:
                step === "REGISTER"
                  ? requestPassHandler
                  : submitQuestionHandler,
              disabled: !formData.ticket,
            },
          ],
        }}
      >
        {step === "REGISTER" && !isLoading && (
          <Form
            formData={formData}
            formFields={formFields}
            getFormValue={getFormValue}
            handleChange={handleChange}
          />
        )}
        {step === "QUESTIONNAIRE" && !isLoading && (
          <Form
            formData={questionnaireData}
            formFields={questionnaireFormFields}
            getFormValue={getFormValue}
            handleChange={setQuestionnaireData}
          />
        )}
        {isLoading && (
          <div className="flex h-full items-center justify-center">
            <Loader className="w-8" />
          </div>
        )}
      </SidebarMini>
    </Page>
  );
}

export const getServerSideProps: GetServerSideProps = async (
  context: GeneralObject
) => {
  const { slug } = context.query;

  const params = `${slug}`.split("-");
  const pid = params[params.length - 1];

  if (!pid) {
    return {
      notFound: true,
    };
  }

  const eventPid = `XP-${pid}`;

  try {
    const response = await axios.get(
      `${
        process.env.API_BASE_URL
      }/api/v1/bookings/experience/inventory/${eventPid.toUpperCase()}/`
    );

    if (isValidObject(response.data)) {
      const data: BookingExperienceResponse = response.data;
      return { ...fetchMetaData, props: { data } };
    } else {
      return {
        ...fetchMetaData,
        props: {
          data: {},
        },
      };
    }
  } catch (error) {
    return {
      ...fetchMetaData,
      props: {
        data: {},
      },
    };
  }
};
