import { BrandLogo } from "@/features/site/Brand";
import { Blueprint } from "@/ui/Blueprint";

/** Sign-in and invite pages: a single framed panel, centred. No session exists yet. */
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="grid min-h-screen place-items-center px-[var(--gutter)] py-12">
      <div className="grid w-full max-w-[440px] gap-8">
        <span className="brand mx-auto">
          <BrandLogo />
        </span>
        <Blueprint className="panel bg-surface-input p-8">{children}</Blueprint>
      </div>
    </main>
  );
}
