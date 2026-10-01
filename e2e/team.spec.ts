import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

const MAILPIT = "http://127.0.0.1:54324";

/** Latest email link sent to `to`, read from the local Mailpit API. */
async function latestEmailLink(to: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages.length > 0) {
      const message = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { HTML: string };
      const href = message.HTML.match(/href="([^"]+)"/)?.[1];
      if (href) return href.replaceAll("&amp;", "&");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`no email for ${to}`);
}

test("the owner invites an editor, who sets a password and is later removed", async ({ page, browser }) => {
  const email = `e2e-editor-${Date.now()}@iprince.local`;
  const row = () => page.getByRole("row", { name: new RegExp(email) });

  await signIn(page);
  await page.goto("/en/admin/team");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Display name").fill("E2E Editor");
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByRole("status")).toHaveText("Invite sent.");
  await expect(row()).toContainText("Invited — pending");

  const editorContext = await browser.newContext();
  const editor = await editorContext.newPage();
  await editor.goto(await latestEmailLink(email));
  await expect(editor).toHaveURL(/\/en\/admin\/accept-invite\?/);
  await editor.getByRole("button", { name: "Accept invite" }).click();
  await expect(editor).toHaveURL(/\/en\/admin\/set-password$/);
  await editor.getByLabel("New password").fill("editor-password-123");
  await editor.getByLabel("Confirm password").fill("editor-password-123");
  await editor.getByRole("button", { name: "Set password" }).click();
  await expect(editor).toHaveURL(/\/en\/admin\/applications$/);
  await expect(editor.getByRole("link", { name: "Team" })).toHaveCount(0);
  expect((await editor.goto("/en/admin/team"))?.status()).toBe(404);

  await page.reload();
  await expect(row()).toContainText("Active");
  page.once("dialog", (dialog) => dialog.accept());
  await row().getByRole("button", { name: "Remove" }).click();
  await expect(row()).toHaveCount(0);

  await editor.goto("/en/admin/applications");
  await expect(editor).toHaveURL(/\/en\/admin\/login$/);
  await editorContext.close();
});

test("a used or bogus invite link lands on the login page with a notice", async ({ page }) => {
  await page.goto("/api/auth/confirm?token_hash=bogus&type=invite&next=%2Fen%2Fadmin%2Fset-password");
  await expect(page).toHaveURL(/\/en\/admin\/accept-invite\?/);
  await page.getByRole("button", { name: "Accept invite" }).click();
  await expect(page).toHaveURL(/\/en\/admin\/login\?notice=invite_expired$/);
  // Next adds its own empty role=alert route announcer, so filter by text.
  await expect(page.getByRole("alert").filter({ hasText: "expired" })).toBeVisible();
});

test("the confirm route never redirects off-site", async ({ page }) => {
  await page.goto("/api/auth/confirm?token_hash=bogus&type=invite&next=https%3A%2F%2Fevil.example");
  await expect(page).toHaveURL(/^http:\/\/localhost:3000\/de\/admin\/accept-invite\?/);
});
