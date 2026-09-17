// Read-only feature/navigation acceptance check in an isolated desktop profile.
const { _electron: electron } = require("playwright");
const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert/strict");

(async () => {
  const output = path.resolve(".sandbox/mighty-ui-acceptance");
  fs.mkdirSync(output, { recursive: true });
  const desktopProfile = fs.mkdtempSync(
    path.join(os.tmpdir(), "mighty-ui-check-"),
  );
  const app = await electron.launch({
    args: [path.resolve("out/main/index.js")],
    env: {
      ...process.env,
      HERMES_DESKTOP_USER_DATA_DIR: desktopProfile,
      MIGHTY_HOME: path.join(process.env.LOCALAPPDATA, "Mighty"),
      HERMES_DESKTOP_APP_NAME: "Mighty — UI verification",
    },
    timeout: 45000,
  });
  const report = { checks: [], errors: [] };
  try {
    const page = await app.firstWindow();
    page.on("pageerror", (e) => report.errors.push(e.message));
    page.setDefaultTimeout(25000);
    await page.getByRole("button", { name: "Overview", exact: true }).waitFor();
    const health = await page.evaluate(() => window.hermesAPI.verifyInstall());
    assert.equal(health, true, "Independent runtime health probe");
    report.checks.push("independent runtime health");
    await page.screenshot({ path: path.join(output, "overview.png") });
    for (const name of [
      "Chat",
      "Brain",
      "Workflows",
      "Apps & tools",
      "Discover",
      "Office",
      "Schedules",
      "Companion",
    ]) {
      assert.ok(
        await page.getByRole("button", { name, exact: true }).count(),
        `${name} navigation retained`,
      );
    }
    report.checks.push("existing navigation retained");
    await page.getByRole("button", { name: "Office", exact: true }).click();
    await page.getByRole("heading", { name: /Agents Office/ }).waitFor();
    await page.waitForFunction(() =>
      document
        .querySelector(".agency-office-header h1")
        ?.textContent.includes("279 specialists"),
    );
    assert.equal(await page.locator(".agency-room").count(), 6);
    assert.ok(
      await page
        .getByRole("button", { name: "Explore 3D", exact: true })
        .count(),
    );
    const sum = await page
      .locator(".agency-room")
      .evaluateAll((nodes) =>
        nodes.reduce(
          (total, node) =>
            total +
            Number(
              node.getAttribute("aria-label").match(/(\d+) specialists/)[1],
            ),
          0,
        ),
      );
    assert.equal(sum, 279, "Every installed specialist is reachable");
    report.checks.push(
      "six office departments, 279 specialists, original 3D entry",
    );
    await page.screenshot({ path: path.join(output, "office.png") });
    await page
      .getByRole("button", { name: "Customize appearance", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Appearance", exact: true })
      .waitFor();
    assert.equal(await page.locator(".mighty-theme-swatch").count(), 10);
    report.checks.push("10 OpenHuman theme presets");
    await page.screenshot({ path: path.join(output, "appearance.png") });
    await page.getByRole("button", { name: "Companion", exact: true }).click();
    await page.locator(".mighty-conversation-layout.with-companion").waitFor();
    report.checks.push("companion alongside existing chat");
    await page.screenshot({ path: path.join(output, "companion.png") });
    assert.equal(report.errors.length, 0, "No renderer exceptions");
    console.log(JSON.stringify(report));
  } finally {
    fs.writeFileSync(
      path.join(output, "report.json"),
      JSON.stringify(report, null, 2),
    );
    await app.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
