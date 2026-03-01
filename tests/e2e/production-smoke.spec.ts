import { expect, test, devices } from "@playwright/test";

const submitter = {
  email: "maydan.hosa.submitter@bhaprep.org",
  password: "Maydan!Test1234",
};

const approver = {
  email: "maydan.hosa.adviser@bhaprep.org",
  password: "Maydan!Test1234",
};

test("public login is mobile-safe and free of browser errors", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    ...devices["iPhone 12"],
  });
  const page = await context.newPage();
  const errors = bindErrorCollectors(page);

  await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "Staff login" })).toBeVisible();
  expect(await hasHorizontalOverflow(page)).toBe(false);
  expect(errors.consoleErrors).toEqual([]);
  expect(errors.pageErrors).toEqual([]);

  await context.close();
});

test("submitter event form is mobile-safe and free of browser errors", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    ...devices["iPhone 12"],
  });
  const page = await context.newPage();
  const errors = bindErrorCollectors(page);

  await login(page, `${baseURL}`, submitter);
  await page.goto(`${baseURL}/events/new`, { waitUntil: "networkidle" });

  await expect(
    page.getByRole("heading", { name: "Event submission form" }),
  ).toBeVisible();
  expect(await hasHorizontalOverflow(page)).toBe(false);
  expect(errors.consoleErrors).toEqual([]);
  expect(errors.pageErrors).toEqual([]);

  await context.close();
});

test("approver queue is desktop-safe and free of browser errors", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors = bindErrorCollectors(page);

  await login(page, `${baseURL}`, approver);
  await page.goto(`${baseURL}/approvals`, { waitUntil: "networkidle" });

  await expect(page.getByRole("heading", { name: "Approvals" })).toBeVisible();
  expect(await hasHorizontalOverflow(page)).toBe(false);
  expect(errors.consoleErrors).toEqual([]);
  expect(errors.pageErrors).toEqual([]);

  await context.close();
});

function bindErrorCollectors(page: Parameters<typeof test>[0]["page"]) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(String(error));
  });

  return {
    consoleErrors,
    pageErrors,
  };
}

async function login(
  page: Parameters<typeof test>[0]["page"],
  baseUrl: string,
  credentials: { email: string; password: string },
) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("School email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);

  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15_000 }),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);
}

async function hasHorizontalOverflow(
  page: Parameters<typeof test>[0]["page"],
) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
}
