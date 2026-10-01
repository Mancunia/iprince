import Image from "next/image";

/** Logo mark + wordmark (dark variant; every surface that shows the logo is light). */
export function BrandLogo() {
  return (
    <>
      <Image src="/logo/iprince-mark.png" alt="" width={556} height={478} className="brand-mark" priority />
      <Image src="/logo/iprince-wordmark.png" alt="" width={729} height={248} className="brand-word" priority />
    </>
  );
}
