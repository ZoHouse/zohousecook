import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconBriefcase,
  IconSparkles,
  IconUsers,
  IconExternalLink,
  IconWorld,
} from "@tabler/icons-react";
import { AuthCorner } from "@/components/AuthCorner";
import { LOGO_URL } from "@/lib/assets";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const navItems = [
  { name: "Quests", link: "/" },
  { name: "Leaderboard", link: "/leaderboard" },
  { name: "Projects", link: "/projects" },
  { name: "Grants", link: "/grants" },
];

type Project = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  members: number;
  status: string;
  url: string | null;
  builder?: string | null;
  builderUrl?: string | null;
};

export default function ProjectsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${basePath}/api/projects`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProjects(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-zui-dark font-sans text-zui-white">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <AuthCorner />
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
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium tracking-wide text-zui-white"
              >
                {item.name}
              </Link>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-32">
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-zui-green/40 bg-zui-green/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zui-green">
            <IconSparkles size={11} />
            Featured
          </div>
          <h1 className="font-headline text-6xl leading-[1.05] tracking-tight text-zui-white md:text-7xl">
            Projects
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zui-white/60">
            What Zo builders are shipping. Click any preview to visit the live project.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-zui-stroke bg-zui-lighter px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              alt="Zo"
              width={28}
              height={28}
              className="invert"
            />
            <span className="font-headline text-2xl tracking-tight text-zui-white">
              Marketplace
            </span>
          </div>
          <p className="text-sm text-zui-white/50">
            Zo World. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const hasUrl = Boolean(project.url);
  const accent = project.color || "#66DF48";
  const host = project.url ? safeHost(project.url) : null;

  const card = (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-zui-stroke bg-zui-lighter transition-all ${
        hasUrl ? "hover:-translate-y-1 hover:border-zui-white/20" : ""
      }`}
    >
      <div
        className="h-1 w-full"
        style={{ backgroundColor: accent }}
      />

      <PreviewFrame url={project.url} accent={accent} />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold leading-tight text-zui-white">
              {project.name}
            </h3>
            {host && (
              <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-zui-white/40">
                <IconWorld size={11} />
                {host}
              </span>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-zui-stroke bg-zui-light/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zui-white/70">
            <IconUsers size={10} />
            {project.members}
          </span>
        </div>

        {project.description && (
          <p className="text-sm leading-relaxed text-zui-white/60">
            {project.description}
          </p>
        )}

        {project.builder && project.builderUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              window.open(project.builderUrl!, "_blank", "noopener,noreferrer");
            }}
            className="-mx-1 inline-flex w-fit items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-medium text-zui-white/50 transition-colors hover:text-zui-green"
          >
            Built by <span className="font-semibold">@{project.builder}</span>
            <IconExternalLink size={10} />
          </button>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-dashed border-zui-stroke pt-3">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zui-white"
            style={{ backgroundColor: `${accent}33`, border: `1px solid ${accent}55` }}
          >
            {project.status}
          </span>
          {hasUrl && (
            <span className="flex items-center gap-1 rounded-full border border-zui-green/60 bg-zui-green px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zui-dark transition-transform group-hover:scale-105">
              Visit
              <IconExternalLink size={11} />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (!hasUrl) return card;

  return (
    <a
      href={project.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      {card}
    </a>
  );
}

const PREVIEW_VIRTUAL_WIDTH = 1280;
const PREVIEW_VIRTUAL_HEIGHT = 800;

function PreviewFrame({ url, accent }: { url: string | null; accent: string }) {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / PREVIEW_VIRTUAL_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [url]);

  if (!url) {
    return (
      <div
        className="relative flex items-center justify-center border-b border-zui-stroke bg-zui-light/40"
        style={{ aspectRatio: "16 / 10" }}
      >
        <IconBriefcase size={48} className="text-zui-white/20" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden border-b border-zui-stroke bg-zui-light"
      style={{ aspectRatio: `${PREVIEW_VIRTUAL_WIDTH} / ${PREVIEW_VIRTUAL_HEIGHT}` }}
    >
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${accent}22, transparent 60%)`,
        }}
      >
        {!loaded && (
          <div className="flex flex-col items-center gap-2 text-zui-white/30">
            <IconWorld size={28} className="animate-pulse" />
            <span className="text-[10px] font-medium uppercase tracking-wider">
              Loading preview…
            </span>
          </div>
        )}
      </div>

      {scale > 0 && (
        <div
          className="pointer-events-none absolute left-0 top-0 origin-top-left"
          style={{
            width: `${PREVIEW_VIRTUAL_WIDTH}px`,
            height: `${PREVIEW_VIRTUAL_HEIGHT}px`,
            transform: `scale(${scale})`,
          }}
        >
          <iframe
            src={url}
            title={`Preview of ${url}`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            className="h-full w-full border-0 bg-white"
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5" />
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zui-stroke bg-zui-lighter">
      <div className="h-1 w-full bg-zui-light" />
      <div
        className="animate-pulse border-b border-zui-stroke bg-zui-light/60"
        style={{ aspectRatio: "16 / 10" }}
      />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-zui-light/60" />
        <div className="h-3 w-full animate-pulse rounded bg-zui-light/60" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-zui-light/60" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-dashed border-zui-stroke bg-zui-lighter p-12 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(102,223,72,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zui-stroke bg-zui-light/40">
          <IconBriefcase size={32} className="text-zui-pink" />
        </div>
        <h2 className="font-headline text-5xl leading-tight tracking-tight text-zui-white md:text-6xl">
          Nothing here yet
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-zui-white/60">
          The first batch of community projects is being curated. Drop back soon.
        </p>
      </div>
    </div>
  );
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
