"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, useState } from "react";
import type { Locale } from "@/i18n/config";
import { PHOTO_SLOTS, type PhotoSlot } from "@/features/site/photos";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/inputs";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";
import type { SiteContent } from "./content";
import { photoSrc } from "./photo-url";
import { removeSitePhoto, savePhotoAlts, setSitePhoto } from "./photo-actions";

type Photos = SiteContent["photos"];
const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 5 * 1024 * 1024;

function SlotPhoto({ locale, slot, path }: { locale: Locale; slot: PhotoSlot; path: string | null }) {
  const t = useTranslations("admin");
  const [setState, setAction, setPending] = useActionState(setSitePhoto, null);
  const [removeState, removeAction, removePending] = useActionState(removeSitePhoto, null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const src = photoSrc(path);
  const failed = uploadError || (setState && !setState.ok) || (removeState && !removeState.ok);

  async function upload(file: File) {
    setUploadError(false);
    const ext = EXTENSIONS[file.type];
    if (!ext || file.size > MAX_BYTES) return setUploadError(true);
    setUploading(true);
    const newPath = `${slot}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createBrowserSupabase().storage.from("site").upload(newPath, file, { contentType: file.type });
    setUploading(false);
    if (error) return setUploadError(true);
    const data = new FormData();
    data.set("locale", locale);
    data.set("slot", slot);
    data.set("path", newPath);
    startTransition(() => setAction(data));
  }

  return (
    <div className="grid gap-3">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of the stored file
        <img src={src} alt="" className="aspect-[4/3] w-full max-w-xs rounded-md object-cover" />
      ) : (
        <Text tone="muted" size="sm">{t("content.noPhoto")}</Text>
      )}
      <label className="btn btn-sm max-w-max cursor-pointer">
        {uploading || setPending ? t("content.uploading") : src ? t("content.photoReplace") : t("content.photoUpload")}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label={`${t(`content.slots.${slot}`)}: ${src ? t("content.photoReplace") : t("content.photoUpload")}`}
          disabled={uploading || setPending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
      </label>
      <Text tone="muted" size="sm">{t("content.photoHelp")}</Text>
      {src ? (
        <form
          action={removeAction}
          onSubmit={(event) => {
            if (!window.confirm(t("content.photoRemoveConfirm"))) event.preventDefault();
          }}
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="slot" value={slot} />
          <Button type="submit" variant="ghost" size="sm" disabled={removePending}>{t("content.photoRemove")}</Button>
        </form>
      ) : null}
      {failed ? <Text role="alert" tone="danger">{t(uploadError ? "errors.upload_failed" : "errors.server_error")}</Text> : null}
    </div>
  );
}

export function PhotosEditor({ locale, photos }: { locale: Locale; photos: Photos }) {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(savePhotoAlts, null);
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <Stack gap="lg">
      {PHOTO_SLOTS.map((slot) => (
        <section key={slot} className="card grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <h2 className="card-title md:col-span-2">{t(`content.slots.${slot}`)}</h2>
          <SlotPhoto locale={locale} slot={slot} path={photos[slot].path} />
          <div className="grid content-start gap-4">
            {(["de", "en"] as const).map((l) => {
              const name = `${slot}.alt.${l}`;
              const id = `alt-${slot}-${l}`;
              return (
                <Field key={l} id={id} label={`${t("content.fields.alt")} (${l.toUpperCase()})`} help={l === "de" ? t("content.altHelp") : undefined} errors={fieldErrors[name]?.map((c) => t(`fieldErrors.${c}`))}>
                  <Input id={id} name={name} form="photo-alts" defaultValue={photos[slot].alt[l]} invalid={Boolean(fieldErrors[name])} />
                </Field>
              );
            })}
          </div>
        </section>
      ))}
      <form
        id="photo-alts"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          startTransition(() => action(data));
        }}
      >
        <input type="hidden" name="locale" value={locale} />
        {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
        {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
        <Button type="submit" disabled={pending}>{t("content.saveAlts")}</Button>
      </form>
    </Stack>
  );
}
