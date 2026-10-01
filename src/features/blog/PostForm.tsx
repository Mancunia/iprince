"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Field } from "@/ui/Field";
import { Icon } from "@/ui/Icon";
import { Input, Select, Textarea } from "@/ui/inputs";
import { Markdown } from "@/ui/Markdown";
import { Text } from "@/ui/Text";
import { createPost, updatePost } from "./admin-actions";
import { EXCERPT_MAX, POST_STATUSES, slugify, type PostInput } from "./schema";

type Lang = "de" | "en";
const LANGS = ["de", "en"] as const;
const SUFFIX = { de: "De", en: "En" } as const;

type Props = { locale: Locale; values: PostInput; categories: { id: string; name: string }[]; aside?: ReactNode } & (
  | { mode: "create" }
  | { mode: "edit"; id: string }
);

/**
 * Post editor. Both languages stay mounted (hidden, not removed) so one save sends de and en.
 * No `required` attributes: the browser cannot focus a required field on the hidden language tab; the server validates.
 */
export function PostForm(props: Props) {
  const { locale, values, categories, aside } = props;
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState(props.mode === "create" ? createPost : updatePost, null);
  const [lang, setLang] = useState<Lang>("de");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [body, setBody] = useState({ de: values.bodyDe, en: values.bodyEn });
  const [slug, setSlug] = useState(values.slug);
  const [slugEdited, setSlugEdited] = useState(values.slug !== "");
  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const errorsFor = (name: string) => fieldErrors[name]?.map((code) => t(`fieldErrors.${code}`));
  const invalid = (name: string) => Boolean(fieldErrors[name]);
  const langHasErrors = (l: Lang) => Object.keys(fieldErrors).some((key) => key.endsWith(SUFFIX[l]));

  return (
    <form
      onSubmit={(event) => {
        // Submit manually: a form `action` would reset the inputs after a failed save.
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      {props.mode === "edit" ? <input type="hidden" name="id" value={props.id} /> : null}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="gap-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("blog.language")}>
            {LANGS.map((l) => (
              <Button key={l} variant={lang === l ? "primary" : "secondary"} size="sm" aria-pressed={lang === l} onClick={() => setLang(l)}>
                {t(l === "de" ? "content.german" : "content.english")}
                {langHasErrors(l) ? (
                  <>
                    <Icon name="circle-alert" size={14} />
                    <span className="sr-only">{t("blog.hasErrors")}</span>
                  </>
                ) : null}
              </Button>
            ))}
            <span className="mx-2 border-l border-hairline" aria-hidden="true" />
            {(["write", "preview"] as const).map((m) => (
              <Button key={m} variant={mode === m ? "primary" : "secondary"} size="sm" aria-pressed={mode === m} onClick={() => setMode(m)}>
                {t(`content.${m}`)}
              </Button>
            ))}
          </div>
          {LANGS.map((l) => {
            const s = SUFFIX[l];
            const label = (key: string) => `${t(key)} (${l.toUpperCase()})`;
            return (
              <div key={l} hidden={lang !== l} className="grid gap-5">
                <Field id={`post-title-${l}`} label={label("blog.postTitle")} required={l === "de"} errors={errorsFor(`title${s}`)}>
                  <Input
                    id={`post-title-${l}`}
                    name={`title${s}`}
                    defaultValue={values[`title${s}` as const]}
                    invalid={invalid(`title${s}`)}
                    onChange={l === "de" ? (event) => { if (!slugEdited) setSlug(slugify(event.target.value)); } : undefined}
                  />
                </Field>
                <Field id={`post-excerpt-${l}`} label={label("blog.excerpt")} help={t("blog.excerptHelp")} errors={errorsFor(`excerpt${s}`)}>
                  <Textarea id={`post-excerpt-${l}`} name={`excerpt${s}`} rows={3} maxLength={EXCERPT_MAX} defaultValue={values[`excerpt${s}` as const]} invalid={invalid(`excerpt${s}`)} />
                </Field>
                <div hidden={mode !== "write"}>
                  <Field id={`post-body-${l}`} label={label("blog.body")} required={l === "de"} help={t("content.markdownHelp")} errors={errorsFor(`body${s}`)}>
                    <Textarea
                      id={`post-body-${l}`}
                      name={`body${s}`}
                      rows={24}
                      className="font-mono text-sm"
                      value={body[l]}
                      onChange={(event) => setBody({ ...body, [l]: event.target.value })}
                      invalid={invalid(`body${s}`)}
                    />
                  </Field>
                </div>
              </div>
            );
          })}
          {mode === "preview" ? <Card className="p-6"><Markdown>{body[lang] || body.de}</Markdown></Card> : null}
        </Card>

        <div className="grid gap-6 xl:sticky xl:top-6">
          <Card className="gap-4">
            <h2 className="card-title">{t("blog.publish")}</h2>
            <Field id="post-status" label={t("blog.status")} errors={errorsFor("status")}>
              <Select id="post-status" name="status" defaultValue={values.status}>
                {POST_STATUSES.map((s) => <option key={s} value={s}>{t(`blog.statuses.${s}`)}</option>)}
              </Select>
            </Field>
            <Field id="post-published-at" label={t("blog.publishedAt")} help={t("blog.publishedAtHelp")} errors={errorsFor("publishedAt")}>
              <Input id="post-published-at" name="publishedAt" type="datetime-local" defaultValue={values.publishedAt} invalid={invalid("publishedAt")} />
            </Field>
            <Field id="post-featured" label={t("blog.featured")}>
              <Input id="post-featured" name="isFeatured" type="checkbox" defaultChecked={values.isFeatured} />
            </Field>
            {state?.ok ? <Text role="status" tone="success">{t("saved")}</Text> : null}
            {state && !state.ok ? <Text role="alert" tone="danger">{t(`errors.${state.formError ?? "server_error"}`)}</Text> : null}
            <Button type="submit" disabled={pending}>{props.mode === "create" ? t("blog.create") : t("blog.save")}</Button>
          </Card>
          <Card className="gap-4">
            <h2 className="card-title">{t("blog.details")}</h2>
            <Field id="post-slug" label={t("blog.slug")} help={t("blog.slugHelp")} required errors={errorsFor("slug")}>
              <Input
                id="post-slug"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  // Clearing the slug hands it back to the title.
                  setSlugEdited(event.target.value !== "");
                }}
                invalid={invalid("slug")}
              />
            </Field>
            <Field id="post-category" label={t("blog.category")} errors={errorsFor("categoryId")}>
              <Select id="post-category" name="categoryId" defaultValue={values.categoryId}>
                <option value="">{t("blog.noCategory")}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field id="post-author" label={t("blog.author")} required errors={errorsFor("authorName")}>
              <Input id="post-author" name="authorName" defaultValue={values.authorName} invalid={invalid("authorName")} />
            </Field>
          </Card>
          {aside}
        </div>
      </div>
    </form>
  );
}
