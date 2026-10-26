import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { cleanHtml } from "../src/lib/articles/html";
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000",
});
Object.assign(globalThis, {
  window: dom.window,
  FormData: dom.window.FormData,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node,
  MutationObserver: dom.window.MutationObserver,
  DOMParser: dom.window.DOMParser,
  getComputedStyle: dom.window.getComputedStyle,
  requestAnimationFrame: (f: FrameRequestCallback) => setTimeout(f, 0),
  cancelAnimationFrame: clearTimeout,
});
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
dom.window.requestAnimationFrame = (f) => setTimeout(f, 0);
dom.window.cancelAnimationFrame = clearTimeout;
dom.window.document.elementFromPoint = () => dom.window.document.body;
dom.window.Range.prototype.getBoundingClientRect = () => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  toJSON() {
    return {};
  },
});
dom.window.Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
const marker = require.resolve("server-only");
require.cache[marker] = {
  exports: {},
  id: marker,
  filename: marker,
  loaded: true,
} as NodeModule;

test("server authorisation trusts verified identity, rejects other/unconfirmed accounts and cross-origin writes", async () => {
  const { requireAdmin, checkOrigin } = await import(
    "../src/lib/articles/client"
  );
  const client = (user: unknown, error: unknown = null) =>
    ({
      auth: { getUser: async () => ({ data: { user }, error }) },
    }) as unknown as Parameters<typeof requireAdmin>[0];
  const user = {
    id: "synthetic",
    email: "jay@plannedbyjay.com",
    email_confirmed_at: "2026-10-25",
  };
  assert.equal((await requireAdmin(client(user))).id, "synthetic");
  await assert.rejects(requireAdmin(client(null)), /Sign in/);
  await assert.rejects(
    requireAdmin(client({ ...user, email: "other@example.com" })),
    /cannot manage/,
  );
  await assert.rejects(
    requireAdmin(client({ ...user, email_confirmed_at: null })),
    /cannot manage/,
  );
  assert.throws(
    () =>
      checkOrigin(
        new Request("https://plannedbyjay.com/api/articles", {
          method: "POST",
          headers: { Origin: "https://evil.example" },
        }),
      ),
    /Refresh/,
  );
  assert.doesNotThrow(() =>
    checkOrigin(
      new Request("http://localhost:3107/api/articles", {
        method: "POST",
        headers: { Origin: "http://127.0.0.1:3107", Host: "127.0.0.1:3107" },
      }),
    ),
  );
  assert.throws(
    () =>
      checkOrigin(
        new Request("http://localhost:3107/api/articles", {
          method: "POST",
          headers: { Origin: "https://evil.example", Host: "127.0.0.1:3107" },
        }),
      ),
    /Refresh/,
  );
  assert.doesNotThrow(() =>
    checkOrigin(
      new Request("https://plannedbyjay.com/api/articles", {
        method: "POST",
        headers: { Origin: "https://plannedbyjay.com" },
      }),
    ),
  );
});

test("visual editor pastes Word-style content; inline creation, tags, photos, failures, preview and publication preserve the draft", async () => {
  const { render, fireEvent, cleanup, waitFor } = await import(
    "@testing-library/react"
  );
  const { ArticleEditor } = await import(
    "../src/components/articles/ArticleEditor"
  );
  const original = globalThis.fetch;
  let categoryFails = true,
    saveFails = false;
  const saved: Record<string, unknown>[] = [];
  const cid = "10000000-0000-4000-8000-000000000001",
    aid = "20000000-0000-4000-8000-000000000001";
  let version = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/categories"))
      return categoryFails
        ? Response.json(
            { error: "Temporary category failure" },
            { status: 503 },
          )
        : Response.json({ category: { id: cid, name: "Cruise advice" } });
    if (url.includes("/media"))
      return Response.json({
        images: [
          {
            path: "30000000-0000-4000-8000-000000000001-coast.webp",
            url: "/images/home/hero.jpg",
            alt: "Coast",
          },
        ],
      });
    const body = JSON.parse(String(init?.body));
    if (url.endsWith("/preview"))
      return Response.json({
        article: {
          ...body,
          body: cleanHtml(body.body),
          excerpt: body.excerpt || "",
        },
      });
    if (saveFails)
      return Response.json(
        { error: "Temporary save failure" },
        { status: 503 },
      );
    saved.push(body);
    return Response.json({
      article: {
        ...body,
        id: aid,
        version: ++version,
        created_at: "2026-10-25T12:00:00Z",
        updated_at: "2026-10-25T13:00:00Z",
        published_at:
          version >= 2 ? "2026-10-25T13:00:00Z" : null,
        excerpt: body.excerpt || "",
      },
    });
  };
  const view = render(
    <ArticleEditor initialCategories={[]} existingTags={["Cruise advice"]} />,
  );
  try {
    await waitFor(() =>
      assert.ok(view.getByRole("textbox", { name: "Article body" })),
    );
    fireEvent.change(view.getByLabelText("Article title"), {
      target: { value: "Is booking through a travel agent more expensive?" },
    });
    assert.equal(
      (view.getByLabelText("URL slug") as HTMLInputElement).value,
      "travel-agent-costs",
    );
    fireEvent.change(view.getByLabelText("Short preview / introduction (optional)"), {target: {value: "A purposeful custom introduction."}});
    const body = view.getByRole("textbox", { name: "Article body" });
    fireEvent.focus(body);
    fireEvent.paste(body, {
      clipboardData: {
        types: ["text/html", "text/plain"],
        getData: (type: string) =>
          type === "text/html"
            ? "<h2>Useful heading</h2><p><strong>Bold advice</strong> and <u>underlined text</u></p><ul><li>First point</li></ul>"
            : "Useful heading Bold advice",
      },
    });
    await waitFor(() => assert.match(body.innerHTML, /Useful heading/));
    assert.ok(body.querySelector("strong"));
    assert.ok(body.querySelector("ul"));
    assert.ok(body.querySelector("u"));
    fireEvent.change(view.getByRole("combobox", {name: "Text style"}), {target: {value: "subheading"}});
    await waitFor(() => assert.ok(body.querySelector("h3")));
    fireEvent.change(view.getByRole("combobox", {name: "Text style"}), {target: {value: "paragraph"}});
    fireEvent.click(view.getByRole("button", {name: "Bold"}));
    await waitFor(() => assert.equal(view.getByRole("button", {name: "Bold"}).getAttribute("aria-pressed"), "true"));
    fireEvent.click(view.getByRole("button", {name: "Bold"}));
    fireEvent.change(view.getByLabelText("Category"), {
      target: { value: "__new" },
    });
    fireEvent.change(view.getByLabelText("New category name"), {
      target: { value: "Cruise advice" },
    });
    fireEvent.click(view.getByRole("button", { name: "Create category" }));
    await waitFor(() =>
      assert.ok(
        view.getByRole("alert").textContent?.includes("category failure"),
      ),
    );
    assert.equal(view.getByRole("textbox", { name: "Article body" }), body);
    assert.match(body.innerHTML, /Bold advice/);
    categoryFails = false;
    fireEvent.click(view.getByRole("button", { name: "Create category" }));
    await waitFor(() =>
      assert.equal(
        (view.getByLabelText("Category") as HTMLSelectElement).value,
        cid,
      ),
    );
    assert.equal(view.getByRole("textbox", { name: "Article body" }), body);
    for (const tag of ["Cruise advice", "Tenerife", "cruise ADVICE"]) {
      fireEvent.change(view.getByLabelText("Tags"), { target: { value: tag } });
      fireEvent.keyDown(view.getByLabelText("Tags"), { key: "Enter" });
    }
    fireEvent.click(
      view.getByRole("button", { name: "Choose or upload photograph" }),
    );
    await waitFor(() =>
      assert.ok(view.getByRole("button", { name: "Choose Coast" })),
    );
    fireEvent.click(view.getByRole("button", { name: "Choose Coast" }));
    assert.equal(
      (
        view.getByLabelText(
          "Image description (optional; review the suggestion)",
        ) as HTMLInputElement
      ).value,
      "Coast",
    );
    saveFails = true;
    fireEvent.click(view.getByRole("button", { name: "Save Draft" }));
    await waitFor(() =>
      assert.ok(view.getByRole("alert").textContent?.includes("save failure")),
    );
    assert.match(body.innerHTML, /Bold advice/);
    saveFails = false;
    fireEvent.click(view.getByRole("button", { name: "Save Draft" }));
    await waitFor(() => assert.ok(view.getByText("Draft saved successfully.")));
    assert.equal(saved[0].status, "draft");
    assert.equal(saved[0].excerpt, "A purposeful custom introduction.");
    assert.deepEqual(saved[0].tags, ["Cruise advice", "Tenerife"]);
    assert.equal(saved[0].category_id, cid);
    assert.ok(saved[0].featured_image);
    fireEvent.click(view.getByRole("button", { name: "Preview" }));
    await waitFor(() =>
      assert.ok(view.getByRole("region", { name: "Private article preview" })),
    );
    assert.equal(saved.length, 1);
    assert.ok(
      view
        .getByRole("region", { name: "Private article preview" })
        .querySelector(".article-prose strong"),
    );
    fireEvent.click(view.getByRole("button", { name: "Close preview" }));
    fireEvent.click(view.getByRole("button", { name: "Publish" }));
    await waitFor(() => assert.ok(view.getByText("Article published successfully.")));
    assert.equal(saved[1].status, "published");
    assert.equal(view.getByRole("link", {name: "View Article"}).getAttribute("href"), "http://localhost:3000/travel-advice/travel-agent-costs");
    fireEvent.click(view.getByRole("button", {name: "Unpublish"}));
    await waitFor(() => assert.ok(view.getByText("Article unpublished and returned to drafts.")));

    assert.equal("created_at" in saved[1], false);
    assert.equal(
      (view.getByLabelText("URL slug") as HTMLInputElement).readOnly,
      true,
    );
    fireEvent.change(view.getByLabelText("Article title"), {
      target: { value: "Edited public title" },
    });
    assert.equal(
      (view.getByLabelText("URL slug") as HTMLInputElement).value,
      "travel-agent-costs",
    );
  } finally {
    cleanup();
    globalThis.fetch = original;
  }
});

test("business sign-in uses the existing Auth endpoint and only navigates after success", async () => {
  const { render, fireEvent, cleanup, waitFor } = await import(
    "@testing-library/react"
  );
  const { LoginForm } = await import("../src/components/articles/LoginForm");
  const { AppRouterContext } = await import(
    "next/dist/shared/lib/app-router-context.shared-runtime"
  );
  const original = globalThis.fetch;
  let destination = "",
    accepted = false;
  const router = {
    bfcacheId: "synthetic",
    back() {},
    forward() {},
    push() {},
    replace: (url: string) => {
      destination = url;
    },
    refresh() {},
    prefetch: async () => {},
  };
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "/api/articles/auth");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.email, "jay@plannedbyjay.com");
    return accepted
      ? Response.json({ ok: true })
      : Response.json({ error: "Test sign-in rejected" }, { status: 401 });
  };
  const view = render(
    <AppRouterContext.Provider value={router}>
      <LoginForm />
    </AppRouterContext.Provider>,
  );
  try {
    fireEvent.change(view.getByLabelText("Password"), {
      target: { value: "synthetic-password-only" },
    });
    fireEvent.submit(view.getByRole("form", { name: "Administrator sign in" }));
    await waitFor(() => assert.ok(view.getByRole("alert")));
    assert.equal(destination, "");
    accepted = true;
    fireEvent.submit(view.getByRole("form", { name: "Administrator sign in" }));
    await waitFor(() => assert.equal(destination, "/admin"));
  } finally {
    globalThis.fetch = original;
    cleanup();
  }
});

test("Holiday Type editor reuses formatted paste and media, preserves failed edits, previews privately and confirms publication/unpublishing", async () => {
  const {render, fireEvent, cleanup, waitFor} = await import("@testing-library/react");
  const {HolidayTypeEditor} = await import("../src/components/holidays/HolidayTypeEditor");
  const {prepareHoliday} = await import("../src/lib/holiday-types/save");
  const original = globalThis.fetch, originalConfirm = window.confirm;
  let fails = false, version = 0, submissions = 0;
  const writes: Record<string, unknown>[] = [];
  const id = "40000000-0000-4000-8000-000000000001";
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("/media")) return Response.json({images: [{path: "30000000-0000-4000-8000-000000000001-coast.webp", url: "/images/home/hero.jpg", alt: "Coast"}]});
    const body = prepareHoliday(JSON.parse(String(init?.body)));
    if (String(input).endsWith("/preview")) return Response.json({holiday: body});
    submissions++;
    if (fails) return Response.json({error: "Temporary Holiday Type save failure"}, {status: 503});
    writes.push(body);
    return Response.json({holiday: {...body, id, version: ++version, is_original: false, display_order: 100, created_at: "2026-10-26T12:00:00Z", updated_at: "2026-10-26T12:00:00Z", published_at: version >= 2 ? "2026-10-26T12:00:00Z" : null}});
  };
  window.confirm = () => true;
  const view = render(<HolidayTypeEditor publicBaseUrl="https://plannedbyjay.com"/>);
  try {
    await waitFor(() => assert.ok(view.getByRole("textbox", {name: "Page content"})));
    fireEvent.change(view.getByLabelText("Name"), {target: {value: "All-Inclusive"}});
    assert.equal((view.getByLabelText("URL slug") as HTMLInputElement).value, "all-inclusive");
    assert.equal((view.getByLabelText("Main heading") as HTMLInputElement).value, "All-Inclusive");
    fireEvent.change(view.getByLabelText("Short introduction"), {target: {value: "A natural introduction for the card."}});
    const body = view.getByRole("textbox", {name: "Page content"});
    fireEvent.focus(body);
    fireEvent.paste(body, {clipboardData: {types: ["text/html", "text/plain"], getData: (type: string) => type === "text/html" ? "<h2>A useful heading</h2><p><strong>Bold</strong> and <em>italic</em> <u>underlined</u> advice.</p><ul><li>A useful point</li></ul>" : "A useful heading"}});
    await waitFor(() => assert.ok(body.querySelector("h2")));
    assert.ok(body.querySelector("ul")); assert.ok(body.querySelector("strong")); assert.ok(body.querySelector("u"));
    fireEvent.click(view.getByRole("button", {name: "Choose or upload photograph"}));
    await waitFor(() => assert.ok(view.getByRole("button", {name: "Choose Coast"})));
    fireEvent.click(view.getByRole("button", {name: "Choose Coast"}));
    fails = true;
    fireEvent.click(view.getByRole("button", {name: "Save Draft"}));
    assert.ok(view.getByText("Saving draft..."));
    assert.ok(view.getByRole("button", {name: "Publish"}).matches(":disabled"));
    fireEvent.click(view.getByRole("button", {name: "Save Draft"}));
    await waitFor(() => assert.match(view.getByRole("alert").textContent || "", /save failure/));
    assert.equal(submissions, 1); assert.match(body.innerHTML, /Bold/);
    assert.equal((view.getByLabelText("Short introduction") as HTMLTextAreaElement).value, "A natural introduction for the card.");
    fails = false;
    fireEvent.click(view.getByRole("button", {name: "Save Draft"}));
    await waitFor(() => assert.ok(view.getByText("Draft saved successfully.")));
    assert.ok(String(writes[0].image).endsWith("coast.webp"));
    fireEvent.click(view.getByRole("button", {name: "Preview"}));
    await waitFor(() => assert.ok(view.getByRole("region", {name: "Private Holiday Type preview"})));
    assert.equal(writes.length, 1);
    assert.ok(view.getByRole("region", {name: "Private Holiday Type preview"}).querySelector("strong"));
    fireEvent.click(view.getByRole("button", {name: "Close preview"}));
    fireEvent.click(view.getByRole("button", {name: "Publish"}));
    await waitFor(() => assert.ok(view.getByText("Holiday Type published successfully.")));
    assert.equal(view.getByRole("link", {name: "View Holiday Type"}).getAttribute("href"), "https://plannedbyjay.com/holidays/all-inclusive");
    assert.equal((view.getByLabelText("URL slug") as HTMLInputElement).readOnly, true);
    fireEvent.change(view.getByLabelText("Name"), {target: {value: "Edited holiday name"}});
    assert.equal((view.getByLabelText("URL slug") as HTMLInputElement).value, "all-inclusive");
    fireEvent.click(view.getByRole("button", {name: "Save Changes"}));
    await waitFor(() => assert.ok(view.getByText("Holiday Type changes saved successfully.")));
    assert.equal(writes[2].status, "published");
    window.confirm = () => false;
    fireEvent.click(view.getByRole("button", {name: "Unpublish"}));
    assert.equal(writes.length, 3);
    window.confirm = () => true;
    fireEvent.click(view.getByRole("button", {name: "Unpublish"}));
    await waitFor(() => assert.ok(view.getByText("Holiday Type unpublished and returned to drafts.")));
    assert.equal(writes[3].status, "draft");
    assert.equal((view.getByLabelText("URL slug") as HTMLInputElement).readOnly, true);
  } finally {cleanup(); globalThis.fetch = original; window.confirm = originalConfirm;}
});

test("Holiday Type list protects original deletion and confirms versioned deletion for new types", async () => {
  const {render, fireEvent, cleanup, waitFor} = await import("@testing-library/react");
  const {HolidayTypeActions} = await import("../src/components/holidays/HolidayTypeActions");
  const {AppRouterContext} = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const original = globalThis.fetch, confirm = window.confirm;
  const holiday = {id: "40000000-0000-4000-8000-000000000001", name: "Family Holidays", status: "published", version: 2, is_original: true};
  let refreshed = 0, calls = 0;
  const router = {bfcacheId: "fixture", back() {}, forward() {}, push() {}, replace() {}, refresh() {refreshed++;}, prefetch: async () => {}};
  globalThis.fetch = async (input, init) => {
    calls++; assert.equal(String(input), "/api/holiday-types"); assert.equal(init?.method, "DELETE");
    assert.deepEqual(JSON.parse(String(init?.body)), {id: holiday.id, version: 2});
    return Response.json({ok: true});
  };
  try {
    const view = render(<AppRouterContext.Provider value={router}><HolidayTypeActions holiday={holiday}/></AppRouterContext.Provider>);
    assert.equal(view.queryByRole("button", {name: "Delete"}), null);
    view.rerender(<AppRouterContext.Provider value={router}><HolidayTypeActions holiday={{...holiday, is_original: false}}/></AppRouterContext.Provider>);
    window.confirm = () => false;
    fireEvent.click(view.getByRole("button", {name: "Delete"})); assert.equal(calls, 0);
    window.confirm = () => true;
    fireEvent.click(view.getByRole("button", {name: "Delete"}));
    await waitFor(() => assert.ok(view.getByText("Holiday Type deleted.")));
    assert.equal(refreshed, 1); assert.equal(calls, 1);
  } finally {cleanup(); globalThis.fetch = original; window.confirm = confirm;}
});

test("supplier form reviews ambiguous suggestions, protects manual entries, saves approval explicitly and retains failed edits", async () => {
  const {render, fireEvent, cleanup, waitFor} = await import("@testing-library/react");
  const {SupplierEditor} = await import("../src/components/suppliers/SupplierEditor");
  const {supplierInput} = await import("../src/lib/suppliers/schema");
  const original = globalThis.fetch, confirm = window.confirm;
  let fail = true, version = 0, attempts = 0;
  const writes: Record<string, unknown>[] = [];
  globalThis.fetch = async (input, init) => {
    const body = JSON.parse(String(init?.body));
    if (String(input).endsWith("/lookup")) return Response.json(body.name === "Jet2" ? {message: "Choose the correct business.", matches: [
      {name: "Jet2holidays", suggestions: [{field: "website", value: "https://www.jet2holidays.com", url: "https://www.jet2holidays.com", kind: "suggested"}]},
      {name: "Jet2.com", suggestions: [{field: "website", value: "https://www.jet2.com", url: "https://www.jet2.com", kind: "suggested"}]},
    ]} : {message: "Partial official details; no current CAA check.", matches: [{name: "Jet2holidays", suggestions: [
      {field: "website", value: "https://www.jet2holidays.com", url: "https://www.jet2holidays.com", kind: "official"},
      {field: "legal_name", value: "Jet2holidays Limited", url: "https://www.jet2holidays.com/terms-and-conditions", kind: "official"},
      {field: "contact_url", value: "https://www.jet2holidays.com/contact-us", url: "https://www.jet2holidays.com/contact-us", kind: "official"},
    ]}]});
    attempts++;
    if (fail) return Response.json({error: "A supplier with that name already exists. Search the directory."}, {status: 409});
    const parsed = supplierInput.parse(body); writes.push(parsed);
    return Response.json({supplier: {...parsed, id: "50000000-0000-4000-8000-000000000001", version: ++version, archived: false, created_at: "2026-10-26T12:00:00Z", updated_at: "2026-10-26T12:00:00Z"}});
  };
  window.confirm = () => false;
  const view = render(<SupplierEditor/>);
  try {
    fireEvent.change(view.getByLabelText("Supplier name"), {target: {value: "Jet2"}});
    fireEvent.click(view.getByRole("button", {name: "Find Supplier Details"}));
    await waitFor(() => assert.ok(view.getByRole("radio", {name: "Jet2holidays"})));
    assert.equal(view.queryByRole("button", {name: "Fill empty fields with suggestions"}), null);
    fireEvent.click(view.getByRole("radio", {name: "Jet2holidays"}));
    assert.equal((view.getByLabelText("Official website") as HTMLInputElement).value, "");
    fireEvent.click(view.getByRole("button", {name: "Fill empty fields with suggestions"}));
    assert.equal((view.getByLabelText("Official website") as HTMLInputElement).value, "https://www.jet2holidays.com");
    assert.equal((view.getByLabelText("Status") as HTMLSelectElement).value, "draft");
    fireEvent.change(view.getByLabelText("Supplier name"), {target: {value: "Jet2holidays"}});
    fireEvent.change(view.getByLabelText("Legal company / trading name"), {target: {value: "My manual correction"}});
    fireEvent.click(view.getByRole("button", {name: "Find Supplier Details"}));
    await waitFor(() => assert.ok(view.getByText("Partial official details; no current CAA check.")));
    fireEvent.click(view.getByRole("button", {name: "Use suggested legal company / trading name"}));
    assert.equal((view.getByLabelText("Legal company / trading name") as HTMLInputElement).value, "My manual correction");
    fireEvent.click(view.getByRole("button", {name: "Fill empty fields with suggestions"}));
    assert.equal((view.getByLabelText("Legal company / trading name") as HTMLInputElement).value, "My manual correction");
    assert.equal((view.getByLabelText("Public contact email") as HTMLInputElement).value, "");
    assert.equal((view.getByLabelText("Public business address") as HTMLTextAreaElement).value, "");
    assert.equal(writes.length, 0); assert.equal(attempts, 0);
    window.confirm = () => true;
    fireEvent.click(view.getByRole("button", {name: "Use suggested legal company / trading name"}));
    assert.ok(view.getByRole("link", {name: "Source for legal company / trading name"}));
    fireEvent.change(view.getByLabelText("Status"), {target: {value: "approved"}});
    fireEvent.click(view.getByRole("button", {name: "Save Supplier"}));
    assert.ok(view.getByText("Saving supplier..."));
    fireEvent.click(view.getByRole("button", {name: "Save Supplier"}));
    await waitFor(() => assert.match(view.getByRole("alert").textContent || "", /already exists/));
    assert.equal(attempts, 1);
    assert.equal((view.getByLabelText("Legal company / trading name") as HTMLInputElement).value, "Jet2holidays Limited");
    fail = false;
    fireEvent.click(view.getByRole("button", {name: "Save Supplier"}));
    await waitFor(() => assert.ok(view.getByText("Supplier saved successfully. Status: Approved.")));
    assert.equal(writes[0].status, "approved");
    fireEvent.change(view.getByLabelText("Legal company / trading name"), {target: {value: "Owner's correction"}});
    assert.equal(view.queryByRole("link", {name: "Source for legal company / trading name"}), null);
    fireEvent.click(view.getByRole("button", {name: "Save Changes"}));
    await waitFor(() => assert.equal(writes.length, 2));
    assert.equal(writes[1].legal_name, "Owner's correction");
    fireEvent.click(view.getByRole("button", {name: "Save Draft"}));
    await waitFor(() => assert.ok(view.getByText("Supplier draft saved successfully.")));
    assert.equal(writes[2].status, "draft");
  } finally {cleanup(); globalThis.fetch = original; window.confirm = confirm;}
});

test("supplier directory searches locally, distinguishes lookup, confirms archive and restores the same ID", async () => {
  const {render, fireEvent, cleanup, waitFor} = await import("@testing-library/react");
  const {SupplierDirectory} = await import("../src/components/suppliers/SupplierDirectory");
  const {supplierInput} = await import("../src/lib/suppliers/schema");
  const supplier = {...supplierInput.parse({name: "Jet2holidays", website: "https://www.jet2holidays.com", status: "approved"}), id: "50000000-0000-4000-8000-000000000001", archived: false, version: 1, created_at: "2026-10-26", updated_at: "2026-10-26"};
  const original = globalThis.fetch, confirm = window.confirm; let calls = 0;
  globalThis.fetch = async (_input, init) => {calls++; const body = JSON.parse(String(init?.body)); assert.equal(body.id, supplier.id); return Response.json({supplier: {...supplier, archived: body.archived, version: body.version + 1}});};
  try {
    const view = render(<SupplierDirectory initial={[]}/>);
    assert.ok(view.getByText("No suppliers added yet."));
    assert.ok(view.getByRole("link", {name: "Add Supplier"}));
    cleanup();
    const directory = render(<SupplierDirectory initial={[supplier]}/>);
    fireEvent.change(directory.getByLabelText("Search suppliers"), {target: {value: "jet2"}});
    assert.ok(directory.getByRole("heading", {name: "Jet2holidays"})); assert.equal(calls, 0);
    assert.equal(directory.queryByRole("button", {name: "Find Supplier Details"}), null);
    window.confirm = () => false;
    fireEvent.click(directory.getByRole("button", {name: "Archive"})); assert.equal(calls, 0);
    window.confirm = () => true;
    fireEvent.click(directory.getByRole("button", {name: "Archive"}));
    await waitFor(() => assert.ok(directory.getByText("Supplier archived. Its information has been retained.")));
    assert.equal(directory.queryByRole("heading", {name: "Jet2holidays"}), null);
    fireEvent.click(directory.getByLabelText("Include archived suppliers"));
    fireEvent.click(directory.getByRole("button", {name: "Restore"}));
    await waitFor(() => assert.ok(directory.getByText("Supplier restored successfully.")));
    assert.equal(calls, 2);
    assert.equal(directory.getByRole("link", {name: "Edit"}).getAttribute("href"), `/admin/suppliers/${supplier.id}/edit`);
  } finally {cleanup(); globalThis.fetch = original; window.confirm = confirm;}
});
