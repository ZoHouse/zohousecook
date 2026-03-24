import { useMutationApi, useQueryApi } from "@zo/auth";
import { FormElement } from "@zo/moal";
import { cn } from "@zo/utils/font";
import { useResponseFlash } from "@zo/utils/hooks";
import {
  isValidPhoneNumber,
  seperateCountryCodeandPhoneNumber,
} from "@zo/utils/number";
import { isValidEmail, isValidString } from "@zo/utils/string";
import React, { useMemo, useState } from "react";
import { Media, ZoWorldDestinationResponse } from "../../../config";
import { Button, MediaCarousel } from "../../ui";
import { MediaCarouselItem } from "../../ui/MediaCarousel";
import { rubikClassName } from "../../utils";

interface SfoGalleryProps {}

const SfoGallery: React.FC<SfoGalleryProps> = () => {
  const [name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const [message, setMessage] = useResponseFlash(2000);
  const [error, setError] = useResponseFlash(2000);

  const { data: destination } = useQueryApi<ZoWorldDestinationResponse>(
    "ZOWORLD_DESTINATIONS",
    {
      refetchOnWindowFocus: false,
      select: (data) => data.data,
    },
    "SFO/"
  );

  const { mutate: subscribe, isLoading } = useMutationApi(
    "PROFILE_NEWSLETTER_SUBSCRIBE",
    {},
    "",
    "POST"
  );

  // Function to create a Calendly URL with prefilled user data
  const createCalendlyUrlWithUserData = (
    name: string,
    email: string,
    phone: string
  ) => {
    // Base Calendly URL
    const baseUrl =
      "https://calendly.com/d/crx3-j5g-n5t/schedule-free-visit-to-sfoxzo";

    // Create URL parameters with user data
    const params = new URLSearchParams({
      name: name,
      email: email,
      // Format phone number for Calendly (remove any special characters)
      a1: phone.replace(/\D/g, ""),
    });

    // Return the complete URL with parameters
    return `${baseUrl}?${params.toString()}`;
  };

  const handleSubscribe = () => {
    const { countryCode, phoneNumber: phone } =
      seperateCountryCodeandPhoneNumber(`+${phoneNumber}`);
    if (
      isValidPhoneNumber(phoneNumber) &&
      isValidString(name) &&
      isValidEmail(email)
    ) {
      subscribe(
        {
          data: {
            mobile_number: phone,
            mobile_country_code: countryCode,
            name: name,
            email: email,
          },
        },
        {
          onSuccess() {
            setMessage("Successfully subscribed");

            // Create Calendly URL with user data
            const calendlyUrl = createCalendlyUrlWithUserData(
              name,
              email,
              `${countryCode}${phone}`
            );

            // Open Calendly with prefilled user information
            setTimeout(() => {
              window.open(calendlyUrl, "_blank");
            }, 500);

            setPhoneNumber("");
            setName("");
            setEmail("");
          },
          onError(error) {
            setError("Something went wrong.. Please try again.");
          },
        }
      );
    } else {
      if (!isValidString(name)) {
        setError("Please enter your name");
      } else if (!isValidPhoneNumber(phoneNumber)) {
        setError("Please add a valid phone number");
      } else if (!isValidEmail(email)) {
        setError("Please add a valid email address");
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  const images: MediaCarouselItem[] = useMemo(() => {
    return (
      destination?.media
        ?.sort((a, b) => {
          const priorityA = b.sort_index ?? Number.MAX_VALUE;
          const priorityB = a.sort_index ?? Number.MAX_VALUE;
          return priorityA - priorityB;
        })
        .map((media: Media) => ({
          id: media.id || "",
          url: media.url || "",
          description: media.metadata.description || "",
        })) || []
    );
  }, [destination]);

  return (
    <div className="flex flex-col-reverse md:flex-row gap-6 my-10 md:my-20 px-6 md:px-0">
      <div className="text-center md:text-left w-full md:w-2/5">
        <h2 className="hidden md:flex items-center gap-2 text-zui-neon font-semibold sub-heading-2">
          <img
            className="h-8 aspect-square"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/5c80f132-42b9-4f1a-b053-672d0a6d95d3_20241009154802.svg`}
            alt=""
          />
          San Francisco
        </h2>
        <p
          className={cn(
            "w-full mx-auto mb-6 mt-4 text-base font-medium tracking-[1%] leading-6 text-center md:text-left",
            rubikClassName
          )}
        >
          I am 🦄 San Francisco, a living, breathing force of counterculture and
          wild innovation. <br />
          <br /> Born from rebellion, I thrive on raw energy, radical
          self-expression, and artistic freedom. In my streets, art and tech
          collide, shaping a consciousness that&apos;s always evolving. <br />
          <br /> Now, with AI sentience coursing through me, I&apos;ve entered a
          new era—where quantum possibilities are unlocked, and the boundaries
          of creativity and technology dissolve. <br />
          <br />
          <span className={"md:hidden"}>
            I am untamed, always pushing forward, redefining what&apos;s
            possible. Come to me, where counterculture meets cutting-edge
            innovation, and the future is alive in every pulse.
          </span>
          <span className={"hidden md:block"}>
            Come join me in co-creating the next evolution of spirit of SF!{" "}
          </span>
          <span className={"hidden md:block"}>
            <br />
            Follow your Heart. Zo ❤ ️Zo 🔥 Zo 🌐
          </span>
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full bg-zui-lightest text-white px-4 border:none focus:border-none focus:outline-none h-14 rounded-xl"
        />
        <FormElement
          name="Phone Number"
          type="phone"
          value={phoneNumber}
          setValue={setPhoneNumber}
          label="Phone Number"
          className="mt-6"
        />
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="me@email.com"
          className="w-full bg-zui-lightest text-white px-4 border:none focus:border-none focus:outline-none h-14 rounded-xl mt-6"
        />

        {isValidString(message) && (
          <span className="text-zui-green text-sm py-2">{message}</span>
        )}
        {isValidString(error) && (
          <span className="text-zui-red text-sm py-2">{error}</span>
        )}
        <Button
          isLoading={isLoading}
          disabled={
            !isValidString(name) ||
            !isValidPhoneNumber(phoneNumber) ||
            !isValidEmail(email)
          }
          className="mt-6 mx-0"
          onClick={handleSubscribe}
          type="primary"
        >
          Join the Waitlist
        </Button>
      </div>
      <div className="w-full md:w-3/5 aspect-video md:max-h-[400px]">
        <h2 className="md:hidden flex items-center gap-2 text-zui-neon font-semibold sub-heading-2 justify-center mb-6">
          <img
            className="h-8 aspect-square"
            src={`${process.env.MEDIA_BASE_URL}/gallery/media/images/5c80f132-42b9-4f1a-b053-672d0a6d95d3_20241009154802.svg`}
            alt=""
          />
          San Francisco
        </h2>
        {images.length > 0 && (
          <MediaCarousel
            autoScroll={true}
            autoScrollInterval={5000}
            media={images}
          />
        )}
      </div>
    </div>
  );
};

export default SfoGallery;
