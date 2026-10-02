"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { Locale } from "@/i18n/config";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Button } from "@/ui/Button";
import { Text } from "@/ui/Text";
import { removePostCover, setPostCover } from "./admin-actions";
import { COVER_EXTENSIONS, COVER_MAX_BYTES, coverFolder } from "./cover";
import { coverSrc } from "./cover-url";

/**
 * Uploads straight to storage as the admin, then records the path; an upload the server rejects is deleted again.
 * Sits inside the post <form>, so it uses buttons and direct action calls instead of a nested form.
 */
export function CoverField({ postId, locale, path }: { postId: string; locale: Locale; path: string | null }) {
  const t = useTranslations("admin");
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = coverSrc(path);
  const busy = uploading || pending;
  const uploadLabel = src ? t("blog.coverReplace") : t("blog.coverUpload");

  function payload(extra: Record<string, string> = {}) {
    const data = new FormData();
    data.set("locale", locale);
    data.set("id", postId);
    for (const [key, value] of Object.entries(extra)) data.set(key, value);
    return data;
  }

  async function upload(file: File) {
    setError(null);
    const ext = COVER_EXTENSIONS[file.type];
    if (!ext || file.size > COVER_MAX_BYTES) return setError("upload_failed");
    setUploading(true);
    const supabase = createBrowserSupabase();
    const newPath = `${coverFolder(postId)}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("blog").upload(newPath, file, { contentType: file.type });
    setUploading(false);
    if (uploadError) return setError("upload_failed");
    startTransition(async () => {
      const result = await setPostCover(null, payload({ path: newPath }));
      if (!result.ok) {
        await supabase.storage.from("blog").remove([newPath]);
        setError(result.formError ?? "server_error");
      }
    });
  }

  function remove() {
    if (!window.confirm(t("blog.coverRemoveConfirm"))) return;
    setError(null);
    startTransition(async () => {
      const result = await removePostCover(null, payload());
      if (!result.ok) setError(result.formError ?? "server_error");
    });
  }

  return (
    <div className="grid gap-3">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview of the stored file
        <img src={src} alt="" className="aspect-[16/9] w-full rounded-md object-cover" />
      ) : (
        <Text tone="muted" size="sm">{t("blog.noCover")}</Text>
      )}
      <label className="btn btn-sm max-w-max cursor-pointer">
        {busy ? t("blog.uploading") : uploadLabel}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label={uploadLabel}
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
      </label>
      <Text tone="muted" size="sm">{t("blog.coverHelp")}</Text>
      {src ? <Button variant="ghost" size="sm" disabled={busy} onClick={remove}>{t("blog.coverRemove")}</Button> : null}
      {error ? <Text role="alert" tone="danger">{t(`errors.${error}`)}</Text> : null}
    </div>
  );
}
