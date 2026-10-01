import { BrandLogo } from "@/features/site/Brand";
import { Card } from "@/ui/Card";

/** Sign-in and invite pages: one card on a tinted background. No session exists yet. */
export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="grid min-h-screen place-items-center bg-accent-100 px-[var(--gutter)] py-12">
      <div className="grid w-full max-w-[440px] gap-8">
        <span className="brand mx-auto">
          <BrandLogo />
        </span>
        <Card className="p-8 shadow-raised">{children}</Card>
      </div>
    </main>
  );
}
