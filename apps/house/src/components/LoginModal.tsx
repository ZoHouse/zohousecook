import React, { useState } from "react";
import { requestMobileOtp, StoredSession, verifyMobileOtp } from "../lib/auth";
import { track } from "../lib/analytics/track";
import { identifyOnOtpVerified } from "../lib/analytics/identify-chain";

interface LoginModalProps {
  intent?: "apply" | "waitlist"; // default "apply"
  onClose: () => void;
  onSuccess: (session: StoredSession) => void;
}

export function LoginModal({ intent = "apply", onClose, onSuccess }: LoginModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState("91");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!/^\d{7,15}$/.test(mobile)) {
      setError("Enter a valid phone number");
      return;
    }
    track("otp_requested", { channel: intent, phone_country_code: countryCode });
    setLoading(true);
    let res: { ok: boolean; error?: string };
    try {
      res = await requestMobileOtp(mobile, countryCode);
    } catch {
      setLoading(false);
      track("otp_failed", { channel: intent, error_code: "network" });
      setError("Network error. Try again.");
      return;
    }
    setLoading(false);
    if (res.ok) {
      setStep("otp");
    } else {
      track("otp_failed", { channel: intent, error_code: res.error || "request_failed" });
      setError(res.error || "Could not send OTP");
    }
  };

  const verifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    let res: { ok: boolean; error?: string; session?: StoredSession };
    try {
      res = await verifyMobileOtp(mobile, countryCode, otp);
    } catch {
      setLoading(false);
      track("otp_failed", { channel: intent, error_code: "network" });
      setError("Network error. Try again.");
      return;
    }
    setLoading(false);
    if (res.ok && res.session) {
      const e164 = `+${countryCode}${mobile}`;
      // Fire otp_verified FIRST so it always emits on successful OTP regardless
      // of identity-write outcome.
      track("otp_verified", { channel: intent });
      try {
        await identifyOnOtpVerified({ phone_e164: e164 });
      } catch (err) {
        // Identity write should never block login.
        // eslint-disable-next-line no-console
        console.warn("identifyOnOtpVerified failed", err);
      }
      onSuccess(res.session);
    } else {
      track("otp_failed", { channel: intent, error_code: res.error || "verify_failed" });
      setError(res.error || "Invalid OTP");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md bg-[#0e0e0c] border border-[#d4af37]/30 rounded-2xl p-8"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 hover:text-white hover:bg-white/5"
        >
          ×
        </button>

        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#d4af37] mb-3">
          Zo House
        </p>
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-2 text-white">
          {step === "phone" ? "Tune in, Citizen." : "Check your phone."}
        </h2>
        <p className="text-neutral-400 text-sm mb-6">
          {step === "phone"
            ? "Enter your phone to receive a one-time code."
            : `We sent a 6-digit code to +${countryCode} ${mobile}.`}
        </p>

        {step === "phone" ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 text-white text-sm">
                +
                <input
                  type="tel"
                  inputMode="numeric"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  className="w-10 bg-transparent py-3 text-white outline-none"
                />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                autoFocus
                placeholder="Phone number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 15))}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#d4af37]/50"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold text-[11px] tracking-widest uppercase rounded-full py-3.5 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.3em] outline-none focus:border-[#d4af37]/50"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-[#d4af37] text-black font-bold text-[11px] tracking-widest uppercase rounded-full py-3.5 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify & enter"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError(null);
              }}
              className="w-full text-neutral-500 text-xs hover:text-white transition-colors underline underline-offset-4"
            >
              Change number
            </button>
          </form>
        )}

        <p className="text-[10px] text-neutral-600 text-center mt-6 tracking-wider uppercase">
          By continuing you agree to our terms & privacy
        </p>
      </div>
    </div>
  );
}
