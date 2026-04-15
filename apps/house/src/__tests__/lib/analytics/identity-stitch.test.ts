import {
  identifyOnOtpVerified,
  tagZoProfileIfMatching,
} from "../../../lib/analytics/identify-chain";
import { _setDestinationsForTest } from "../../../lib/analytics/track";

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    capture: jest.fn(),
    people: { set: jest.fn() },
  },
}));

import posthog from "posthog-js";

describe("identify chain", () => {
  beforeEach(() => {
    localStorage.clear();
    (posthog.identify as jest.Mock).mockClear();
    (posthog.reset as jest.Mock).mockClear();
    (posthog.people.set as jest.Mock).mockClear();
    (window as any).Moengage = {
      add_unique_user_id: jest.fn(),
      add_mobile: jest.fn(),
      add_email: jest.fn(),
      add_first_name: jest.fn(),
      add_user_attribute: jest.fn(),
      destroy_session: jest.fn(),
    };
    (window as any).gtag = jest.fn();
    _setDestinationsForTest({
      ga4: jest.fn(),
      posthog: jest.fn(),
      moengage: jest.fn(),
      metaPixel: jest.fn(),
    });
  });

  it("identifies user on OTP verified with phone hash", async () => {
    const { phone_hash } = await identifyOnOtpVerified({
      phone_e164: "+919876543210",
      email: "x@y.com",
      full_name: "Test",
    });
    expect(phone_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(posthog.identify).toHaveBeenCalledWith(phone_hash, expect.any(Object));
    expect((window as any).Moengage.add_unique_user_id).toHaveBeenCalledWith(
      phone_hash
    );
    expect((window as any).Moengage.add_mobile).toHaveBeenCalledWith(
      "+919876543210"
    );
  });

  it("on phone switch, calls posthog.reset() and clears MoEngage session", async () => {
    await identifyOnOtpVerified({ phone_e164: "+919876543210" });
    (posthog.reset as jest.Mock).mockClear();
    (window as any).Moengage.destroy_session.mockClear();

    await identifyOnOtpVerified({ phone_e164: "+919999999999" });
    expect(posthog.reset).toHaveBeenCalled();
    expect((window as any).Moengage.destroy_session).toHaveBeenCalled();
  });

  it("tagZoProfileIfMatching tags when phones match", async () => {
    const { phone_hash } = await identifyOnOtpVerified({
      phone_e164: "+919876543210",
    });
    await tagZoProfileIfMatching("pid_xyz", phone_hash, "+919876543210");
    expect(posthog.people.set).toHaveBeenCalledWith({ zo_pid: "pid_xyz" });
    expect((window as any).Moengage.add_user_attribute).toHaveBeenCalledWith(
      "zo_pid",
      "pid_xyz"
    );
  });

  it("tagZoProfileIfMatching fires identity_collision event when phones differ", async () => {
    const trackSpy = jest.fn();
    _setDestinationsForTest({
      ga4: trackSpy,
      posthog: jest.fn(),
      moengage: jest.fn(),
      metaPixel: jest.fn(),
    });
    const { phone_hash } = await identifyOnOtpVerified({
      phone_e164: "+919876543210",
    });
    await tagZoProfileIfMatching("pid_xyz", phone_hash, "+919999999999");
    expect(posthog.people.set).not.toHaveBeenCalled();
    expect(trackSpy).toHaveBeenCalledWith(
      "identity_collision",
      expect.objectContaining({ member_id: "pid_xyz" })
    );
  });
});
