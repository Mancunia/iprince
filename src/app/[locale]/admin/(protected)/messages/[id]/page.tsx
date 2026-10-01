import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { getMessage } from "@/features/leads/admin-queries";
import { DeleteEntryForm } from "@/features/leads/DeleteEntryForm";
import { MessageStatusForm } from "@/features/leads/MessageStatusForm";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default async function MessageDetailPage({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin(locale);
  const [t, format, message] = await Promise.all([getTranslations("admin"), getFormatter(), getMessage(id)]);
  if (!message) notFound();

  return (
    <Stack gap="lg">
      <Link href="/admin/messages">{t("inbox.backToMessages")}</Link>
      <Text as="h1" size="xl">{message.name}</Text>
      <Text tone="muted">
        <a href={`mailto:${message.email}`}>{message.email}</a> · {t("inbox.received")}{" "}
        {format.dateTime(new Date(message.createdAt), { dateStyle: "medium", timeStyle: "short" })}
      </Text>
      <p className="whitespace-pre-wrap">{message.message}</p>
      <MessageStatusForm id={message.id} locale={locale} status={message.status} />
      <DeleteEntryForm kind="message" id={message.id} locale={locale} />
    </Stack>
  );
}
