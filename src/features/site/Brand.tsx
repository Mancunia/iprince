import Image from "next/image";

/** Logo mark + wordmark. The dark or light variant is picked by CSS (.door-employer, .site-footer, .admin-side). */
export function BrandLogo() {
  return (
    <>
      <Image src="/logo/iprince-mark.png" alt="" width={556} height={478} className="brand-mark logo-dark" priority />
      <Image src="/logo/iprince-mark-light.png" alt="" width={556} height={478} className="brand-mark logo-light" />
      <Image src="/logo/iprince-wordmark.png" alt="" width={729} height={248} className="brand-word logo-dark" priority />
      <Image src="/logo/iprince-wordmark-light.png" alt="" width={729} height={248} className="brand-word logo-light" />
    </>
  );
}
