"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/ui/Button";
import { Stack } from "@/ui/Stack";
import { Text } from "@/ui/Text";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  console.error(error);
  return (
    <Stack>
      <Text as="h1" size="xl">{t("genericTitle")}</Text>
      <Button onClick={reset}>{t("retry")}</Button>
    </Stack>
  );
}
