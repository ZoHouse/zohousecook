/* eslint-disable @typescript-eslint/no-explicit-any */
// Main web check-in flow component
import {
  useAuth,
  useMutationApi,
  useProfile,
  useQueryApi,
  useZostelAuth,
} from "@zo/auth";
import { GeneralObject } from "@zo/definitions/general";
import { areStringsEqual, isValidString } from "@zo/utils/string";
import { parsePhoneNumber } from "libphonenumber-js";
import moment from "moment";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import MetaTags from "../components/common/MetaTags";
import {
  Header,
  IDUpload,
  IdUploadErrorScreen,
  Login as LoginComponent,
  PersonalInfo,
  Success,
  TimeConfirmation,
  Welcome,
} from "../components/helpers";
import { Button, TextInput, ZostelLoader } from "../components/ui";
import AnimatedScreen from "../components/ui/AnimatedScreen";
import {
  Booking,
  CheckinStep,
  Country,
  UserBooking,
  ZostelStayOperatorResponse,
} from "../config";

// Define the steps for the progress indicators
const progressSteps = [
  { id: "basic-info", label: "Basic Info" },
  { id: "upload-ids", label: "Gov. ID" },
  { id: "time-confirmation", label: "Time" },
];

// Steps where header should be hidden
const noHeaderSteps = [
  "welcome",
  "booking_id",
  "username",
  "upload-ids-error",
  "checkin-success",
  "login",
];

type CheckinType = "NORMAL" | "ANONYMOUS" | "GENERIC";

// Steps where back button should be shown
const showBackButton = ["upload-ids", "time-confirmation"];

const Page: React.FC<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ metaData }) => {
  const { isLoggedIn: isZoLoggedIn } = useAuth();
  const { isLoggedIn: isZostelLoggedIn } = useZostelAuth();
  const {
    profile: zoProfile,
    updateProfile,
    refetchProfile: refetchZoProfile,
    isUpdatingProfile,
  } = useProfile();
  const router = useRouter();

  // Fetch Zostel profile when logged in
  const { data: zostelProfile, refetch: refetchZostelProfile } =
    useQueryApi<GeneralObject>("PROFILE_ME_ZOSTEL", {
      enabled: isZostelLoggedIn === true,
      refetchOnWindowFocus: false,
      select: (data) => data.data.profile,
    });

  // Combined login state from both auth systems
  const isLoggedIn = useMemo(
    () => isZoLoggedIn === true && isZostelLoggedIn === true,
    [isZoLoggedIn, isZostelLoggedIn]
  );

  const [step, setStep] = useState<CheckinStep>("welcome");
  const [mobile, setMobile] = useState<string>("");
  const [personalInfo, setPersonalInfo] = useState<GeneralObject>({});

  // Set initial loading state to true to show loader immediately on page load
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State for generic check-in flow (without booking code)
  const [isGenericCheckin, setIsGenericCheckin] = useState<boolean>(false);
  const [checkinType, setCheckinType] = useState<CheckinType>("NORMAL");
  const [isGenericCheckinError, setIsGenericCheckinError] =
    useState<boolean>(false);

  const [bookingAndOperatorError, setBookingAndOperatorError] = useState<
    string | null
  >(null);

  const [bookingCodeInput, setBookingCodeInput] = useState<string>("");

  // Extract operator ID and booking code from URL
  const [operatorId, bookingCode] = useMemo(() => {
    return [router.query.slug?.[0] || null, router.query.slug?.[1] || null];
  }, [router.query.slug]);

  // Fetch countries for dropdown
  const { data: countries } = useQueryApi<Country[]>(
    "ZOWORLD_COUNTRIES",
    {
      enabled: true,
      select: (data) => data.data.results,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    "",
    "limit=300"
  );

  // Fetch operator details
  const {
    data: operator,
    isLoading: isLoadingOperator,
    isError: isErrorOperator,
  } = useQueryApi<ZostelStayOperatorResponse>(
    "ZOSTEL_STAY_OPERATORS",
    {
      enabled: operatorId != null,
      select: (data) => data?.data.operator,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retryOnMount: false,
      retry: false,
    },
    `${operatorId}/`,
    ``
  );

  // Fetch user bookings for generic check-in flow
  const { data: userBookings } = useQueryApi<UserBooking[]>(
    "STAY_MY_BOOKINGS_LIST",
    {
      enabled: isValidString(operatorId) && isLoggedIn && !bookingCode,
      select: (data) => data.data.results,
    }
  );

  // Fetch specific booking details
  const {
    data: booking,
    isLoading: isBookingLoading,
    isError: isBookingFetchError,
  } = useQueryApi<Booking>(
    "STAY_MY_BOOKINGS_LIST",
    {
      enabled:
        isValidString(bookingCode) &&
        isLoggedIn &&
        bookingCode !== "anonymous-checkin",
      select: (data) => {
        return data?.data;
      },
      onError: () => {
        setBookingAndOperatorError(
          "This booking does not exists, or you don't have access to it."
        );
      },
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retryOnMount: false,
      retry: false,
    },
    `${bookingCode}/` || ""
  );

  // Check-in mutation
  const { mutate: checkin, isLoading: isLoadingCheckin } = useMutationApi(
    "STAY_CHECKIN",
    {},
    `${operatorId}/`
  );

  // Email addition mutation
  const { mutateAsync: addEmail } = useMutationApi("AUTH_USER_EMAIL_CREATE");

  // Get UTM source from URL
  const utmSource = useMemo(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("utm_source");
    }
    return null;
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    if (!booking || !isValidString(operatorId) || !isValidString(bookingCode)) {
      return;
    }

    const channelBooking = booking.channel_booking;
    if (!isValidString(channelBooking) || channelBooking === bookingCode) {
      return;
    }

    const { utm_source, utm_medium, utm_campaign } = router.query;
    const isCheckinButtonSource =
      areStringsEqual(utm_source as string, "web-booking") &&
      areStringsEqual(utm_medium as string, "checkin_button") &&
      areStringsEqual(utm_campaign as string, "checkin_button");

    if (!isCheckinButtonSource) return;
    const queryString = router.asPath.split("?")[1];
    const nextPath = `/${operatorId}/${channelBooking}${
      queryString ? `?${queryString}` : ""
    }`;

    router.replace(nextPath);
  }, [booking, bookingCode, operatorId, router.asPath, router.isReady]);

  const removeCountryCodeFromPhonenumber = (phonenumber?: string) => {
    if (!phonenumber) {
      return "";
    }

    try {
      let formattedNumber = phonenumber;
      if (formattedNumber[0] !== "+") {
        formattedNumber = `+${formattedNumber}`;
      }
      const parsedPhoneNumber = parsePhoneNumber(formattedNumber);
      return parsedPhoneNumber?.nationalNumber || "";
    } catch (error) {
      console.error("Error parsing phone number:", error);
      return phonenumber.replace(/^\+/, ""); // Fallback: just remove the + if present
    }
  };

  // Handle personal info form changes
  const handlePersonalInfoChange = (key: string, value: string | number) => {
    if (key === "address" && typeof value === "string") {
      value = value.replace(/[^a-zA-Z0-9, .\-/'#&@:()[\]"]/g, "");
    }
    setPersonalInfo((prev) => ({ ...prev, [key]: value }));
  };

  // Check if user has completed profile and uploaded IDs
  const isRepeatUser = useMemo(() => {
    if (!zoProfile) return false;

    // Check if all user info fields are present
    const areAllUserInfoFieldsPresent = () =>
      isValidString(zoProfile.first_name) &&
      isValidString(zoProfile.mobile_number) &&
      isValidString(zoProfile.address) &&
      isValidString(zoProfile.country?.code) &&
      isValidString(zoProfile.gender);

    const hasUserUploadedId = () => {
      if (!zostelProfile?.assets) return false;

      // Find the validated front-side asset (type 116)
      const validatedFrontAsset = zostelProfile.assets.find(
        (asset: any) =>
          asset.type === 116 && asset.validation_status === "Validated"
      );

      // If no validated front asset exists, the condition is not met.
      if (!validatedFrontAsset) {
        return false;
      }

      // Check if the document type requires a back side.
      if (validatedFrontAsset.document_type?.requires_back === true) {
        // If it does, check for the existence of the back-side asset (type 117).
        const backAssetExists = zostelProfile.assets.some(
          (asset: any) => asset.type === 117
        );
        return backAssetExists;
      } else {
        // If it doesn't require a back side, the validated front is sufficient.
        return true;
      }
    };

    if (areAllUserInfoFieldsPresent() && hasUserUploadedId()) {
      return true;
    }
    return false;
  }, [zostelProfile, zoProfile]);

  // Move to next step in flow
  const nextStep = () => {
    if (!isLoggedIn) {
      setStep("login");
      return;
    }

    const currentStep = step;

    switch (currentStep) {
      case "basic-info":
        if (isRepeatUser) {
          setStep("time-confirmation");
        } else {
          setStep("upload-ids");
        }
        break;
      case "upload-ids":
        if (isRepeatUser) {
          refetchZostelProfile();
          refetchZoProfile();
        }
        setStep("time-confirmation");
        break;
      case "time-confirmation":
        setStep("checkin-success");
        break;
      case "checkin-success":
        break;
      default:
        break;
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (!isLoggedIn) {
      setStep("login");
      return;
    }
    const currentStep = step;

    switch (currentStep) {
      case "time-confirmation":
        setStep("upload-ids");
        break;
      case "upload-ids":
        setStep("basic-info");
        break;
      case "basic-info":
        // Do nothing since this is the first step
        break;
      default:
        break;
    }
  };

  // Get current progress step for progress indicator
  const getCurrentProgressStep = () => {
    switch (step) {
      case "basic-info":
        return 0;
      case "upload-ids":
        return 1;
      case "time-confirmation":
        return 2;
      case "checkin-success":
        return 3;
      default:
        return 0;
    }
  };

  // Determine if header should be visible
  const isHeaderVisible = useMemo(() => {
    return (
      (isLoggedIn || step === "login") &&
      !noHeaderSteps.includes(step) &&
      step !== "checkin-success"
    );
  }, [isLoggedIn, step]);

  // Handle personal info form submission
  const handlePersonalInfoSubmit = async () => {
    const data = {
      first_name: personalInfo.first_name,
      last_name: personalInfo.last_name,
      address: personalInfo.address,
      country: personalInfo.country,
      gender: personalInfo.gender,
      pincode: personalInfo.pincode,
      date_of_birth: personalInfo.date_of_birth,
    };

    const hasUserUploadedId = () => {
      if (!zostelProfile?.assets) return false;

      // Find the validated front-side asset (type 116)
      const validatedFrontAsset = zostelProfile.assets.find(
        (asset: any) =>
          asset.type === 116 && asset.validation_status === "Validated"
      );

      // If no validated front asset exists, the condition is not met.
      if (!validatedFrontAsset) {
        return false;
      }

      // Check if the document type requires a back side.
      if (validatedFrontAsset.document_type?.requires_back === true) {
        // If it does, check for the existence of the back-side asset (type 117).
        const backAssetExists = zostelProfile.assets.some(
          (asset: any) => asset.type === 117
        );
        return backAssetExists;
      } else {
        // If it doesn't require a back side, the validated front is sufficient.
        return true;
      }
    };

    // Check if profile data has changed
    const checkProfileChanged = () => {
      return (
        zoProfile.first_name !== data.first_name ||
        zoProfile.last_name !== data.last_name ||
        zoProfile.address !== data.address ||
        zoProfile.country.code !== data.country ||
        zoProfile.gender !== data.gender ||
        zoProfile.pincode !== data.pincode ||
        zoProfile.date_of_birth !== data.date_of_birth
      );
    };

    // Add email if not present
    if (
      !isValidString(zoProfile.email_address) &&
      !isValidString(zostelProfile?.email)
    ) {
      await addEmail(
        {
          data: {
            email_address: personalInfo.email_address,
          },
        },
        {
          onError: (error: any) => {
            if (error?.response?.status === 409) {
              toast.error(
                "The email provided is already associated with a different user. Please provide a different email address."
              );
            }
          },
        }
      );

      localStorage.setItem("unverified-email", personalInfo.email_address);
    }

    if (!checkProfileChanged()) {
      if (isRepeatUser) {
        setStep("time-confirmation");
      } else {
        if (hasUserUploadedId()) {
          setStep("time-confirmation");
        } else {
          setStep("upload-ids");
        }
      }
      return;
    }

    if (checkProfileChanged()) {
      updateProfile(
        { data },
        {
          onSuccess: (data) => {
            refetchZostelProfile();
            toast.success("Profile updated successfully");
            setTimeout(() => {
              if (isRepeatUser) {
                setStep("time-confirmation");
              } else {
                if (hasUserUploadedId()) {
                  setStep("time-confirmation");
                } else {
                  setStep("upload-ids");
                }
              }
            }, 500);
          },
        }
      );
    }
  };

  // Handle ID upload completion
  const handleIDUpload = (data: GeneralObject) => {
    if (isRepeatUser) {
      setStep("time-confirmation");
    } else {
      nextStep();
    }
  };

  // Handle time confirmation submission
  const handleTimeConfirmation = (data: GeneralObject) => {
    checkin(
      { data },
      {
        onSuccess: () => {
          setStep("checkin-success");
        },
        onError: () => {
          toast.error("Error checking in");
        },
      }
    );
  };

  // Handle welcome screen submission
  const handleWelcomeSubmit = () => {
    if (isLoggedIn) {
      if (isRepeatUser) {
        setStep("time-confirmation");
      } else {
        setStep("basic-info");
      }
    } else {
      setStep("login");
    }
  };

  const successViewBookingHandler = () => {
    if (isValidString(bookingCode) && isValidString(operatorId)) {
      window.open(
        `${
          process.env.ZOSTEL_WEB_URL
        }/booking/${bookingCode?.toUpperCase()}?utm_source=web-checkin`,
        "_blank"
      );
    }
  };

  const hasUserCheckedIn = useMemo(() => {
    return (
      booking?.checkins?.find(
        (f: GeneralObject) => f.user.mobile === zostelProfile?.mobile
      ) != null
    );
  }, [booking?.checkins, zostelProfile?.mobile]);

  // Render current step component
  const renderStep = () => {
    // Show loader during initial loading
    if (isLoading) {
      return <ZostelLoader isLoading={true} />;
    }

    // Handle invalid URL parameters
    if (!operatorId) {
      return (
        <AnimatedScreen key="invalid-operator">
          Invalid operator code
        </AnimatedScreen>
      );
    }

    if (!isLoggedIn) {
      return (
        <AnimatedScreen key="login">
          <LoginComponent
            mobile={mobile}
            setMobile={setMobile}
            operatorName={operator?.name}
          />
        </AnimatedScreen>
      );
    }

    if (isGenericCheckin && isGenericCheckinError) {
      return (
        <AnimatedScreen key="no-bookings">
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-xl font-semibold mb-4">
              Oops! No Bookings Found
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Have a booking we couldn&apos;t find? No worries! Just enter your
              booking ID below and we&apos;ll get you checked in right away! 🚀
            </p>
            <div className="w-full max-w-md space-y-4">
              <TextInput
                id="booking-code"
                label="Enter Booking Code (ex: XXX123-AXP1W23)"
                value={bookingCodeInput}
                onChange={setBookingCodeInput}
                autoComplete="off"
              />
              <Button
                variant="primary"
                onClick={handleGenericBookingCodeSubmit}
              >
                Go to Booking
              </Button>
            </div>
          </div>
        </AnimatedScreen>
      );
    }

    // Check if booking data is still loading
    if ((isBookingLoading || isLoadingOperator) && bookingCode) {
      return (
        <AnimatedScreen key="welcome-loading">
          <Welcome
            onSubmit={handleWelcomeSubmit}
            property={operator as ZostelStayOperatorResponse}
            bookingCode={bookingCode}
            checkin={booking?.checkin || ""}
            checkout={booking?.checkout || ""}
            status={booking?.status || ""}
            isLoading={true}
            isError={false}
            guest={
              booking?.guests?.map(
                (guest) => guest.name || "Fellow Zostelers"
              ) || []
            }
            isGenericCheckin={checkinType === "GENERIC"}
          />
        </AnimatedScreen>
      );
    }

    // Handle completed check-ins - priority over step state
    if (hasUserCheckedIn) {
      return (
        <AnimatedScreen key="success">
          <Success
            propertyImage={operator?.images?.[0]}
            propertyName={operator?.name || "Zostel"}
            viewBookingHandler={successViewBookingHandler}
            propertyCity={operator?.city || "Zostel"}
          />
        </AnimatedScreen>
      );
    }

    // Handle error states
    if (
      (isBookingFetchError || isErrorOperator) &&
      !isGenericCheckin &&
      bookingCode
    ) {
      return (
        <AnimatedScreen key="welcome-error">
          <Welcome
            onSubmit={handleWelcomeSubmit}
            property={operator as ZostelStayOperatorResponse}
            bookingCode={bookingCode}
            checkin={booking?.checkin || ""}
            checkout={booking?.checkout || ""}
            isLoading={false}
            isError={true}
            status={booking?.status || ""}
            guest={
              booking?.guests?.map(
                (guest) => guest.name || "Fellow Zostelers"
              ) || []
            }
            isGenericCheckin={checkinType === "GENERIC"}
          />
        </AnimatedScreen>
      );
    }

    // Render the appropriate step based on the current step state
    if (step === "welcome" && bookingCode) {
      return (
        <AnimatedScreen key="welcome">
          <Welcome
            onSubmit={handleWelcomeSubmit}
            property={operator as ZostelStayOperatorResponse}
            bookingCode={bookingCode}
            checkin={booking?.checkin || ""}
            checkout={booking?.checkout || ""}
            isLoading={false}
            isError={false}
            status={booking?.status || ""}
            guest={
              booking?.guests?.map(
                (guest) => guest.name || "Fellow Zostelers"
              ) || []
            }
            isGenericCheckin={checkinType === "GENERIC"}
          />
        </AnimatedScreen>
      );
    }

    if (step === "login") {
      return (
        <AnimatedScreen key="login">
          <LoginComponent
            mobile={mobile}
            setMobile={setMobile}
            operatorName={operator?.name}
          />
        </AnimatedScreen>
      );
    }

    if (step === "basic-info") {
      return (
        <AnimatedScreen key="basic-info">
          <PersonalInfo
            formData={personalInfo}
            countries={countries || []}
            isLoading={isUpdatingProfile}
            mobileNumber={zoProfile?.mobile_number || mobile}
            actionText="Next"
            handleChange={handlePersonalInfoChange}
            onSubmit={handlePersonalInfoSubmit}
          />
        </AnimatedScreen>
      );
    }

    if (step === "upload-ids") {
      return (
        <AnimatedScreen key="upload-ids">
          <IDUpload
            isRepeatUser={isRepeatUser}
            setCheckinStep={(newStep: CheckinStep) => setStep(newStep)}
            onSubmit={handleIDUpload}
            availableIds={
              operator?.kyc_documents?.map((id) => ({
                name: id.requires_back
                  ? `${id.name} (Front & Back)`
                  : `${id.name} (Front)`,
                id: id.id.toString(),
                isBackRequired: id.requires_back,
              })) || []
            }
          />
        </AnimatedScreen>
      );
    }

    if (step === "upload-ids-error") {
      return (
        <AnimatedScreen key="upload-ids-error">
          <IdUploadErrorScreen />
        </AnimatedScreen>
      );
    }

    if (
      step === "time-confirmation" &&
      ((bookingCode && booking) || bookingCode === "anonymous-checkin")
    ) {
      return (
        <AnimatedScreen key="time-confirmation">
          <TimeConfirmation
            onSuccess={handleTimeConfirmation}
            user={personalInfo}
            isRepeatUser={isRepeatUser}
            ids={zostelProfile?.assets}
            isLoading={isLoadingCheckin}
            bookingCode={bookingCode}
            identifier={
              zostelProfile?.assets?.[0]?.identifier ||
              zostelProfile?.assets?.[1]?.identifier
            }
            checkin={booking?.checkin || ""}
            checkout={booking?.checkout || ""}
            setStep={setStep}
          />
        </AnimatedScreen>
      );
    }

    if (step === "checkin-success") {
      return (
        <AnimatedScreen key="checkin-success">
          <Success
            propertyImage={operator?.images?.[0]}
            propertyName={operator?.name || "Zostel"}
            viewBookingHandler={successViewBookingHandler}
            propertyCity={operator?.city || "Zostel"}
          />
        </AnimatedScreen>
      );
    }
  };

  const getGuestGender = (gender?: string) => {
    gender = gender?.toLowerCase();
    if (!gender) {
      return "";
    }
    if (gender === "m") {
      return "male";
    }
    if (gender === "f") {
      return "female";
    }
    if (gender === "o") {
      return "other";
    }
    return "";
  };

  // Main flow logic - handles state transitions based on auth and booking data
  useEffect(() => {
    const setPersonalInfoFromProfile = async () => {
      const mobileNumber =
        zostelProfile?.mobile ||
        removeCountryCodeFromPhonenumber(zoProfile.mobile_number) ||
        null;

      const guestDetails = booking?.guests?.filter(
        (guest: GeneralObject) => guest.mobile === mobileNumber
      )?.[0];

      const unverifiedEmail =
        localStorage.getItem("unverified-email") || guestDetails?.email || "";

      if (zoProfile) {
        // Set personal info from existing profile data
        setPersonalInfo({
          first_name: zoProfile.first_name || guestDetails?.first_name || "",
          last_name: zoProfile.last_name || guestDetails?.last_name || "",
          email_address:
            zoProfile.email_address ||
            zostelProfile?.email ||
            unverifiedEmail ||
            "",
          mobile_number: zoProfile.mobile_number
            ? `+${zoProfile.mobile_number}`
            : "",
          pincode: zoProfile.pincode || "",
          address: zoProfile.address || guestDetails?.address || "",
          gender: zoProfile.gender || getGuestGender(guestDetails?.gender),
          country: zoProfile.country?.code || "",
          date_of_birth: zoProfile.date_of_birth || "",
        });
      }
    };
    // Only process flow logic after initial loading is complete
    if (!isLoading) {
      (async (isLoggedIn, zoProfile, zostelProfile, booking, isLoading) => {
        // Skip state updates if we're on the error screen
        if (step === "upload-ids-error") {
          return;
        }

        if (isGenericCheckin) {
          return;
        }

        // Wait for booking data to load
        if (
          !booking &&
          isBookingLoading &&
          bookingCode !== "anonymous-checkin"
        ) {
          return;
        }

        // Handle flow based on login state
        if (isLoggedIn) {
          // Verify booking exists and belongs to correct operator
          if (booking || bookingCode === "anonymous-checkin") {
            if (
              booking &&
              areStringsEqual(booking?.operator?.code, operatorId as string)
            ) {
              // Only allow check-in for confirmed bookings
              if (booking?.status === "confirmed") {
                // Ensure both profiles are loaded
                if (zoProfile && zostelProfile) {
                  // Check if already checked in
                  const hasAlreadyCheckedIn =
                    booking?.checkins?.find(
                      (f: GeneralObject) =>
                        f.user.mobile === zostelProfile?.mobile
                    ) != null;

                  if (!hasAlreadyCheckedIn) {
                    // Prepare personal info from existing profile data
                    setPersonalInfoFromProfile();

                    // Skip welcome screen only if utm_source is web-booking or booking code is anonymous-checkin
                    if (
                      utmSource === "web-booking" ||
                      bookingCode === "anonymous-checkin"
                    ) {
                      // Skip to time confirmation for repeat users
                      if (isRepeatUser) {
                        setStep("time-confirmation");
                      } else {
                        setStep("basic-info");
                      }
                    } else {
                      // Show welcome screen by default
                      setStep("welcome");
                    }
                  } else {
                    // Already checked in
                    setStep("checkin-success");
                    setBookingAndOperatorError("You have already checked in.");
                  }
                }
              } else {
                // Booking not confirmed
                if (bookingCode === "anonymous-checkin") {
                  setPersonalInfoFromProfile();
                  setStep("basic-info");
                } else {
                  setStep("welcome");
                  setBookingAndOperatorError(
                    "Check-in is not available for this booking. Status: " +
                      (booking?.status || "unknown")
                  );
                }
              }
            } else {
              if (bookingCode === "anonymous-checkin") {
                setPersonalInfoFromProfile();
                if (isRepeatUser) {
                  setStep("time-confirmation");
                } else {
                  setStep("basic-info");
                }
              } else {
                // Booking doesn't belong to this operator
                setStep("welcome");
                setBookingAndOperatorError(
                  "This booking does not belong to this property."
                );
              }
            }
          } else if (isBookingFetchError) {
            // Handle booking fetch error
            setStep("welcome");
            setBookingAndOperatorError(
              "Unable to retrieve booking information. Please try again later."
            );
          } else {
            // No booking data yet
            setStep("welcome");
          }
        } else {
          setStep("login");
        }
      })(isLoggedIn, zoProfile, zostelProfile, booking, isLoading);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoggedIn,
    zoProfile,
    zostelProfile,
    booking,
    isBookingLoading,
    isBookingFetchError,
    isLoading,
    utmSource,
  ]);

  // Show toast for booking/operator errors
  useEffect(() => {
    if (bookingAndOperatorError) {
      console.warn(bookingAndOperatorError);
    }
  }, [bookingAndOperatorError]);

  // Handle generic check-in flow (no booking code)
  useEffect(() => {
    if (
      isValidString(operatorId) &&
      !bookingCode &&
      isLoggedIn &&
      userBookings
    ) {
      // Find confirmed bookings for this operator with future dates
      setIsGenericCheckin(true);

      const matchingBookings = userBookings?.filter(
        (booking: GeneralObject) =>
          booking.status === "confirmed" &&
          moment(booking.checkin)
            .startOf("day")
            .isSameOrAfter(moment().startOf("day")) &&
          booking.operator.code === operatorId
      );

      if (matchingBookings && matchingBookings.length > 0) {
        setIsGenericCheckin(false);
        setCheckinType("GENERIC");
        router.push(`/${operatorId}/${matchingBookings[0].code}`);
      } else {
        setIsGenericCheckin(false);
        setIsGenericCheckinError(true);
        setBookingAndOperatorError(
          "No upcoming bookings found for this property."
        );
      }
    }
  }, [operatorId, bookingCode, userBookings, isLoggedIn, router]);

  // Initial loading state - show loader for 2 seconds before rendering content
  useEffect(() => {
    // Set a timer to hide the loader after 2 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Clean up the timer if component unmounts
    return () => clearTimeout(timer);
  }, []);

  const handleGenericBookingCodeSubmit = () => {
    const bookingCode = bookingCodeInput.trim();
    if (bookingCode) {
      setIsGenericCheckin(false);
      setIsGenericCheckinError(false);
      router.push(`/${operatorId}/${bookingCode}`);
    }
  };

  const handleGenericBookingCodeSkip = () => {
    setIsGenericCheckin(false);
    setIsGenericCheckinError(false);
    router.push(`/${operatorId}/anonymous-checkin`);
  };

  return (
    <div className="flex flex-col flex-1 relative h-full px-6">
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <Header
        isHeaderVisible={isHeaderVisible}
        showBackButton={showBackButton.includes(step)}
        step={step}
        goBack={goBack}
        progressSteps={progressSteps}
        getCurrentProgressStep={getCurrentProgressStep}
        isRepeatUser={isRepeatUser}
        goBackHandlerForRepeatUser={setStep.bind(null, "time-confirmation")}
      />
      <div className="py-6 flex-1 relative">
        {isGenericCheckinError ? (
          <div className="h-full flex flex-col">
            <div className="flex flex-col items-center justify-center flex-1">
              <Image
                src="https://cdn.zo.xyz/gallery/media/images/2fc1c8a7-5018-4c6b-8a35-455c729dba8b_20250414105420.png?w=400"
                alt="No Bookings Found"
                width={100}
                height={100}
                priority
              />
              <h2 className="mobile-title mt-6">No booking found!</h2>
              <p className="body-text text-zostel-light-text-primary text-center mb-6">
                Paste or enter your Booking ID
              </p>
              <div className="w-full max-w-md space-y-4">
                <TextInput
                  id="booking-code"
                  label="Enter Booking Code (ex: XXX123-AXP1W23)"
                  value={bookingCodeInput}
                  onChange={setBookingCodeInput}
                  autoComplete="off"
                />

                <Button
                  fullWidth
                  variant="tertiary"
                  onClick={handleGenericBookingCodeSkip}
                  className="text-zostel-light-text-primary mt-14"
                >
                  I don’t have a booking ID
                </Button>
              </div>
            </div>

            <div className="flex-shrink-0">
              <Button
                fullWidth
                disabled={!isValidString(bookingCodeInput)}
                onClick={handleGenericBookingCodeSubmit}
                className="justify-self-end self-end"
              >
                Get Booking Info
              </Button>
            </div>
          </div>
        ) : (
          renderStep()
        )}
      </div>
    </div>
  );
};

export default Page;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params || {};
  const operatorId = Array.isArray(slug) && slug.length >= 2 ? slug[0] : null;

  try {
    const getOperatorName = async (operatorId: string | null) => {
      if (!operatorId) {
        return { operatorName: "Zostel", image: "" };
      }
      try {
        const url = `${process.env.API_BASE_URL_ZOSTEL}/api/v1/stay/operators/${operatorId}?fields=name`;
        const operatorInfo = await fetch(url);
        const text = await operatorInfo.text();

        // Try to parse as JSON, handle HTML responses
        let data;
        try {
          data = JSON.parse(text);
        } catch (error) {
          console.error("Failed to parse operator response as JSON:", error);
          return { operatorName: "Zostel", image: "" };
        }

        const operatorName = data.operator?.name || "Zostel";
        const image = data.operator?.images?.[0]?.image || "";
        return { operatorName, image };
      } catch (error) {
        console.error("Error fetching operator data:", error);
        return { operatorName: "Zostel", image: "" };
      }
    };

    const { operatorName } = await getOperatorName(operatorId);

    const metaData = {
      title: `Web Check-in Now | You're invited to ${operatorName}`,
      description: `Hey, Zobu has got your stay sorted at ${operatorName}! If you've received this link, you're part of the crew. Fill in your details now and check in hassle-free—so you can jump straight into the adventure! 🚀`,
      image: `https://cdn.zo.xyz/gallery/media/images/d10bd80a-94a6-4371-a830-c0cafbe1a963_20250325120708.png?w=400`,
    };

    return {
      props: { metaData },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      props: {
        metaData: {
          title: "Web Check-in Now | You're invited to Zostel",
          description:
            "Hey, Zobu has got your stay sorted! If you've received this link, you're part of the crew. Fill in your details now and check in hassle-free—so you can jump straight into the adventure! 🚀",
          image: "",
        },
      },
    };
  }
};
