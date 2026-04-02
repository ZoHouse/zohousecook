import React, { ReactElement, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth, useProfile, useMutationApi, useQueryApi } from "@zo/auth";
import { ZoSpinner } from "../components/ui/ZoSpinner";
import { GlassCard, ComingSoon, DashboardHeader } from "../components/dashboard";
import { useMyNfts } from "../hooks/useMyNfts";
import useInstagramConnect from "../hooks/useInstagramConnect";
import type { NextPageWithLayout } from "./_app";

function fixAvatarUrl(url?: string): string | undefined {
  if (!url || url.length === 0) return undefined;
  if (url.startsWith("ipfs://")) return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  return url.replace("static.cdn.zo.xyz", "proxy.cdn.zo.xyz");
}

function formatAddress(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// --- Shared styles ---
const rowCls = "flex items-center justify-between p-3 rounded-dash-md bg-white/5 border border-dash-border";
const badgePrimary = "px-2 py-0.5 text-[10px] uppercase bg-dash-accent/20 text-dash-accent rounded-dash-pill";
const badgeVerified = "px-2 py-0.5 text-[10px] uppercase bg-green-500/20 text-green-400 rounded-dash-pill";
const iconCircle = "w-8 h-8 rounded-full bg-dash-border flex items-center justify-center text-dash-text-50 text-xs flex-shrink-0";
const menuBtn = "w-full text-left px-3 py-2 text-sm text-dash-text-80 hover:text-dash-text hover:bg-white/5 rounded-dash-sm transition-colors";
const dangerBtn = "w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-dash-sm transition-colors";
const addBtn = "mt-3 flex items-center gap-2 px-3 py-2 text-sm text-dash-text-50 hover:text-dash-text border border-dashed border-dash-border hover:border-dash-border-hover rounded-dash-md transition-colors w-full justify-center";

// --- Editable Field Component ---

function EditableField({
  label, value, field, onSave, type = "text", disabled = false,
}: {
  label: string; value: string; field: string;
  onSave: (field: string, value: string) => Promise<void>;
  type?: string; disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(field, draft); setEditing(false); } catch { /* stay */ } finally { setSaving(false); }
  };

  const handleCancel = () => { setDraft(value); setEditing(false); };

  return (
    <div className="flex items-center justify-between py-3 border-b border-dash-border/50 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-dash-text-40 uppercase tracking-wider mb-0.5">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <input type={type} value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
              autoFocus className="flex-1 bg-white/5 border border-dash-border rounded-dash-sm px-2 py-1 text-sm text-dash-text focus:outline-none focus:border-dash-accent" />
            <button onClick={handleSave} disabled={saving} className="px-2 py-1 text-[10px] bg-dash-accent text-black rounded-dash-sm font-medium">{saving ? "..." : "Save"}</button>
            <button onClick={handleCancel} className="px-2 py-1 text-[10px] text-dash-text-50 hover:text-dash-text">Cancel</button>
          </div>
        ) : (
          <p className="text-sm text-dash-text truncate">{value || <span className="text-dash-text-40 italic">Not set</span>}</p>
        )}
      </div>
      {!editing && !disabled && (
        <button onClick={() => { setDraft(value); setEditing(true); }}
          className="ml-3 px-2 py-1 text-[10px] text-dash-text-50 hover:text-dash-text border border-dash-border hover:border-dash-border-hover rounded-dash-sm transition-colors">Edit</button>
      )}
    </div>
  );
}

function EditableSelect({
  label, value, field, options, onSave, disabled = false,
}: {
  label: string; value: string; field: string;
  options: { value: string; label: string }[];
  onSave: (field: string, value: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(field, draft); setEditing(false); } catch { /* stay */ } finally { setSaving(false); }
  };

  const displayValue = options.find((o) => o.value === value)?.label || value;

  return (
    <div className="flex items-center justify-between py-3 border-b border-dash-border/50 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-dash-text-40 uppercase tracking-wider mb-0.5">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2">
            <select value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus
              className="flex-1 bg-white/5 border border-dash-border rounded-dash-sm px-2 py-1 text-sm text-dash-text focus:outline-none focus:border-dash-accent">
              <option value="">Not set</option>
              {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={handleSave} disabled={saving} className="px-2 py-1 text-[10px] bg-dash-accent text-black rounded-dash-sm font-medium">{saving ? "..." : "Save"}</button>
            <button onClick={() => setEditing(false)} className="px-2 py-1 text-[10px] text-dash-text-50 hover:text-dash-text">Cancel</button>
          </div>
        ) : (
          <p className="text-sm text-dash-text truncate">{displayValue || <span className="text-dash-text-40 italic">Not set</span>}</p>
        )}
      </div>
      {!editing && !disabled && (
        <button onClick={() => { setDraft(value); setEditing(true); }}
          className="ml-3 px-2 py-1 text-[10px] text-dash-text-50 hover:text-dash-text border border-dash-border hover:border-dash-border-hover rounded-dash-sm transition-colors">Edit</button>
      )}
    </div>
  );
}

// --- Dropdown menu for items ---

function ItemMenu({ onSetPrimary, onRemove, isPrimary }: {
  onSetPrimary: () => void; onRemove: () => void; isPrimary: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="w-7 h-7 flex items-center justify-center text-dash-text-50 hover:text-dash-text rounded-dash-sm hover:bg-white/10 transition-colors">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 bg-dash-bg-solid border border-dash-border rounded-dash-md p-1 min-w-[140px] shadow-dash-card">
            {!isPrimary && (
              <button className={menuBtn} onClick={() => { onSetPrimary(); setOpen(false); }}>
                Set Primary
              </button>
            )}
            {!isPrimary && (
              <button className={dangerBtn} onClick={() => { onRemove(); setOpen(false); }}>
                Remove
              </button>
            )}
            {isPrimary && (
              <p className="px-3 py-2 text-xs text-dash-text-40">Primary cannot be removed</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --- Section Components ---

function ProfileHeader() {
  const { profile } = useProfile();
  const [imgError, setImgError] = useState(false);

  const rawAvatar = profile?.avatar?.image || profile?.pfp_image;
  const avatar = fixAvatarUrl(rawAvatar && rawAvatar.length > 0 ? rawAvatar : undefined);
  const name = profile?.nickname || profile?.custom_nickname || "Citizen";
  const pid = profile?.pid;
  const membership = profile?.membership;
  const isFounder = membership?.toLowerCase() === "founder" || profile?.role === "Founder" || (profile?.founder_nfts_count ?? 0) > 0;

  return (
    <GlassCard className="p-dash-xl">
      <div className="flex items-center gap-dash-xl">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dash-border flex-shrink-0">
          {avatar && !imgError ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setImgError(true)} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-dash-accent/30 to-dash-accent/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-dash-text">{name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-dash-text truncate">{name}</h2>
            {isFounder && (
              <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-dash-accent/20 text-dash-accent border border-dash-accent/30 rounded-dash-pill flex-shrink-0">Founder</span>
            )}
          </div>
          {pid && <p className="text-xs text-dash-text-40">PID: {pid}</p>}
          <p className="text-xs text-dash-text-50 capitalize mt-1">{membership || "Citizen"} of Zo World</p>
        </div>
      </div>
    </GlassCard>
  );
}

function PersonalDetails() {
  const { profile, updateProfile, refetchProfile } = useProfile();

  const handleSave = useCallback(async (field: string, value: string) => {
    await new Promise<void>((resolve, reject) => {
      updateProfile({ data: { [field]: value } }, {
        onSuccess: () => { refetchProfile(); resolve(); },
        onError: (err: unknown) => reject(err),
      });
    });
  }, [updateProfile, refetchProfile]);

  const genderOptions = [
    { value: "male", label: "Male" }, { value: "female", label: "Female" },
    { value: "non-binary", label: "Non-binary" }, { value: "other", label: "Other" },
  ];
  const bodyTypeOptions = [
    { value: "bro", label: "Bro" }, { value: "sis", label: "Sis" }, { value: "they", label: "They" },
  ];

  return (
    <GlassCard className="p-dash-xl">
      <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">Personal Details</h3>
      <EditableField label="Nickname" value={profile?.custom_nickname || ""} field="custom_nickname" onSave={handleSave} />
      <EditableField label="First Name" value={profile?.first_name || ""} field="first_name" onSave={handleSave} />
      <EditableField label="Middle Name" value={profile?.middle_name || ""} field="middle_name" onSave={handleSave} />
      <EditableField label="Last Name" value={profile?.last_name || ""} field="last_name" onSave={handleSave} />
      <EditableField label="Bio" value={profile?.bio || ""} field="bio" onSave={handleSave} />
      <EditableField label="Date of Birth" value={profile?.date_of_birth || ""} field="date_of_birth" onSave={handleSave} type="date" />
      <EditableSelect label="Gender" value={profile?.gender || ""} field="gender" options={genderOptions} onSave={handleSave} />
      <EditableSelect label="Body Type" value={profile?.body_type || ""} field="body_type" options={bodyTypeOptions} onSave={handleSave} />
    </GlassCard>
  );
}

function LocationDetails() {
  const { profile, updateProfile, refetchProfile } = useProfile();

  const handleSave = useCallback(async (field: string, value: string) => {
    await new Promise<void>((resolve, reject) => {
      updateProfile({ data: { [field]: value } }, {
        onSuccess: () => { refetchProfile(); resolve(); },
        onError: (err: unknown) => reject(err),
      });
    });
  }, [updateProfile, refetchProfile]);

  return (
    <GlassCard className="p-dash-xl">
      <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">Location</h3>
      <EditableField label="City" value={profile?.place_name || ""} field="place_name" onSave={handleSave} />
      <EditableField label="Country" value={profile?.country?.name || ""} field="country" onSave={handleSave} disabled />
      <EditableField label="Address" value={profile?.address || ""} field="address" onSave={handleSave} />
      <EditableField label="Pincode" value={profile?.pincode || ""} field="pincode" onSave={handleSave} />
    </GlassCard>
  );
}

// --- Connected Wallets (full CRUD) ---

function ConnectedWalletsSection() {
  const { isLoggedIn } = useAuth();
  const { refetchProfile } = useProfile();
  const { data: userWallets, isLoading, refetch } = useQueryApi(
    "AUTH_USER_WEB3_WALLETS", { enabled: isLoggedIn === true }, "", ""
  );
  const { mutate: updateWallet } = useMutationApi("AUTH_USER_WEB3_WALLETS", {}, "", "PUT");
  const { mutate: deleteWallet } = useMutationApi("AUTH_USER_WEB3_WALLETS", {}, "", "DELETE");

  const [adding, setAdding] = useState(false);
  const [newAddr, setNewAddr] = useState("");
  const [addError, setAddError] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wallets: any[] = (userWallets as any)?.data?.web3_wallets || [];

  const handleSetPrimary = (addr: string) => {
    updateWallet(
      { data: { wallet_address: addr, primary: true } },
      { onSuccess: () => { refetch(); refetchProfile(); } }
    );
  };

  const handleRemove = (addr: string) => {
    if (!confirm(`Remove wallet ${formatAddress(addr)}?`)) return;
    deleteWallet(
      { data: { wallet_address: addr } },
      { onSuccess: () => { refetch(); refetchProfile(); } }
    );
  };

  return (
    <GlassCard className="p-dash-xl">
      <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">Connected Wallets</h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <ZoSpinner size={24} />
        </div>
      ) : wallets.length === 0 ? (
        <p className="text-sm text-dash-text-40">No wallets connected</p>
      ) : (
        <div className="flex flex-col gap-2">
          {wallets.map((w) => (
            <div key={w.wallet_address} className={rowCls}>
              <div className="flex items-center gap-3">
                <div className={iconCircle}>W</div>
                <div>
                  <p className="text-sm text-dash-text font-mono">{formatAddress(w.wallet_address)}</p>
                  <p className="text-[10px] text-dash-text-40 font-mono hidden sm:block">{w.wallet_address}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {w.primary && <span className={badgePrimary}>Primary</span>}
                {w.verified && <span className={badgeVerified}>Verified</span>}
                <ItemMenu
                  isPrimary={!!w.primary}
                  onSetPrimary={() => handleSetPrimary(w.wallet_address)}
                  onRemove={() => handleRemove(w.wallet_address)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {adding ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input type="text" value={newAddr} onChange={(e) => { setNewAddr(e.target.value); setAddError(""); }}
              placeholder="0x..." autoFocus
              className="flex-1 bg-white/5 border border-dash-border rounded-dash-sm px-3 py-2 text-sm text-dash-text font-mono focus:outline-none focus:border-dash-accent placeholder:text-dash-text-40" />
            <button onClick={() => { setAdding(false); setNewAddr(""); setAddError(""); }}
              className="px-3 py-2 text-sm text-dash-text-50 hover:text-dash-text">Cancel</button>
          </div>
          {addError && <p className="text-xs text-red-400">{addError}</p>}
          <p className="text-[10px] text-dash-text-40">
            To add a wallet, connect it via your web3 wallet provider. Paste address is for display only.
          </p>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className={addBtn}>
          <span className="text-dash-text-50">+</span> Add Wallet
        </button>
      )}
    </GlassCard>
  );
}

// --- Connected Emails (full CRUD) ---

function ConnectedEmailsSection() {
  const { isLoggedIn } = useAuth();
  const { refetchProfile } = useProfile();
  const { data: userEmails, isLoading, refetch } = useQueryApi(
    "AUTH_USER_EMAILS", { enabled: isLoggedIn === true }, "", ""
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

  const handleSetPrimary = (addr: string) => {
    updateEmail(
      { data: { email_address: addr, primary: true } },
      { onSuccess: () => { refetch(); refetchProfile(); } }
    );
  };

  const handleRemove = (addr: string) => {
    if (!confirm(`Remove email ${addr}?`)) return;
    deleteEmail(
      { data: { email_address: addr } },
      { onSuccess: () => { refetch(); refetchProfile(); } }
    );
  };

  const handleAdd = () => {
    if (!newEmail || !newEmail.includes("@")) { setAddError("Enter a valid email"); return; }
    setAddLoading(true);
    createEmail(
      { data: { email_address: newEmail } },
      {
        onSuccess: () => { refetch(); setAdding(false); setNewEmail(""); setAddLoading(false); },
        onError: () => { setAddError("Failed to add email"); setAddLoading(false); },
      }
    );
  };

  return (
    <GlassCard className="p-dash-xl">
      <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">Connected Emails</h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <ZoSpinner size={24} />
        </div>
      ) : emails.length === 0 ? (
        <p className="text-sm text-dash-text-40">No emails connected</p>
      ) : (
        <div className="flex flex-col gap-2">
          {emails.map((e) => (
            <div key={e.email_address} className={rowCls}>
              <div className="flex items-center gap-3">
                <div className={iconCircle}>@</div>
                <p className="text-sm text-dash-text">{e.email_address}</p>
              </div>
              <div className="flex items-center gap-2">
                {e.primary && <span className={badgePrimary}>Primary</span>}
                {e.verified && <span className={badgeVerified}>Verified</span>}
                <ItemMenu
                  isPrimary={!!e.primary}
                  onSetPrimary={() => handleSetPrimary(e.email_address)}
                  onRemove={() => handleRemove(e.email_address)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {adding ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input type="email" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setAddError(""); }}
              placeholder="email@example.com" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setNewEmail(""); } }}
              className="flex-1 bg-white/5 border border-dash-border rounded-dash-sm px-3 py-2 text-sm text-dash-text focus:outline-none focus:border-dash-accent placeholder:text-dash-text-40" />
            <button onClick={handleAdd} disabled={addLoading}
              className="px-3 py-2 text-[10px] bg-dash-accent text-black rounded-dash-sm font-medium">{addLoading ? "..." : "Add"}</button>
            <button onClick={() => { setAdding(false); setNewEmail(""); setAddError(""); }}
              className="px-3 py-2 text-sm text-dash-text-50 hover:text-dash-text">Cancel</button>
          </div>
          {addError && <p className="text-xs text-red-400">{addError}</p>}
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className={addBtn}>
          <span className="text-dash-text-50">+</span> Add Email
        </button>
      )}
    </GlassCard>
  );
}

// --- Connected Phone Numbers (full CRUD) ---

function ConnectedPhonesSection() {
  const { isLoggedIn } = useAuth();
  const { refetchProfile } = useProfile();
  const { data: userMobiles, isLoading, refetch } = useQueryApi(
    "AUTH_USER_MOBILES", { enabled: isLoggedIn === true }, "", ""
  );
  const { mutate: updateMobile } = useMutationApi("AUTH_USER_MOBILES", {}, "", "PUT");
  const { mutate: deleteMobile } = useMutationApi("AUTH_USER_MOBILES", {}, "", "DELETE");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mobiles: any[] = (userMobiles as any)?.data?.mobiles || [];

  const handleSetPrimary = (number: string, code: string) => {
    updateMobile(
      { data: { mobile_number: number, mobile_country_code: code, primary: true } },
      { onSuccess: () => { refetch(); refetchProfile(); } }
    );
  };

  const handleRemove = (number: string, code: string) => {
    if (!confirm(`Remove phone +${code} ${number}?`)) return;
    deleteMobile(
      { data: { mobile_number: number, mobile_country_code: code } },
      { onSuccess: () => { refetch(); refetchProfile(); } }
    );
  };

  return (
    <GlassCard className="p-dash-xl">
      <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">Connected Phone Numbers</h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <ZoSpinner size={24} />
        </div>
      ) : mobiles.length === 0 ? (
        <p className="text-sm text-dash-text-40">No phone numbers connected</p>
      ) : (
        <div className="flex flex-col gap-2">
          {mobiles.map((m) => (
            <div key={m.mobile_number} className={rowCls}>
              <div className="flex items-center gap-3">
                <div className={iconCircle}>#</div>
                <p className="text-sm text-dash-text">+{m.mobile_country_code} {m.mobile_number}</p>
              </div>
              <div className="flex items-center gap-2">
                {m.primary && <span className={badgePrimary}>Primary</span>}
                {m.verified && <span className={badgeVerified}>Verified</span>}
                <ItemMenu
                  isPrimary={!!m.primary}
                  onSetPrimary={() => handleSetPrimary(m.mobile_number, m.mobile_country_code)}
                  onRemove={() => handleRemove(m.mobile_number, m.mobile_country_code)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// --- NFTs ---

function FounderNftsSection() {
  const { nfts, isLoading } = useMyNfts();
  if (isLoading) return (
    <GlassCard className="p-dash-xl">
      <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">Founder NFTs</h3>
      <div className="flex items-center justify-center py-8">
        <ZoSpinner size={32} />
      </div>
    </GlassCard>
  );
  if (nfts.length === 0) return null;

  return (
    <GlassCard className="p-dash-xl">
      <div className="flex items-center justify-between mb-dash-lg">
        <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider">Founder NFTs</h3>
        <span className="text-xs text-dash-text-40">{nfts.length} NFTs</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {nfts.map((nft) => (
          <div key={nft.token_ref_id} className="relative rounded-dash-md overflow-hidden border border-dash-border">
            <img src={nft.image_url} alt={nft.name} className="w-full aspect-square object-cover block" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
              <p className="text-[10px] text-dash-text-80 truncate">{nft.name}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// --- Socials ---

function SocialsSection() {
  const { profile } = useProfile();
  const { isConnected: igConnected, account: igAccount, connect: connectIg, disconnect: disconnectIg } = useInstagramConnect();

  const socials = useMemo(() => {
    if (!profile?.socials) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (profile.socials as any[])
      .filter((s) => s.category !== "instagram") // IG handled separately via Supabase
      .map((s) => ({
        category: s.category as string, link: s.link as string, verified: s.verified as boolean,
        handle: s.category === "twitter" ? s.link?.split(".com/")[1]
          : s.category === "telegram" ? s.link?.split(".me/")[1]
          : s.category === "discord" ? "Connected" : s.link,
      }));
  }, [profile?.socials]);

  const ens = profile?.ens_nickname;
  const iconMap: Record<string, string> = { twitter: "X", telegram: "TG", discord: "DC" };

  return (
    <GlassCard className="p-dash-xl">
      <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">Connected Socials</h3>
      <div className="flex flex-col gap-2">
        {ens && (
          <div className={rowCls}>
            <div className="flex items-center gap-3">
              <div className={iconCircle + " text-[10px] font-bold"}>ENS</div>
              <p className="text-sm text-dash-text">{ens}</p>
            </div>
          </div>
        )}
        {socials.map((s) => (
          <div key={s.category} className={rowCls}>
            <div className="flex items-center gap-3">
              <div className={iconCircle + " text-[10px] font-bold"}>
                {iconMap[s.category] || s.category.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] text-dash-text-40 capitalize">{s.category}</p>
                <p className="text-sm text-dash-text">{s.handle || s.link}</p>
              </div>
            </div>
            {s.verified && <span className={badgeVerified}>Verified</span>}
          </div>
        ))}

        {/* Instagram — from Supabase via useInstagramConnect */}
        {igConnected && igAccount ? (
          <div className={rowCls}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
                }}
              >
                IG
              </div>
              <div>
                <p className="text-[10px] text-dash-text-40">Instagram</p>
                <p className="text-sm text-dash-text">@{igAccount.ig_username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={badgeVerified}>Verified</span>
              <button
                onClick={disconnectIg}
                className="px-2 py-1 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-dash-sm transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className={rowCls}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
                }}
              >
                IG
              </div>
              <div>
                <p className="text-[10px] text-dash-text-40">Instagram</p>
                <p className="text-sm text-dash-text-50">Not connected</p>
              </div>
            </div>
            <button
              onClick={connectIg}
              className="px-3 py-1 text-[10px] font-semibold text-white rounded-dash-sm transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)",
              }}
            >
              Connect
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// --- Cultures ---

function CulturesSection() {
  const { profile, updateProfile, refetchProfile } = useProfile();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cultures: any[] = profile?.cultures || [];
  if (cultures.length === 0) return null;

  const handleRemove = (key: string) => {
    const remaining = cultures.filter((c) => c.key !== key).map((c) => c.key);
    updateProfile(
      { data: { cultures: remaining } },
      { onSuccess: () => refetchProfile() }
    );
  };

  return (
    <GlassCard className="p-dash-xl">
      <h3 className="text-sm font-medium text-dash-text-50 uppercase tracking-wider mb-dash-lg">Cultures</h3>
      <div className="flex flex-wrap gap-2">
        {cultures.map((c) => (
          <div key={c.key} className="group flex items-center gap-2 px-3 py-1.5 rounded-dash-pill bg-white/5 border border-dash-border hover:border-dash-border-hover transition-colors">
            {c.icon && <img src={c.icon} alt={c.name} className="w-4 h-4" />}
            <span className="text-xs text-dash-text-80">{c.name}</span>
            <button
              onClick={() => handleRemove(c.key)}
              className="w-4 h-4 flex items-center justify-center rounded-full text-dash-text-40 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                <path d="M6.5 1.5L1.5 6.5M1.5 1.5L6.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// --- Page ---

const PassportPage: NextPageWithLayout = () => {
  const router = useRouter();

  return (
    <div className="flex-1 min-h-screen bg-dash-bg-solid"
      style={{ backgroundImage: `url(${router.basePath}/dashboard-assets/dashboard-bg.png)`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
      <DashboardHeader />
      <div className="max-w-6xl mx-auto px-dash-xl py-dash-xl pb-32">
        <button onClick={() => router.push("/")}
          className="mb-dash-lg text-sm text-dash-text-50 hover:text-dash-text transition-colors">
          &larr; Back to Dashboard
        </button>
        <div className="max-w-4xl mx-auto flex flex-col gap-dash-xl">
          <ProfileHeader />
          <ConnectedWalletsSection />
          <ConnectedEmailsSection />
          <ConnectedPhonesSection />
          <SocialsSection />
          <FounderNftsSection />
          <PersonalDetails />
          <LocationDetails />
          <ComingSoon />
        </div>
      </div>
    </div>
  );
};

PassportPage.getLayout = (page: ReactElement) => page;

export default PassportPage;
