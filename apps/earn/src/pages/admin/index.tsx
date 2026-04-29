import { useEffect, useState } from "react";
import { useAuth } from "@zo/auth";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { IconCoin, IconBriefcase, IconGift, IconLock } from "@tabler/icons-react";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const ADMIN_KEY_STORAGE = "zo-earn-admin-key";

const navItems = [
  { name: "Bounties", link: "/" },
  { name: "Projects", link: "/projects" },
  { name: "Grants", link: "/grants" },
];

type Tab = "bounty" | "project" | "grant";

export default function AdminPage() {
  const { isLoggedIn, user, showLoginModal, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminKey, setAdminKey] = useState<string>("");
  const [adminKeyInput, setAdminKeyInput] = useState<string>("");
  const [tab, setTab] = useState<Tab>("bounty");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(ADMIN_KEY_STORAGE);
      if (saved) setAdminKey(saved);
    }
  }, []);

  const persistKey = (key: string) => {
    setAdminKey(key);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
    }
  };

  const clearKey = () => {
    setAdminKey("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    }
  };

  if (isLoggedIn === null) {
    return (
      <Shell isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}>
        <div className="flex items-center justify-center py-32 text-zui-white/40">
          Loading…
        </div>
      </Shell>
    );
  }

  if (!isLoggedIn) {
    return (
      <Shell isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}>
        <div className="mx-auto max-w-md px-4 pt-32 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zui-stroke bg-zui-lighter">
              <IconLock size={28} className="text-zui-yellow" />
            </div>
          </div>
          <h1 className="mb-3 font-headline text-5xl tracking-tight text-zui-white">
            Admin
          </h1>
          <p className="mb-8 text-sm text-zui-white/60">
            Sign in with your Zo phone number to manage bounties, projects, and grants.
          </p>
          <button
            type="button"
            onClick={() => showLoginModal(["mobile"])}
            className="rounded-full border border-zui-green/60 bg-zui-green px-6 py-2 text-sm font-semibold uppercase tracking-wider text-zui-dark transition-transform hover:scale-105"
          >
            Sign in with Zo
          </button>
        </div>
      </Shell>
    );
  }

  if (!adminKey) {
    return (
      <Shell isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}>
        <div className="mx-auto max-w-md px-4 pt-32">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zui-stroke bg-zui-lighter">
              <IconLock size={28} className="text-zui-yellow" />
            </div>
          </div>
          <h1 className="mb-2 text-center font-headline text-5xl tracking-tight text-zui-white">
            Enter admin key
          </h1>
          <p className="mb-8 text-center text-sm text-zui-white/60">
            Signed in as <span className="text-zui-white">{user?.mobile_number ?? "—"}</span>.
            Enter the shared <code className="text-zui-yellow">ADMIN_KEY</code> to unlock writes.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (adminKeyInput.trim()) persistKey(adminKeyInput.trim());
            }}
            className="space-y-3"
          >
            <input
              type="password"
              autoFocus
              value={adminKeyInput}
              onChange={(e) => setAdminKeyInput(e.target.value)}
              placeholder="admin key"
              className="w-full rounded-lg border border-zui-stroke bg-zui-lighter px-4 py-3 text-sm text-zui-white placeholder:text-zui-white/30 focus:border-zui-green focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-full border border-zui-green/60 bg-zui-green px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-zui-dark transition-transform hover:scale-[1.02]"
            >
              Unlock
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="block w-full text-center text-xs text-zui-white/40 hover:text-zui-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  return (
    <Shell isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}>
      <section className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.2em] text-zui-white/50">
              Admin
            </p>
            <h1 className="font-headline text-5xl leading-tight tracking-tight text-zui-white md:text-6xl">
              Earn Console
            </h1>
            <p className="mt-2 text-xs text-zui-white/50">
              Signed in as <span className="text-zui-white">{user?.mobile_number ?? "—"}</span>
              {" · "}
              <button onClick={clearKey} className="underline hover:text-zui-white">
                clear key
              </button>
              {" · "}
              <button onClick={() => logout()} className="underline hover:text-zui-white">
                sign out
              </button>
            </p>
          </div>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          <TabButton active={tab === "bounty"} onClick={() => setTab("bounty")} icon={<IconCoin size={14} />}>
            Bounty
          </TabButton>
          <TabButton active={tab === "project"} onClick={() => setTab("project")} icon={<IconBriefcase size={14} />}>
            Project
          </TabButton>
          <TabButton active={tab === "grant"} onClick={() => setTab("grant")} icon={<IconGift size={14} />}>
            Grant
          </TabButton>
        </div>

        <div className="rounded-2xl border border-zui-stroke bg-zui-lighter p-6 md:p-8">
          {tab === "bounty" && <BountyForm adminKey={adminKey} onUnauthorized={clearKey} />}
          {tab === "project" && <ProjectForm adminKey={adminKey} onUnauthorized={clearKey} />}
          {tab === "grant" && <GrantForm adminKey={adminKey} onUnauthorized={clearKey} />}
        </div>
      </section>
    </Shell>
  );
}

function Shell({
  children,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: {
  children: React.ReactNode;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (v: boolean) => void;
}) {
  return (
    <div className="min-h-screen bg-zui-dark font-sans text-zui-white">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <NavbarButton href="/admin" variant="primary">
            Admin
          </NavbarButton>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium tracking-wide text-zui-white"
              >
                {item.name}
              </a>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      {children}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors ${
        active
          ? "border-zui-green bg-zui-green text-zui-dark"
          : "border-zui-stroke bg-zui-light/40 text-zui-white/70 hover:border-zui-white/30 hover:text-zui-white"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

type FormProps = { adminKey: string; onUnauthorized: () => void };

function useCreate<T>(endpoint: string, adminKey: string, onUnauthorized: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(payload: T) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${basePath}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        onUnauthorized();
        setError("Admin key rejected. Re-enter.");
        return false;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `Request failed (${res.status})`);
        return false;
      }
      setSuccess("Created.");
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { submit, busy, error, success };
}

function BountyForm({ adminKey, onUnauthorized }: FormProps) {
  const { submit, busy, error, success } = useCreate<Record<string, unknown>>(
    "/api/bounties",
    adminKey,
    onUnauthorized,
  );
  const [title, setTitle] = useState("");
  const [reward, setReward] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [deadline, setDeadline] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [color, setColor] = useState("#66DF48");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await submit({
          title,
          reward,
          description,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          deadline,
          url,
          imageUrl,
          color,
        });
        if (ok) {
          setTitle(""); setReward(""); setDescription("");
          setTags(""); setDeadline(""); setUrl(""); setImageUrl("");
        }
      }}
      className="space-y-4"
    >
      <Field label="Title" required>
        <Input value={title} onChange={setTitle} placeholder="Build a Discord bot for DAO Ops" required />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Reward" required>
          <Input value={reward} onChange={setReward} placeholder="USDC 1,200" required />
        </Field>
        <Field label="Deadline">
          <Input value={deadline} onChange={setDeadline} placeholder="in 12d" />
        </Field>
      </div>
      <Field label="Description">
        <Textarea value={description} onChange={setDescription} placeholder="What needs to ship, how it'll be reviewed, who it's for." />
      </Field>
      <Field label="Tags (comma-separated)">
        <Input value={tags} onChange={setTags} placeholder="Engineering, DAO" />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="External URL">
          <Input value={url} onChange={setUrl} placeholder="https://..." />
        </Field>
        <Field label="Image URL">
          <Input value={imageUrl} onChange={setImageUrl} placeholder="https://..." />
        </Field>
      </div>
      <Field label="Color">
        <div className="flex items-center gap-3">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-zui-stroke bg-zui-light" />
          <Input value={color} onChange={setColor} />
        </div>
      </Field>
      <FormFooter busy={busy} error={error} success={success} cta="Create bounty" />
    </form>
  );
}

function ProjectForm({ adminKey, onUnauthorized }: FormProps) {
  const { submit, busy, error, success } = useCreate<Record<string, unknown>>(
    "/api/projects",
    adminKey,
    onUnauthorized,
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [members, setMembers] = useState<number>(1);
  const [color, setColor] = useState("#66DF48");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await submit({ name, description, url, members, color });
        if (ok) { setName(""); setDescription(""); setUrl(""); setMembers(1); }
      }}
      className="space-y-4"
    >
      <Field label="Name" required>
        <Input value={name} onChange={setName} placeholder="Zo Quest Engine" required />
      </Field>
      <Field label="Description">
        <Textarea value={description} onChange={setDescription} placeholder="What this project does and who it's for." />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="URL">
          <Input value={url} onChange={setUrl} placeholder="https://..." />
        </Field>
        <Field label="Members">
          <input
            type="number"
            min={0}
            value={members}
            onChange={(e) => setMembers(Number(e.target.value))}
            className="w-full rounded-lg border border-zui-stroke bg-zui-light px-3 py-2 text-sm text-zui-white focus:border-zui-green focus:outline-none"
          />
        </Field>
      </div>
      <Field label="Color">
        <div className="flex items-center gap-3">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-zui-stroke bg-zui-light" />
          <Input value={color} onChange={setColor} />
        </div>
      </Field>
      <FormFooter busy={busy} error={error} success={success} cta="Create project" />
    </form>
  );
}

function GrantForm({ adminKey, onUnauthorized }: FormProps) {
  const { submit, busy, error, success } = useCreate<Record<string, unknown>>(
    "/api/grants",
    adminKey,
    onUnauthorized,
  );
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#66DF48");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await submit({ title, amount, description, color });
        if (ok) { setTitle(""); setAmount(""); setDescription(""); }
      }}
      className="space-y-4"
    >
      <Field label="Title" required>
        <Input value={title} onChange={setTitle} placeholder="Builder Grant" required />
      </Field>
      <Field label="Amount" required>
        <Input value={amount} onChange={setAmount} placeholder="Up to $5,000" required />
      </Field>
      <Field label="Description">
        <Textarea value={description} onChange={setDescription} placeholder="Who this is for and how to apply." />
      </Field>
      <Field label="Color">
        <div className="flex items-center gap-3">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 cursor-pointer rounded-lg border border-zui-stroke bg-zui-light" />
          <Input value={color} onChange={setColor} />
        </div>
      </Field>
      <FormFooter busy={busy} error={error} success={success} cta="Create grant" />
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zui-white/60">
        {label}
        {required && <span className="ml-1 text-zui-green">*</span>}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-lg border border-zui-stroke bg-zui-light px-3 py-2 text-sm text-zui-white placeholder:text-zui-white/30 focus:border-zui-green focus:outline-none"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full rounded-lg border border-zui-stroke bg-zui-light px-3 py-2 text-sm text-zui-white placeholder:text-zui-white/30 focus:border-zui-green focus:outline-none"
    />
  );
}

function FormFooter({
  busy,
  error,
  success,
  cta,
}: {
  busy: boolean;
  error: string | null;
  success: string | null;
  cta: string;
}) {
  return (
    <div className="flex items-center justify-between border-t border-dashed border-zui-stroke pt-4">
      <div className="text-xs">
        {error && <span className="text-zui-pink">{error}</span>}
        {success && <span className="text-zui-green">{success}</span>}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-full border border-zui-green/60 bg-zui-green px-5 py-2 text-xs font-semibold uppercase tracking-wider text-zui-dark transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Saving…" : cta}
      </button>
    </div>
  );
}
