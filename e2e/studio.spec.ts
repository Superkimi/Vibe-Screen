import { expect, test } from "@playwright/test";

test("landing page reaches the studio", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your screen, edited with intention." })).toBeVisible();
  await page.getByRole("link", { name: "Start recording" }).click();
  await expect(page).toHaveURL(/\/studio\/?$/);
  await expect(page.getByRole("heading", { name: "Capture your first scene" })).toBeVisible();
  await expect(page.getByLabel("Project media")).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Inspector" })).toBeVisible();
  await expect(page.getByLabel("Timeline editor")).toBeVisible();
});

test("recording dialog exposes capture and quality controls", async ({ page }) => {
  await page.goto("/studio");
  await page.getByRole("button", { name: "Start recording" }).click();
  await expect(page.getByRole("heading", { name: "Start a new recording" })).toBeVisible();
  await expect(page.getByText("Microphone", { exact: true })).toBeVisible();
  await expect(page.getByText("Shared audio", { exact: true })).toBeVisible();
  await expect(page.getByText("Camera", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "60 fps" })).toBeVisible();
});
