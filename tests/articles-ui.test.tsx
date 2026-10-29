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

test("manual supplier form saves incomplete drafts, approval and corrections without losing failed edits", async () => {
  const {render, fireEvent, cleanup, waitFor} = await import("@testing-library/react");
  const {SupplierEditor} = await import("../src/components/suppliers/SupplierEditor");
  const {supplierInput, supplierFields} = await import("../src/lib/suppliers/schema");
  const original = globalThis.fetch;
  let fail = false, version = 0, attempts = 0;
  const writes: Record<string, unknown>[] = [];
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "/api/suppliers");
    assert.equal(init?.method, "POST");
    attempts++;
    const body = JSON.parse(String(init?.body));
    assert.equal("sources" in body, false);
    if (fail) return Response.json({error: "A supplier with that name already exists. Search the directory."}, {status: 409});
    const parsed = supplierInput.parse(body); writes.push(parsed);
    return Response.json({supplier: {...parsed, id: "50000000-0000-4000-8000-000000000001", version: ++version, archived: false, created_at: "2026-10-26T12:00:00Z", updated_at: "2026-10-26T12:00:00Z"}});
  };
  const view = render(<SupplierEditor/>);
  try {
    assert.deepEqual([...view.container.querySelectorAll("label")].map(label => label.textContent?.replace(/DraftApproved$/, "")), ["Supplier name", ...Object.values(supplierFields), "Status"]);
    fireEvent.change(view.getByLabelText("Supplier name"), {target: {value: "Test supplier"}});
    assert.equal(attempts, 0);
    fireEvent.click(view.getByRole("button", {name: "Save Draft"}));
    await waitFor(() => assert.ok(view.getByText("Supplier draft saved successfully.")));
    assert.equal(writes[0].atol_holder, ""); assert.equal(writes[0].atol_number, "");
    assert.equal(writes[0].contact_email, ""); assert.equal(writes[0].contact_url, "");
    fireEvent.change(view.getByLabelText("Official website"), {target: {value: "https://example.org"}});
    fireEvent.change(view.getByLabelText("Legal/trading company name"), {target: {value: "Test operating company"}});
    fireEvent.change(view.getByLabelText("Public business address"), {target: {value: "Test public contact address"}});
    fireEvent.change(view.getByLabelText("Official contact-page URL"), {target: {value: "https://example.org/contact"}});
    fireEvent.change(view.getByLabelText("Booking conditions URL"), {target: {value: "https://example.org/booking-conditions"}});
    fireEvent.change(view.getByLabelText("Supplier specialism"), {target: {value: "Accommodation"}});
    fireEvent.change(view.getByLabelText("Status"), {target: {value: "approved"}});
    fail = true;
    fireEvent.click(view.getByRole("button", {name: "Save Changes"}));
    assert.ok(view.getByText("Saving supplier..."));
    fireEvent.click(view.getByRole("button", {name: "Save Changes"}));
    await waitFor(() => assert.match(view.getByRole("alert").textContent || "", /already exists/));
    assert.equal(attempts, 2);
    assert.equal((view.getByLabelText("Legal/trading company name") as HTMLInputElement).value, "Test operating company");
    fail = false;
    fireEvent.click(view.getByRole("button", {name: "Save Changes"}));
    await waitFor(() => assert.ok(view.getByText("Supplier saved successfully. Status: Approved.")));
    assert.equal(writes[1].status, "approved");
    assert.equal(writes[1].contact_email, "");
    assert.equal(writes[1].contact_url, "https://example.org/contact");
    fireEvent.change(view.getByLabelText("Legal/trading company name"), {target: {value: "Owner's correction"}});
    fireEvent.click(view.getByRole("button", {name: "Save Changes"}));
    await waitFor(() => assert.equal(writes.length, 3));
    assert.equal(writes[2].legal_name, "Owner's correction");
  } finally {cleanup(); globalThis.fetch = original;}
});

test("supplier directory searches locally, confirms archive and restores the same ID", async () => {
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

test("offer editor reuses paste/media, multiple Holiday Types, party pricing and private preview with reliable save feedback",async()=>{
  const {render,fireEvent,cleanup,waitFor}=await import("@testing-library/react");
  const {OfferEditor}=await import("../src/components/offers/OfferEditor");
  const {prepareOffer}=await import("../src/lib/offers/validation");
  const {ukToday}=await import("../src/lib/offers/schema");
  const original=globalThis.fetch,confirm=window.confirm;
  const supplier={id:"50000000-0000-4000-8000-000000000001",name:"Jet2holidays",legal_name:"Synthetic fixture company",business_address:"Fixture address",contact_email:"",contact_url:"https://example.org/contact",booking_conditions_url:"https://example.org/terms",website:"https://example.org",atol_holder:"",atol_number:"",status:"approved",archived:false};
  const types=[{id:"b0000000-0000-4000-8000-000000000001",name:"Family Holidays"},{id:"b0000000-0000-4000-8000-000000000003",name:"Couples Escapes"}];
  const writes:ReturnType<typeof prepareOffer>[]=[];let fail=true,version=0,firstPublished:string|null=null;
  globalThis.fetch=async(input,init)=>{
    if(String(input).includes("/media"))return Response.json({images:[{path:"30000000-0000-4000-8000-000000000001-coast.webp",url:"/images/home/hero.jpg",alt:"Coast"}]});
    const offer=prepareOffer(JSON.parse(String(init?.body)));
    const metadata={id:"60000000-0000-4000-8000-000000000001",reference:"000042",archived:false,created_at:"2026-10-26T12:00:00Z",updated_at:"2026-10-26T12:00:00Z"};
    if(String(input).endsWith("/preview"))return Response.json({offer:{...offer,...metadata,published_at:null,supplier,image:"/images/home/hero.jpg",galleryImages:[]}});
    if(fail)return Response.json({error:"Temporary offer save failure"},{status:503});
    writes.push(offer);if(offer.status==="published")firstPublished ||= "2026-10-26T12:00:00Z";
    return Response.json({offer:{...offer,...metadata,version:++version,published_at:firstPublished}});
  };
  window.confirm=()=>true;
  const view=render(<OfferEditor suppliers={[supplier]} holidayTypes={types} publicBaseUrl="https://plannedbyjay.com"/>);
  try{
    assert.deepEqual([...view.container.querySelectorAll("h2")].map(h=>h.textContent),["A. Holiday","B. Travel details","C. Price","D. Presentation","E. Publishing"]);
    fireEvent.change(view.getByLabelText("Holiday title"),{target:{value:"Synthetic sunshine break"}});
    fireEvent.change(view.getByLabelText("Supplier"),{target:{value:supplier.id}});
    fireEvent.change(view.getByLabelText("Destination country"),{target:{value:"Spain"}});
    fireEvent.change(view.getByLabelText("Short description"),{target:{value:"Controlled fixture, not a real available holiday."}});
    fireEvent.change(view.getByLabelText("Departure date"),{target:{value:"2099-01-01"}});
    fireEvent.change(view.getByLabelText("Return date (optional)"),{target:{value:"2099-01-08"}});
    assert.equal((view.getByLabelText("Number of nights") as HTMLInputElement).value,"7");
    fireEvent.change(view.getByLabelText("Total advertised price for the stated party"),{target:{value:"2400.50"}});
    fireEvent.click(view.getByRole("button",{name:"Confirm price checked today"}));
    assert.equal((view.getByLabelText("Price-check date") as HTMLInputElement).value,ukToday());
    fireEvent.change(view.getByLabelText("What's included"),{target:{value:"Fixture accommodation"}});
    fireEvent.click(view.getByLabelText("Family Holidays"));fireEvent.click(view.getByLabelText("Couples Escapes"));
    fireEvent.change(view.getByLabelText("Promotional sash"),{target:{value:"jays-pick"}});fireEvent.click(view.getByLabelText("Featured on Homepage"));
    await waitFor(()=>assert.ok(view.getByRole("textbox",{name:"Holiday description"})));
    const body=view.getByRole("textbox",{name:"Holiday description"});
    fireEvent.focus(body);fireEvent.paste(body,{clipboardData:{types:["text/html","text/plain"],getData:(type:string)=>type==="text/html"?"<h2>Highlights</h2><p><strong>Useful advice</strong></p><ul><li>Fixture point</li></ul>":"Highlights"}});
    await waitFor(()=>assert.ok(body.querySelector("strong")));
    fireEvent.click(view.getByRole("button",{name:"Choose or upload featured photograph"}));
    await waitFor(()=>assert.ok(view.getByRole("button",{name:"Choose Coast"})));fireEvent.click(view.getByRole("button",{name:"Choose Coast"}));
    fireEvent.click(view.getByRole("button",{name:"Save Draft"}));
    await waitFor(()=>assert.match(view.getByRole("alert").textContent||"",/save failure/));assert.ok(body.querySelector("strong"));
    fail=false;fireEvent.click(view.getByRole("button",{name:"Save Draft"}));
    await waitFor(()=>assert.ok(view.getByText("Offer draft saved successfully.")));
    assert.ok(view.getByText("Offer reference: 000042"));assert.equal(writes[0].total_price_minor,240050);assert.deepEqual(writes[0].holiday_type_ids,types.map(t=>t.id));
    assert.equal(writes[0].featured,true);assert.ok(writes[0].featured_image);
    fireEvent.click(view.getByRole("button",{name:"Preview"}));
    await waitFor(()=>assert.ok(view.getByRole("region",{name:"Private holiday offer preview"})));assert.equal(writes.length,1);
    fireEvent.click(view.getByRole("button",{name:"Close preview"}));fireEvent.click(view.getByRole("button",{name:"Publish"}));
    await waitFor(()=>assert.ok(view.getByText("Offer published successfully.")));
    assert.equal(view.getByRole("link",{name:"View Holiday"}).getAttribute("href"),"https://plannedbyjay.com/holiday-offers/synthetic-sunshine-break");
    assert.equal((view.getByLabelText("URL slug") as HTMLInputElement).readOnly,true);
    fireEvent.change(view.getByLabelText("Holiday title"),{target:{value:"Edited title"}});
    fireEvent.click(view.getByRole("button",{name:"Save Changes"}));await waitFor(()=>assert.ok(view.getByText("Offer changes saved successfully.")));
    assert.equal(writes[2].status,"published");assert.equal(writes[2].slug,"synthetic-sunshine-break");
    window.confirm=()=>false;fireEvent.click(view.getByRole("button",{name:"Unpublish"}));assert.equal(writes.length,3);
    window.confirm=()=>true;fireEvent.click(view.getByRole("button",{name:"Unpublish"}));await waitFor(()=>assert.ok(view.getByText("Offer unpublished and returned to drafts.")));
  }finally{cleanup();globalThis.fetch=original;window.confirm=confirm;}
});

test("offer enquiry form and endpoint do not collect details while delivery is unavailable",async()=>{
  const {render,fireEvent,cleanup}=await import("@testing-library/react");
  const {OfferEnquiryForm}=await import("../src/components/offers/OfferEnquiryForm");
  const {POST}=await import("../src/app/api/offer-enquiries/route");
  const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw new Error("No delivery configured");};
  try{
    const view=render(<OfferEnquiryForm offerId="60000000-0000-4000-8000-000000000001"/>);
    assert.ok(view.getByText(/No details are collected/));
    for(const field of view.container.querySelectorAll("input,textarea"))assert.ok(field.matches(":disabled"));
    fireEvent.submit(view.getByRole("form",{name:"Offer-specific enquiry"}));assert.equal(calls,0);
    const request=new Request("https://plannedbyjay.com/api/offer-enquiries",{method:"POST",headers:{Origin:"https://plannedbyjay.com"}});
    request.text=async()=>{throw new Error("Disabled route must not read personal data");};
    assert.equal((await POST(request)).status,503);
  }finally{cleanup();globalThis.fetch=original;}
});

test("offer list confirms mutations and opens duplicate offers as new drafts",async()=>{
  const {render,fireEvent,cleanup,waitFor}=await import("@testing-library/react");
  const {OfferActions}=await import("../src/components/offers/OfferActions");
  const {AppRouterContext}=await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const original=globalThis.fetch,confirm=window.confirm;
  const offer={id:"60000000-0000-4000-8000-000000000001",title:"Fixture offer",version:2,status:"published",archived:false};
  let calls=0,destination="",action="";
  const router={bfcacheId:"fixture",back(){},forward(){},push:(url:string)=>{destination=url;},replace(){},refresh(){},prefetch:async()=>{}};
  globalThis.fetch=async(input,init)=>{calls++;assert.equal(String(input),"/api/offers");assert.equal(init?.method,"PATCH");const body=JSON.parse(String(init?.body));assert.equal(body.id,offer.id);assert.equal(body.version,2);action=body.action;return Response.json(body.action==="duplicate"?{offer:{id:"60000000-0000-4000-8000-000000000002"}}:{ok:true});};
  try{
    const view=render(<AppRouterContext.Provider value={router}><OfferActions offer={offer}/></AppRouterContext.Provider>);
    window.confirm=()=>false;fireEvent.click(view.getByRole("button",{name:"Archive"}));assert.equal(calls,0);
    window.confirm=()=>true;fireEvent.click(view.getByRole("button",{name:"Duplicate offer"}));
    await waitFor(()=>assert.equal(destination,"/admin/holiday-offers/60000000-0000-4000-8000-000000000002/edit"));assert.equal(action,"duplicate");
    fireEvent.click(view.getByRole("button",{name:"Unpublish"}));await waitFor(()=>assert.ok(view.getByText("Offer unpublished and returned to drafts.")));assert.equal(action,"unpublish");
    fireEvent.click(view.getByRole("button",{name:"Archive"}));await waitFor(()=>assert.ok(view.getByText("Offer archived.")));assert.equal(action,"archive");
  }finally{cleanup();globalThis.fetch=original;window.confirm=confirm;}
});

test("offer enquiry acknowledgement waits for a server reference and prevents repeated successful submission",async()=>{
  const {render,fireEvent,cleanup,waitFor}=await import("@testing-library/react");
  const {OfferEnquiryForm}=await import("../src/components/offers/OfferEnquiryForm");
  const original=globalThis.fetch;let receipt=false,calls=0;const tokens:string[]=[];
  globalThis.fetch=async(_input,init)=>{calls++;const body=JSON.parse(String(init?.body));assert.equal(body.offer_id,"60000000-0000-4000-8000-000000000001");assert.equal("total_price_minor" in body,false);tokens.push(body.request_id);return Response.json(receipt?{accepted:true,reference:"000042",notification:"accepted"}:{});};
  try{
    const view=render(<OfferEnquiryForm offerId="60000000-0000-4000-8000-000000000001" enabled privacyHref="/privacy"/>);
    assert.ok(view.getByText('I aim to reply personally within three working days. More detailed holiday research and quotations may take a little longer.'));
    fireEvent.change(view.getByLabelText("Your name"),{target:{value:"Fixture customer"}});fireEvent.change(view.getByLabelText("Email address"),{target:{value:"customer@example.org"}});
    fireEvent.submit(view.getByRole("form",{name:"Offer-specific enquiry"}));
    await waitFor(()=>assert.ok(view.getByRole("alert")));assert.equal(view.queryByText(/Your enquiry has been received/),null);
    receipt=true;fireEvent.submit(view.getByRole("form",{name:"Offer-specific enquiry"}));
    await waitFor(()=>assert.ok(view.getByText(/Your enquiry has been received/)));
    assert.equal(tokens[0],tokens[1]);assert.equal(calls,2);
    fireEvent.submit(view.getByRole("form",{name:"Offer-specific enquiry"}));assert.equal(calls,2);
    assert.ok(view.getByText("Your enquiry has been received. Offer reference: 000042"));assert.ok(view.getByRole("button",{name:"Enquiry received"}).matches(":disabled"));
    assert.match(view.getByRole('status').textContent||'',/I aim to reply personally within three working days\. More detailed holiday research and quotations may take a little longer\./);
  }finally{cleanup();globalThis.fetch=original;}
});

test('offer enquiry shows its saved holiday context and acknowledges pending mail only after durable acceptance',async()=>{
  const {render,fireEvent,cleanup,waitFor}=await import('@testing-library/react');
  const {OfferEnquiryForm}=await import('../src/components/offers/OfferEnquiryForm');
  const original=globalThis.fetch;let calls=0,resolveResponse!:(value:Response)=>void;
  globalThis.fetch=async(_input,init)=>{
    calls++;const value=JSON.parse(String(init?.body));assert.equal(value.offer_id,'60000000-0000-4000-8000-000000000001');
    for(const field of ['reference','title','supplier','total_price_minor','adults','children'])assert.equal(field in value,false,'holiday data is captured by the database, not trusted from the browser');
    return new Promise<Response>(resolve=>{resolveResponse=resolve;});
  };
  try{
    const view=render(<OfferEnquiryForm offerId="60000000-0000-4000-8000-000000000001" enabled privacyHref="/privacy" summary={{reference:'000042',title:'Saved holiday title',supplier:'Saved supplier',departure_date:'2099-01-01',total_price_minor:240600,currency:'GBP',adults:2,children:1,child_ages:[8]}}/>);
    assert.ok(view.getByText('Saved holiday title'));assert.ok(view.getByText(/Offer reference: 000042.*Saved supplier/));assert.ok(view.getByText(/2 adults \+ 1 child \(ages 8\)/));
    assert.equal(view.getByRole('link',{name:'Privacy information'}).getAttribute('href'),'/privacy');
    fireEvent.change(view.getByLabelText('Your name'),{target:{value:'Fixture customer'}});fireEvent.change(view.getByLabelText('Email address'),{target:{value:'fixture@example.org'}});
    const form=view.getByRole('form',{name:'Offer-specific enquiry'});fireEvent.submit(form);fireEvent.submit(form);assert.equal(calls,1);
    assert.equal(view.queryByText(/Your enquiry has been/),null);
    resolveResponse(Response.json({accepted:true,reference:'000042',notification:'pending'},{status:202}));
    await waitFor(()=>assert.ok(view.getByText(/Your enquiry has been saved securely.*notification is pending/)));
    assert.doesNotMatch(view.container.textContent||'',/email (?:was |has been )?delivered/i);
    fireEvent.submit(form);assert.equal(calls,1);assert.ok(view.getByRole('button',{name:'Enquiry received'}).matches(':disabled'));
  }finally{cleanup();globalThis.fetch=original;}
});

test('administrator notification retry retains failed enquiries and checks older messages before resending',async()=>{
  const {render,fireEvent,cleanup,waitFor}=await import('@testing-library/react');
  const {AppRouterContext}=await import('next/dist/shared/lib/app-router-context.shared-runtime');
  const {RetryOfferNotification}=await import('../src/components/offers/RetryOfferNotification');
  const original=globalThis.fetch,confirm=window.confirm;let calls=0,refreshes=0,fail=true;
  const router={refresh:()=>{refreshes++;}} as unknown as import('next/dist/shared/lib/app-router-context.shared-runtime').AppRouterInstance;
  globalThis.fetch=async(input,init)=>{
    calls++;assert.equal(String(input),'/api/offer-enquiries/notification');assert.equal(init?.method,'POST');
    const value=JSON.parse(String(init.body));assert.equal(value.id,'70000000-0000-4000-8000-000000000001');
    return fail?Response.json({error:'Notification pending; enquiry retained.'},{status:503}):Response.json({notification:'accepted'});
  };
  try{
    const element=(needsReview:boolean)=><AppRouterContext.Provider value={router}><RetryOfferNotification id="70000000-0000-4000-8000-000000000001" needsReview={needsReview}/></AppRouterContext.Provider>;
    const view=render(element(false));fireEvent.click(view.getByRole('button',{name:'Retry email notification'}));
    await waitFor(()=>assert.ok(view.getByRole('alert')));assert.equal(refreshes,0);
    view.rerender(element(true));window.confirm=()=>false;fireEvent.click(view.getByRole('button',{name:'Retry email notification'}));assert.equal(calls,1);
    window.confirm=()=>true;fail=false;fireEvent.click(view.getByRole('button',{name:'Retry email notification'}));
    await waitFor(()=>assert.ok(view.getByText(/Notification accepted by Resend/)));assert.equal(refreshes,1);assert.equal(calls,2);
    assert.doesNotMatch(view.container.textContent||'',/email (?:was |has been )?delivered/i);
  }finally{cleanup();globalThis.fetch=original;window.confirm=confirm;}
});
