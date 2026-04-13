// NOTE: Full focus trap is tracked as a follow-up. Esc-close + scrim-close +
// close-button are wired.
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth, useProfile, useMutationApi, useQueryApi } from "@zo/auth";
import { useMyNfts } from "../../hooks/useMyNfts";
import useInstagramConnect from "../../hooks/useInstagramConnect";

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-white/20 border-t-white"
      style={{ width: size, height: size }}
    />
  );
}

function fixAvatarUrl(url?: string): string | undefined {
  if (!url || url.length === 0) return undefined;
  if (url.startsWith("ipfs://")) return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  return url.replace("static.cdn.zo.xyz", "proxy.cdn.zo.xyz");
}

function formatAddress(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2 mt-6 first:mt-0">
      <h3 className="text-[11px] font-medium text-white/40 uppercase tracking-wider">{title}</h3>
      {right}
    </div>
  );
}

type EditableRowType = "text" | "textarea" | "date" | "select";

interface EditableRowProps {
  label: string;
  value: string;
  field: string;
  type?: EditableRowType;
  options?: { value: string; label: string }[];
  disabled?: boolean;
  onSave: (field: string, value: string) => Promise<void>;
  displayValue?: string;
}

function EditableRow({
  label, value, field, type = "text", options, disabled = false, onSave, displayValue,
}: EditableRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(field, draft);
      setEditing(false);
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => { setDraft(value); setError(null); setEditing(false); };

  const shown = displayValue ?? value;

  return (
    <div className="py-3 border-b border-white/5 last:border-b-0">
      <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{label}</p>
      {editing ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-stretch gap-2">
            {type === "textarea" ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
                autoFocus
                rows={3}
                className="flex-1 bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/30 resize-y"
              />
            ) : type === "select" ? (
              <select
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
                className="flex-1 bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="">Not set</option>
                {options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commit(); }
                  if (e.key === "Escape") { e.preventDefault(); cancel(); }
                }}
                autoFocus
                className="flex-1 bg-white/5 border border-white/15 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
              />
            )}
            <button
              onClick={commit}
              disabled={saving}
              className="px-3 text-[11px] font-medium bg-white text-black rounded-md hover:bg-white/90 disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Spinner size={12} /> : "Save"}
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="px-3 text-[11px] text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/90 min-w-0 break-words flex-1">
            {shown ? shown : <span className="italic text-white/40">Not set</span>}
          </p>
          {!disabled && (
            <button
              onClick={() => { setDraft(value); setEditing(true); }}
              className="px-2 py-1 text-[10px] text-white/60 hover:text-white border border-white/10 hover:border-white/25 rounded-md transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface ConnectedItemRowProps {
  icon: React.ReactNode;
  iconBg?: string;
  primary: string;
  secondary?: string;
  isPrimary?: boolean;
  verified?: boolean;
  showVerification?: boolean;
  onMakePrimary?: () => void;
  onRemove?: () => void;
}

function ConnectedItemRow({
  icon, iconBg = "bg-white/10", primary, secondary, isPrimary,
  verified, showVerification, onMakePrimary, onRemove,
}: ConnectedItemRowProps) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { setConfirming(false); }, [primary]);

  return (
    <div className={`group flex items-center gap-3 py-3 border-b border-white/5 last:border-b-0 ${confirming ? "bg-red-500/10 -mx-2 px-2 rounded-md" : ""}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate">{primary}</p>
        {(secondary || showVerification) && (
          <div className="flex items-center gap-2 mt-0.5">
            {showVerification && (
              <span className="flex items-center gap-1 text-[11px]">
                <span className={`w-1.5 h-1.5 rounded-full ${verified ? "bg-green-400" : "bg-amber-400"}`} />
                <span className={verified ? "text-green-400" : "text-amber-400"}>
                  {verified ? "Verified" : "Unverified"}
                </span>
              </span>
            )}
            {secondary && <span className="text-[11px] text-white/50 truncate">{secondary}</span>}
          </div>
        )}
      </div>

      {confirming ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { onRemove?.(); setConfirming(false); }}
            className="px-2 py-1 text-[11px] bg-red-500 text-white rounded-md hover:bg-red-400"
          >
            Remove
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-2 py-1 text-[11px] text-white/60 hover:text-white"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {isPrimary ? (
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-green-500/20 text-green-400 rounded-full">
              Primary
            </span>
          ) : (
            onMakePrimary && (
              <button
                onClick={onMakePrimary}
                className="text-[11px] text-white/60 hover:text-white"
              >
                Make primary
              </button>
            )
          )}
          {onRemove && !isPrimary && (
            <button
              onClick={() => setConfirming(true)}
              aria-label="Remove"
              className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 3L3 9M3 3l6 6" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function LocationSection() {
  const { isLoggedIn } = useAuth();
  const { profile, updateProfile, refetchProfile } = useProfile();
  const { data: countriesData } = useQueryApi(
    "CAS_COUNTRIES",
    { enabled: isLoggedIn === true, refetchOnWindowFocus: false },
    "",
    "limit=-1&ordering=name"
  );

  const countryOptions = useMemo<{ value: string; label: string }[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (countriesData as any)?.data;
    const list: Array<{ code: string; name: string }> = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.results)
      ? raw.results
      : [];
    return list
      .filter((c) => c?.code && c?.name)
      .map((c) => ({ value: c.code, label: c.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [countriesData]);

  const currentCountryCode = profile?.country?.code || "";
  const currentCountryLabel = profile?.country?.name || "";

  const handleSave = useCallback(
    async (field: string, value: string) => {
      await new Promise<void>((resolve, reject) => {
        updateProfile(
          { data: { [field]: value } },
          {
            onSuccess: () => {
              refetchProfile();
              resolve();
            },
            onError: (err: unknown) => reject(err),
          }
        );
      });
    },
    [updateProfile, refetchProfile]
  );

  return (
    <section>
      <SectionHeader title="Location" />
      <EditableRow label="Hometown" value={profile?.place_name || ""} field="place_name" onSave={handleSave} />
      <EditableRow
        label="Nationality"
        value={currentCountryCode}
        displayValue={currentCountryLabel}
        field="country"
        type="select"
        options={countryOptions}
        onSave={handleSave}
      />
      <EditableRow label="Address" value={profile?.address || ""} field="address" type="textarea" onSave={handleSave} />
      <EditableRow label="Pincode" value={profile?.pincode || ""} field="pincode" onSave={handleSave} />
    </section>
  );
}

function WalletsSection() {
  const { isLoggedIn } = useAuth();
  const { refetchProfile } = useProfile();
  const { data: userWallets, isLoading, refetch } = useQueryApi(
    "AUTH_USER_WEB3_WALLETS",
    { enabled: isLoggedIn === true },
    "",
    ""
  );
  const { mutate: updateWallet } = useMutationApi("AUTH_USER_WEB3_WALLETS", {}, "", "PUT");
  const { mutate: deleteWallet } = useMutationApi("AUTH_USER_WEB3_WALLETS", {}, "", "DELETE");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wallets: any[] = (userWallets as any)?.data?.web3_wallets || [];

  const setPrimary = (addr: string) => {
    updateWallet(
      { data: { wallet_address: addr, primary: true } },
      {
        onSuccess: () => {
          refetch();
          refetchProfile();
        },
      }
    );
  };
  const remove = (addr: string) => {
    deleteWallet(
      { data: { wallet_address: addr } },
      {
        onSuccess: () => {
          refetch();
          refetchProfile();
        },
      }
    );
  };

  return (
    <section>
      <SectionHeader title="Wallets" />
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Spinner size={20} />
        </div>
      ) : wallets.length === 0 ? (
        <p className="text-sm text-white/40 italic py-2">No wallets connected</p>
      ) : (
        wallets.map((w) => (
          <ConnectedItemRow
            key={w.wallet_address}
            icon="W"
            primary={formatAddress(w.wallet_address)}
            secondary={w.wallet_address}
            isPrimary={!!w.primary}
            onMakePrimary={() => setPrimary(w.wallet_address)}
            onRemove={() => remove(w.wallet_address)}
          />
        ))
      )}
    </section>
  );
}

function PhonesSection() {
  const { isLoggedIn } = useAuth();
  const { refetchProfile } = useProfile();
  const { data: userMobiles, isLoading, refetch } = useQueryApi(
    "AUTH_USER_MOBILES",
    { enabled: isLoggedIn === true },
    "",
    ""
  );
  const { mutate: updateMobile } = useMutationApi("AUTH_USER_MOBILES", {}, "", "PUT");
  const { mutate: deleteMobile } = useMutationApi("AUTH_USER_MOBILES", {}, "", "DELETE");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mobiles: any[] = (userMobiles as any)?.data?.mobiles || [];

  const setPrimary = (number: string, code: string) => {
    updateMobile(
      { data: { mobile_number: number, mobile_country_code: code, primary: true } },
      {
        onSuccess: () => {
          refetch();
          refetchProfile();
        },
      }
    );
  };
  const remove = (number: string, code: string) => {
    deleteMobile(
      { data: { mobile_number: number, mobile_country_code: code } },
      {
        onSuccess: () => {
          refetch();
          refetchProfile();
        },
      }
    );
  };

  return (
    <section>
      <SectionHeader title="Phones" />
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Spinner size={20} />
        </div>
      ) : mobiles.length === 0 ? (
        <p className="text-sm text-white/40 italic py-2">No phone numbers connected</p>
      ) : (
        mobiles.map((m) => (
          <ConnectedItemRow
            key={`${m.mobile_country_code}-${m.mobile_number}`}
            icon="#"
            primary={`+${m.mobile_country_code} ${m.mobile_number}`}
            showVerification
            verified={!!m.verified}
            isPrimary={!!m.primary}
            onMakePrimary={() => setPrimary(m.mobile_number, m.mobile_country_code)}
            onRemove={() => remove(m.mobile_number, m.mobile_country_code)}
          />
        ))
      )}
    </section>
  );
}

function SocialsSection() {
  const { profile } = useProfile();
  const {
    isConnected: igConnected,
    account: igAccount,
    connect: connectIg,
    disconnect: disconnectIg,
  } = useInstagramConnect();

  const otherSocials = useMemo(() => {
    if (!profile?.socials) return [] as { category: string; link: string; verified: boolean; handle: string }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (profile.socials as any[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((s: any) => s.category !== "instagram")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((s: any) => ({
        category: s.category as string,
        link: s.link as string,
        verified: !!s.verified,
        handle:
          s.category === "twitter"
            ? s.link?.split(".com/")[1]
            : s.category === "telegram"
            ? s.link?.split(".me/")[1]
            : s.category === "discord"
            ? "Connected"
            : s.link,
      }));
  }, [profile?.socials]);

  const ens = profile?.ens_nickname;
  const iconMap: Record<string, string> = { twitter: "X", telegram: "TG", discord: "DC" };
  const labelMap: Record<string, string> = { twitter: "Twitter", telegram: "Telegram", discord: "Discord" };

  const instagramRow = igConnected && igAccount ? (
    <div className="flex items-center gap-3 py-3 border-b border-white/5">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
      >
        IG
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate">@{igAccount.ig_username}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-green-400">Verified</span>
          </span>
          <span className="text-[11px] text-white/50">Instagram</span>
        </div>
      </div>
      <button onClick={disconnectIg} className="text-[11px] text-red-400 hover:text-red-300">
        Disconnect
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-3 py-3 border-b border-white/5">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
      >
        IG
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90">Instagram</p>
        <p className="text-[11px] text-white/50">Not connected</p>
      </div>
      <button
        onClick={connectIg}
        className="px-3 py-1.5 text-[11px] font-semibold text-white rounded-md hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
      >
        Connect
      </button>
    </div>
  );

  return (
    <section>
      <SectionHeader title="Socials" />

      {ens && <ConnectedItemRow icon="ENS" primary={ens} />}

      {instagramRow}

      {otherSocials.map((s) => (
        <ConnectedItemRow
          key={s.category}
          icon={iconMap[s.category] || s.category.charAt(0).toUpperCase()}
          primary={s.handle || s.link}
          secondary={labelMap[s.category] || s.category}
          verified={s.verified}
          showVerification={s.verified}
        />
      ))}

      {!ens && !igConnected && otherSocials.length === 0 && (
        <p className="text-sm text-white/40 italic py-2">No socials connected yet</p>
      )}
    </section>
  );
}

function FounderNftsSection() {
  const { nfts, isLoading } = useMyNfts();
  if (isLoading) {
    return (
      <section>
        <SectionHeader title="Founder NFTs" />
        <div className="flex items-center justify-center py-8">
          <Spinner size={24} />
        </div>
      </section>
    );
  }
  if (!nfts || nfts.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Founder NFTs" right={<span className="text-[11px] text-white/40">{nfts.length}</span>} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {nfts.map((nft) => (
          <div key={nft.token_ref_id} className="relative rounded-lg overflow-hidden border border-white/10">
            <img src={nft.image_url} alt={nft.name} className="w-full aspect-square object-cover block" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
              <p className="text-[10px] text-white/90 truncate">{nft.name}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfileStrip() {
  const { profile } = useProfile();
  const [imgError, setImgError] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawAvatar = (profile as any)?.avatar?.image || (profile as any)?.pfp_image;
  const avatar = fixAvatarUrl(rawAvatar && rawAvatar.length > 0 ? rawAvatar : undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const name = (profile as any)?.nickname || profile?.custom_nickname || "Citizen";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const membership = (profile as any)?.membership as string | undefined;
  const isFounder =
    membership?.toLowerCase() === "founder" ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (profile as any)?.role === "Founder" ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (((profile as any)?.founder_nfts_count ?? 0) as number) > 0;

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 flex-shrink-0">
      <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
        {avatar && !imgError ? (
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
            <span className="text-base font-bold text-white">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">{name}</p>
          {isFounder && (
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-white/15 text-white border border-white/20 rounded-full flex-shrink-0">
              Founder
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/50 capitalize">{membership || "Citizen"} of Zo World</p>
      </div>
    </div>
  );
}

function EmailsSection() {
  const { isLoggedIn } = useAuth();
  const { refetchProfile } = useProfile();
  const { data: userEmails, isLoading, refetch } = useQueryApi(
    "AUTH_USER_EMAILS",
    { enabled: isLoggedIn === true },
    "",
    ""
  );
  const { mutate: updateEmail } = useMutationApi("AUTH_USER_EMAILS", {}, "", "PUT");
  const { mutate: deleteEmail } = useMutationApi("AUTH_USER_EMAILS", {}, "", "DELETE");
  const { mutate: createEmail } = useMutationApi("AUTH_USER_EMAIL_CREATE");

  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emails: any[] = (userEmails as any)?.data?.emails || [];

  const setPrimary = (addr: string) => {
    updateEmail(
      { data: { email_address: addr, primary: true } },
      {
        onSuccess: () => {
          refetch();
          refetchProfile();
        },
      }
    );
  };
  const remove = (addr: string) => {
    deleteEmail(
      { data: { email_address: addr } },
      {
        onSuccess: () => {
          refetch();
          refetchProfile();
        },
      }
    );
  };
  const add = () => {
    if (!newEmail || !newEmail.includes("@")) {
      setAddError("Enter a valid email");
      return;
    }
    setAddLoading(true);
    createEmail(
      { data: { email_address: newEmail } },
      {
        onSuccess: () => {
          refetch();
          setAdding(false);
          setNewEmail("");
          setAddError("");
          setAddLoading(false);
        },
        onError: () => {
          setAddError("Failed to add email");
          setAddLoading(false);
        },
      }
    );
  };

  return (
    <section>
      <SectionHeader title="Emails" />
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Spinner size={20} />
        </div>
      ) : emails.length === 0 ? (
        <p className="text-sm text-white/40 italic py-2">No emails connected</p>
      ) : (
        emails.map((e) => (
          <ConnectedItemRow
            key={e.email_address}
            icon="@"
            primary={e.email_address}
            showVerification
            verified={!!e.verified}
            isPrimary={!!e.primary}
            onMakePrimary={() => setPrimary(e.email_address)}
            onRemove={() => remove(e.email_address)}
          />
        ))
      )}

      {adding ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-stretch gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setAddError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") add();
                if (e.key === "Escape") {
                  setAdding(false);
                  setNewEmail("");
                  setAddError("");
                }
              }}
              placeholder="email@example.com"
              autoFocus
              className="flex-1 bg-white/5 border border-white/15 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/40"
            />
            <button
              onClick={add}
              disabled={addLoading}
              className="px-3 text-[11px] bg-white text-black rounded-md hover:bg-white/90 disabled:opacity-60 flex items-center gap-2"
            >
              {addLoading ? <Spinner size={12} /> : "Add"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewEmail("");
                setAddError("");
              }}
              className="px-3 text-[11px] text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
          {addError && <p className="text-[11px] text-red-400">{addError}</p>}
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white border border-dashed border-white/15 hover:border-white/30 rounded-md transition-colors"
        >
          <span>+</span> Add email
        </button>
      )}
    </section>
  );
}

function CulturesSection() {
  const { isLoggedIn } = useAuth();
  const { profile, updateProfile, refetchProfile } = useProfile();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cultures: any[] = profile?.cultures || [];
  const selectedKeys = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => new Set(cultures.map((c: any) => c.key)),
    [cultures]
  );

  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const searchQuery = search.trim() ? `search=${encodeURIComponent(search.trim())}` : "";
  const { data: allCulturesData, isLoading } = useQueryApi(
    "CAS_CULTURES",
    { enabled: isLoggedIn === true && picking },
    "",
    searchQuery
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const available: any[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (allCulturesData as any)?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.results)) return raw.results;
    if (Array.isArray(raw?.cultures)) return raw.cultures;
    return [];
  }, [allCulturesData]);

  const saveCultures = (nextKeys: string[]) => {
    setSaving(true);
    updateProfile(
      { data: { cultures: nextKeys } },
      {
        onSuccess: () => {
          refetchProfile();
          setSaving(false);
        },
        onError: () => setSaving(false),
      }
    );
  };

  const handleRemove = (key: string) => {
    saveCultures(
      cultures
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((c: any) => c.key !== key)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((c: any) => c.key)
    );
  };

  const handleToggle = (key: string) => {
    if (selectedKeys.has(key)) {
      saveCultures(Array.from(selectedKeys).filter((k) => k !== key) as string[]);
    } else {
      saveCultures([...(Array.from(selectedKeys) as string[]), key]);
    }
  };

  const pillSelected =
    "flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/10 border-white/30 text-white";
  const pillIdle =
    "flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white/5 border-white/10 hover:border-white/25 text-white/80";

  return (
    <section>
      <SectionHeader title="Cultures" right={saving ? <Spinner size={12} /> : null} />

      {cultures.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {cultures.map((c) => (
            <div
              key={c.key}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20"
            >
              {c.icon && (
                <img
                  src={fixAvatarUrl(c.icon)}
                  alt={c.name}
                  className="w-4 h-4 object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="text-xs text-white/90">{c.name}</span>
              <button
                onClick={() => handleRemove(c.key)}
                aria-label={`Remove ${c.name}`}
                className="w-4 h-4 flex items-center justify-center rounded-full text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors md:opacity-0 md:group-hover:opacity-100 opacity-100"
              >
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <path
                    d="M6.5 1.5L1.5 6.5M1.5 1.5L6.5 6.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/40 italic">No cultures selected yet — tap + to add</p>
      )}

      {!picking ? (
        <button
          onClick={() => setPicking(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white border border-dashed border-white/15 hover:border-white/30 rounded-md transition-colors"
        >
          <span>+</span> Add cultures
        </button>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cultures..."
            className="w-full bg-white/5 border border-white/15 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 placeholder:text-white/40"
          />
          <div className="max-h-[240px] overflow-y-auto -mx-1 px-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner size={20} />
              </div>
            ) : available.length === 0 ? (
              <p className="text-xs text-white/40 italic text-center py-4">
                {search ? "No cultures found" : "No cultures available"}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {available.map((c) => {
                  const isSelected = selectedKeys.has(c.key);
                  return (
                    <button
                      key={c.key}
                      onClick={() => handleToggle(c.key)}
                      disabled={saving}
                      className={`${isSelected ? pillSelected : pillIdle} transition-colors disabled:opacity-50`}
                    >
                      {c.icon && (
                        <img
                          src={fixAvatarUrl(c.icon)}
                          alt=""
                          className="w-4 h-4 object-contain flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <span className="text-xs whitespace-nowrap">{c.name}</span>
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path
                            d="M1.5 5L4 7.5L8.5 2.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setPicking(false);
              setSearch("");
            }}
            className="w-full px-3 py-2 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/25 rounded-md transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </section>
  );
}

function ProfileSection() {
  const { profile, updateProfile, refetchProfile } = useProfile();

  const handleSave = useCallback(async (field: string, value: string) => {
    await new Promise<void>((resolve, reject) => {
      updateProfile(
        { data: { [field]: value } },
        {
          onSuccess: () => { refetchProfile(); resolve(); },
          onError: (err: unknown) => reject(err),
        }
      );
    });
  }, [updateProfile, refetchProfile]);

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "non-binary", label: "Non-binary" },
    { value: "other", label: "Other" },
  ];
  const bodyTypeOptions = [
    { value: "bro", label: "Bro" },
    { value: "bae", label: "Bae" },
  ];

  const genderLabel = genderOptions.find((o) => o.value === profile?.gender)?.label || "";
  const bodyLabel = bodyTypeOptions.find((o) => o.value === profile?.body_type)?.label || "";

  return (
    <section>
      <SectionHeader title="Profile" />
      <EditableRow label="Nickname" value={profile?.custom_nickname || ""} field="custom_nickname" onSave={handleSave} />
      <EditableRow label="First name" value={profile?.first_name || ""} field="first_name" onSave={handleSave} />
      <EditableRow label="Middle name" value={profile?.middle_name || ""} field="middle_name" onSave={handleSave} />
      <EditableRow label="Last name" value={profile?.last_name || ""} field="last_name" onSave={handleSave} />
      <EditableRow label="Bio" value={profile?.bio || ""} field="bio" type="textarea" onSave={handleSave} />
      <EditableRow label="Date of birth" value={profile?.date_of_birth || ""} field="date_of_birth" type="date" onSave={handleSave} />
      <EditableRow label="Gender" value={profile?.gender || ""} field="gender" type="select" options={genderOptions} displayValue={genderLabel} onSave={handleSave} />
      <EditableRow label="Body type" value={profile?.body_type || ""} field="body_type" type="select" options={bodyTypeOptions} displayValue={bodyLabel} onSave={handleSave} />
    </section>
  );
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[640px] h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:rounded-[24px] rounded-none flex flex-col overflow-hidden backdrop-blur-[48px] border border-white/10"
        style={{
          background: "linear-gradient(135deg, rgba(41,41,41,0.95), rgba(0,0,0,0.95))",
          boxShadow: "inset 0px -1px 24px rgba(255,255,255,0.4)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <h2 id="settings-modal-title" className="text-lg font-bold text-white">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="pointer-events-none"
            >
              <path d="M12 4L4 12M4 4l8 8" />
            </svg>
          </button>
        </div>
        <ProfileStrip />
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ProfileSection />
          <LocationSection />
          <CulturesSection />
          <WalletsSection />
          <EmailsSection />
          <PhonesSection />
          <SocialsSection />
          <FounderNftsSection />
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
