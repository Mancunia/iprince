import { getTranslations } from "next-intl/server";
import { Text } from "@/ui/Text";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return <Text as="h1" size="xl">{t("notFoundTitle")}</Text>;
}
