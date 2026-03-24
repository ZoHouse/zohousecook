import { InferGetServerSidePropsType } from "next";
import { getServerSideProps as getServerSidePropsType } from "next/dist/build/templates/pages";
import React from "react";
import { MetaTags, Page } from "../components/common";

import { fetchMetaData as getServerSideProps } from "../components/utils";
export { getServerSideProps };

const Privacy: React.FC<
  InferGetServerSidePropsType<typeof getServerSidePropsType>
> = ({ metaData }) => {
  return (
    <Page>
      <MetaTags
        title={metaData?.title}
        description={metaData?.description}
        image={metaData?.image}
      />
      <div className="html-content">
        <h1>Privacy Policy</h1>
        <p>
          Privacy policy is required by the law and this policy only applies to
          zoworld (zo.xyz) and not to the websites of other companies,
          individuals or organisations to whom we provide links to our websites.
        </p>
        <h2>Use of Your Information</h2>
        <p>
          We collect your information for the safety of our users who use our
          platform and guests who book through zoworld to understand who we are
          accommodating at our partner properties, for the safety of staff. In
          addition, website user and guest data is collected for statistical
          purposes. We also collect our guests&rsquo; nationality, date of
          birth, gender, for statistical analysis purposes. When you visit our
          websites, we may automatically log your IP address (the unique address
          which identifies your computer on the internet). We use IP addresses
          to help us manage our websites and to collect broad demographic
          information for analytical use. For reservations, we send guests
          confirmation emails and will therefore require your email address.
          Exceptions may occur in the case of us needing to contact previous
          guests in relation to post or lost property.
        </p>
        <h2>Reservation Data</h2>
        <p>
          In order for us to confirm a reservation for you, we do require some
          information. This will usually consist of:
        </p>
        <ol>
          <li>Your name</li>
          <li>Telephone or mobile number &ndash; in case of an emergency</li>
          <li>Gender</li>
          <li>Nationality</li>
          <li>Date of Birth</li>
          <li>Identification data i.e. Passport, Driving License details</li>
          <li>
            Credit card details, including the three-digit code that appears on
            the back of your credit card
          </li>
          <li>Date of arrival and departure</li>
          <li>Email address</li>
        </ol>
        <p>
          Upon arrival, we will require the same information from your fellow
          travellers, please ensure they are all aware of this to ensure a quick
          and efficient check-in.
        </p>
        <h2>
          <span>Credit Card Data</span>
        </h2>
        <p>
          In order to guarantee reservations via all channels (telephone,
          website or smartphone application, but not restricted to), we require
          a full 16 digit debit/credit card number, name on the card, card type
          (we accept VISA, Master card or Maestro), three digit security code
          and the expiry date. Your debit/credit card details are only used to
          secure your booking and zoworld will only debit the account if you do
          not follow our cancellation procedure. For details on canvelaation
          policies, please refer to the policy for the individual partner for
          which the booking is being made. Additionally, we may charge a monthly
          subscription fee if the user subscribes to a zoworld paid membership
          and when the user authorizes zoworld to periodically charge the card
          (monthly/quarterly/bi-annually/yearly) based on the type of membership
          chosen. The user can cancel the membership at any time. zoworld
          indemnifies itself against all data use on and reservations made via
          third party websites/agents. Please refer to their relevant privacy
          policy and terms and conditions. Guests&#39; Personal Data zoworld
          respects guest privacy and will not sell or disclose guests&rsquo;
          personal information to any other person, business or third party
          unless in the case of an emergency and/or it is seen as part of our
          duty of care.
        </p>
        <h2>Keeping Guests&#39; Information Updated</h2>
        <p>
          We have guests returning to our partner properties on a regular basis.
          It is your duty to inform us if any of your personal information,
          which we hold about you, needs to be updated. We may contact you at
          any time, if you have booked accommodation with us and we suspect we
          hold false information about you.
        </p>
        <h2>Website Security</h2>
        <p>
          The Internet is not a secure medium. However, we have put in place
          various security procedures, including firewalls that are used to
          block unauthorized traffic to our website.
        </p>
        <h2>Third Party Websites</h2>
        <p>
          Our website contains links to many other websites promoting their
          business and needs to our guests. zoworld indemnifies itself against
          all data use on and reservations made via third party websites/agents.
          Please refer to their relevant privacy policy and terms and
          conditions.
        </p>
        <h2>Photography and Film</h2>
        <p>
          No permission is needed to take photos or film at our properties.
          However, we do recommend asking for permission before photographing or
          filming other guests who are not part of your group. Verbal consent is
          solicited as a goodwill gesture. On occasions we may commission crews
          to film or take photographs at our properties for promotional
          purposes. If you do not wish to be filmed or photographed, you are
          required to voluntarily leave the filming or photography area.
        </p>
        <h2>Disclosing Guests&#39; Personal Information to Third Parties</h2>
        <p>
          Other than that for the purposes referred to in this policy, we will
          not disclose any personal information without your permission unless
          we are legally obliged to do so (for example, if required to do so by
          court order or for the purposes of prevention of fraud).
        </p>
        <h2>Your Rights</h2>
        <p>
          By submitting your information to us, you consent to the use of that
          information as set out in this Privacy Policy. You may request at any
          time that we provide you with the personal information we hold about
          you. You may also choose to add, modify or delete information about
          you stored with us. Provision of such information will be subject to
          proving your identity and full address with a utility bill and
          acceptable photo ID. For any such requests, please reach out to us on
          privacy@zo.xyz.
        </p>
        <p>
          You also have the right to lodge a complaint with an EU supervisory
          authority in case of discrepancies, however, we do hope you would give
          us chance to rectify it first by reaching out to us on privacy@zo.xyz.
        </p>
        <h3>CALIFORNIA-RESIDENT SPECIFIC RIGHTS</h3>
        <p>
          To the extent you are a &#39;consumer&#39; as defined under the
          California Consumer Privacy Act of 2018 (&quot;CCPA&quot;) and zoworld
          is a &#39;business&#39; as defined under CCPA, the following applies
          to you:
        </p>
        <p>
          Subject to the provisions of the CCPA, you have the right to request
          in the manner provided herein, for the following:
        </p>

        <ul>
          <li>
            Right to request for information about the:
            <ul>
              <li>
                Categories of Personal Data zoworld has collected about you.
              </li>
              <li>
                Specific pieces of Personal Data zoworld has collected about
                you.
              </li>
              <li>
                Categories of sources from which the Personal Data is collected.
              </li>
              <li>
                Business or commercial purpose for collecting Personal Data.
              </li>
              <li>
                Categories of third parties with whom the business shares
                Personal Data.
              </li>
            </ul>
          </li>
          <li>
            Right to request for deletion of any Personal Data collected about
            you by zoworld.
            <br />
            If you seek to exercise the foregoing rights to access or delete
            Personal Data which constitutes &#39;personal information&#39; as
            defined in CCPA, please contact us at privacy@zo.xyz. We respond to
            all requests we receive from you wishing to exercise your data
            protection rights within a reasonable timeframe in accordance with
            applicable data protection laws. By writing to us, you agree to
            receive communication from us seeking information from you in order
            to verify you to be the consumer from whom we have collected the
            Personal Data from and such other information as reasonably required
            to enable us to honour your request.
            <br />
            The list of categories of Personal Data collected and disclosed
            about consumers are enlisted under the head &#39;Use of Your
            Information. Separately, zoworld does not sell your Personal Data.
          </li>
        </ul>
        <h2>Changes to Our Privacy Policy</h2>
        <p>
          We may change our Privacy Policy at any time. Continued use of our
          website signifies that you agree to any such changes.
        </p>
      </div>
    </Page>
  );
};

export default Privacy;
