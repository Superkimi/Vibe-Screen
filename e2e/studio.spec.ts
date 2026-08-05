import { expect, test } from "@playwright/test";

test("root route restores the saved language preference", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("vibe_screen_locale", "zh"));
  await page.goto("/");
  await expect(page).toHaveURL(/\/zh\/?$/);
  await expect(page.getByRole("heading", { name: "把屏幕录制，剪成好视频。" })).toBeVisible();
});

test("landing page reaches the studio", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Your screen, edited with intention." })).toBeVisible();
  await page.getByRole("link", { name: "Start recording" }).click();
  await expect(page).toHaveURL(/\/en\/studio\/?$/);
  await expect(page.getByRole("heading", { name: "Capture your first scene" })).toBeVisible();
  await expect(page.getByLabel("Project media")).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Inspector" })).toBeVisible();
  await expect(page.getByLabel("Timeline editor")).toBeVisible();
});

test("Chinese landing page switches to the matching English route", async ({ page }) => {
  await page.goto("/zh");
  await expect(page.getByRole("heading", { name: "把屏幕录制，剪成好视频。" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "主要导航" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(page.getByRole("heading", { name: "Your screen, edited with intention." })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("studio switches every editor surface between Chinese and English", async ({ page }) => {
  await page.goto("/zh/studio");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByRole("complementary", { name: "检查器" })).toBeVisible();
  await expect(page.getByText("素材", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "录制" }).first()).toBeVisible();
  await page.getByRole("button", { name: "录制" }).first().click();
  await expect(page.getByRole("heading", { name: "开始新的录制" })).toBeVisible();
  await expect(page.getByText("麦克风", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "关闭录制器" }).click();
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/studio\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("complementary", { name: "Inspector" })).toBeVisible();
  await expect(page.getByText("Assets", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record" }).first()).toBeVisible();
});

test("recording dialog exposes capture and quality controls", async ({ page }) => {
  await page.goto("/en/studio");
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByRole("heading", { name: "Start a new recording" })).toBeVisible();
  await expect(page.getByText("Microphone", { exact: true })).toBeVisible();
  await expect(page.getByText("Shared audio", { exact: true })).toBeVisible();
  await expect(page.getByText("Camera", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "60 fps" })).toBeVisible();
});

test("speed editing controls stay bilingual", async ({ page }) => {
  await page.goto("/zh/studio");
  await page.getByRole("button", { name: "变速", exact: true }).click();
  await expect(page.getByRole("heading", { name: "变速" })).toBeVisible();
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await page.getByRole("button", { name: "Speed", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Speed" })).toBeVisible();
});
