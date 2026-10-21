import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { enquiryContent as content } from '../src/content/enquiry';
import type { NavbarProps } from '../src/components/layout/Navbar';
import {
  initialDraft,
  detailsSchema,
  submissionSchema,
} from '../src/lib/enquiries/schema';
import { readFile } from 'node:fs/promises';

// These are DOM component tests, not browser rendering or external-service delivery tests.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000',
});
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node,
  MutationObserver: dom.window.MutationObserver,
});
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
});

test('current enquiry markup hydrates without mismatches after browser HTML parsing', async () => {
  const { renderToString } = await import('react-dom/server');
  const { hydrateRoot } = await import('react-dom/client');
  const { act } = await import('@testing-library/react');
  const { EnquiryForm } = await import('../src/components/enquiry/EnquiryForm');
  const host = document.createElement('div');
  host.innerHTML = renderToString(<EnquiryForm enabled={false} />);
  document.body.appendChild(host);
  assert.ok(host.querySelector('h3.travellers-heading'));
  assert.equal(host.querySelector('.error-summary'), null);
  const recoverable: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(host, <EnquiryForm enabled={false} />, {
        onRecoverableError: (error) => recoverable.push(error),
      });
    });
    assert.deepEqual(recoverable, []);
    assert.equal(
      host.querySelector('h3.travellers-heading')?.textContent,
      "Who's travelling?",
    );
  } finally {
    await act(async () => root?.unmount());
    host.remove();
  }
});

test('form-shape edits require remount: preserved useState reproduces the missing departure string', async () => {
  const { useState } = await import('react');
  const { render, cleanup } = await import('@testing-library/react');
  function DraftProbe({ initial }: { initial: Record<string, unknown> }) {
    const [draft] = useState(initial);
    return <output>{JSON.stringify(draft)}</output>;
  }
  const obsolete = { ...initialDraft } as Record<string, unknown>;
  delete obsolete.departurePreferences;
  obsolete.departures = [];
  const view = render(<DraftProbe initial={obsolete} />);
  try {
    view.rerender(<DraftProbe initial={initialDraft} />);
    const preserved = JSON.parse(view.getByRole('status').textContent!);
    assert.equal(preserved.departurePreferences, undefined);
    const parsed = detailsSchema.safeParse({
      ...preserved,
      dateChoice: 'flexible',
      duration: 'seven',
      budget: 'guidance',
    });
    assert.equal(parsed.success, false);
    if (!parsed.success)
      assert.ok(
        parsed.error.issues.some(
          (issue) => issue.path[0] === 'departurePreferences',
        ),
      );
    view.rerender(<DraftProbe key="current-version" initial={initialDraft} />);
    assert.equal(
      JSON.parse(view.getByRole('status').textContent!).departurePreferences,
      '',
    );
    assert.match(
      await readFile('src/components/enquiry/EnquiryForm.tsx', 'utf8'),
      /\/\/ @refresh reset/,
    );
  } finally {
    cleanup();
  }
});

test('hydrated three-stage journey submits a blank optional departure as a string through strict validation', async () => {
  const { renderToString } = await import('react-dom/server');
  const { hydrateRoot } = await import('react-dom/client');
  const { act, within, fireEvent, waitFor } =
    await import('@testing-library/react');
  const { default: userEvent } = await import('@testing-library/user-event');
  const { EnquiryForm } = await import('../src/components/enquiry/EnquiryForm');
  const user = userEvent.setup({ document: dom.window.document });
  const host = document.createElement('div');
  host.innerHTML = renderToString(<EnquiryForm enabled />);
  document.body.appendChild(host);
  const view = within(host);
  const originalFetch = global.fetch;
  const recoverable: unknown[] = [];
  const originalClipboard = Object.getOwnPropertyDescriptor(
    navigator,
    'clipboard',
  );
  let copied = '';
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        copied = text;
      },
    },
  });
  const originalConsoleError = console.error;
  const hydrationWarnings: unknown[][] = [];
  console.error = (...args) => hydrationWarnings.push(args);
  let submitted: Record<string, unknown> | undefined;
  global.fetch = async (url, init) => {
    if (url === '/api/enquiries/session') return Response.json({ ready: true });
    const result = submissionSchema.safeParse(JSON.parse(String(init?.body)));
    assert.equal(
      result.success,
      true,
      'the server schema must accept the current payload without defaults or legacy conversion',
    );
    if (result.success) submitted = result.data.brief;
    return Response.json({ reference: 'PBJ-583742' });
  };
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(host, <EnquiryForm enabled />, {
        onRecoverableError: (error) => recoverable.push(error),
      });
    });
    await user.click(view.getByLabelText('I\u2019m open to suggestions.'));
    fireEvent.change(view.getByLabelText(content.fields.holidayType), {
      target: { value: 'cruise' },
    });
    await user.click(view.getByRole('button', { name: /Continue/ }));
    assert.equal(
      (
        view.getByLabelText(
          content.fields.departurePreferences,
        ) as HTMLInputElement
      ).value,
      '',
    );
    assert.equal(view.queryByText('Other departure option'), null);
    await user.click(view.getByLabelText('Flexible dates'));
    fireEvent.change(view.getByLabelText(content.fields.duration), {
      target: { value: 'seven' },
    });
    fireEvent.change(view.getByLabelText(content.fields.budget), {
      target: { value: 'guidance' },
    });
    await user.click(view.getByRole('button', { name: /Continue/ }));
    fireEvent.change(view.getByLabelText(content.fields.name), {
      target: { value: 'Test Traveller' },
    });
    fireEvent.change(view.getByLabelText(content.fields.email), {
      target: { value: 'test@example.com' },
    });
    await user.click(
      view.getByLabelText('I\u2019m exploring ideas for a future trip.'),
    );
    await user.click(
      view.getByRole('button', { name: /Send My Holiday Brief/ }),
    );
    await waitFor(() => assert.ok(view.getByText('PBJ-583742')));
    assert.ok(view.getByText(content.messages.successTitle));
    assert.ok(view.getByText(content.messages.referenceNote));
    await user.click(
      view.getByRole('button', { name: content.messages.copyReference }),
    );
    assert.equal(copied, 'PBJ-583742');
    assert.ok(view.getByText(content.messages.referenceCopied));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error('not available');
        },
      },
    });
    await user.click(
      view.getByRole('button', { name: content.messages.copyReference }),
    );
    assert.ok(view.getByText(content.messages.referenceCopyFailed));
    assert.equal(submitted?.departurePreferences, '');
    assert.deepEqual(recoverable, []);
    assert.deepEqual(hydrationWarnings, []);
  } finally {
    await act(async () => root?.unmount());
    global.fetch = originalFetch;
    if (originalClipboard)
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
    console.error = originalConsoleError;
    host.remove();
  }
});

test('Navbar hydrates from the server navigation snapshot and retains it during menu interaction', async () => {
  const { renderToString } = await import('react-dom/server');
  const { hydrateRoot } = await import('react-dom/client');
  const { act, fireEvent } = await import('@testing-library/react');
  const { Navbar } = await import('../src/components/layout/Navbar');
  window.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => true,
  });
  const props: NavbarProps = {
    links: [{ label: 'Home', href: '/' }],
    primaryAction: { label: 'Plan My Holiday', href: '/plan-my-holiday' },
    brand: { name: 'Planned by Jay', descriptor: 'Personal travel planning' },
  };
  const host = document.createElement('div');
  host.innerHTML = renderToString(<Navbar {...props} />);
  document.body.appendChild(host);
  const errors: unknown[][] = [];
  const originalError = console.error;
  console.error = (...args) => {
    errors.push(args);
  };
  const recoverable: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    const serverAnchor = host.querySelector('.nav-cta');
    assert.equal(serverAnchor?.getAttribute('href'), '/plan-my-holiday');
    // A browser must hydrate from the serialised server snapshot, not independently
    // look up a module-level constant that could still belong to an older compilation.
    const clientProps = JSON.parse(JSON.stringify(props)) as NavbarProps;
    await act(async () => {
      root = hydrateRoot(host, <Navbar {...clientProps} />, {
        onRecoverableError: (error) => recoverable.push(error),
      });
    });
    assert.deepEqual(recoverable, []);
    assert.deepEqual(errors, []); // Attribute-only mismatches may not call onRecoverableError.
    assert.equal(host.querySelector('.nav-cta'), serverAnchor);
    await act(async () => {
      fireEvent.click(host.querySelector('.menu-toggle')!);
    });
    assert.equal(
      host.querySelector('.menu-toggle')?.getAttribute('aria-expanded'),
      'true',
    );
    assert.equal(
      host.querySelector('.nav-cta')?.getAttribute('href'),
      '/plan-my-holiday',
    );
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    assert.equal(
      host.querySelector('.menu-toggle')?.getAttribute('aria-expanded'),
      'false',
    );
    assert.equal(
      host.querySelector('.nav-cta')?.getAttribute('href'),
      '/plan-my-holiday',
    );
  } finally {
    await act(async () => root?.unmount());
    console.error = originalError;
    host.remove();
  }
});

test('all stages, conditional inputs, preserved answers, focus/error links and disabled submission', async () => {
  const { render, fireEvent, cleanup } = await import('@testing-library/react');
  const { default: userEvent } = await import('@testing-library/user-event');
  const { EnquiryForm } = await import('../src/components/enquiry/EnquiryForm');
  const user = userEvent.setup({ document: dom.window.document });
  const view = render(<EnquiryForm enabled={false} />);
  const change = (label: string, value: string) =>
    fireEvent.change(view.getByLabelText(label, { exact: true }), {
      target: { value },
    });
  try {
    assert.equal(view.queryByRole('alert'), null);
    assert.ok(view.getByRole('heading', { name: "Who's travelling?" }));
    await user.click(view.getByRole('button', { name: /Continue/ }));
    assert.equal(view.getByRole('alert'), document.activeElement);
    await user.click(
      view.getByRole('button', { name: /^Where would you like to go/ }),
    );
    assert.equal(
      document.activeElement?.getAttribute('name'),
      'destinationChoice',
    );
    await user.keyboard(' '); // Native radio group is keyboard operable.
    assert.ok(view.getByLabelText(content.fields.destinationIdeas));
    change(content.fields.destinationIdeas, 'Italy');
    change(content.fields.holidayType, 'family');
    change(content.fields.children, '1');
    change('Child 1 age at travel', '7');
    await user.click(view.getByRole('button', { name: /Continue/ }));
    assert.equal(document.activeElement?.textContent, content.steps[1].title);
    await user.click(view.getByLabelText('Specific dates'));
    assert.ok(view.getByLabelText(content.fields.startDate));
    await user.click(view.getByLabelText('Flexible dates'));
    assert.equal(view.queryByLabelText(content.fields.startDate), null);
    change(content.fields.flexibleNotes, 'School holidays');
    change(content.fields.duration, 'seven');
    change(
      content.fields.departurePreferences,
      'Manchester, Liverpool or Dover cruise port',
    );
    change(content.fields.budget, 'under-1000');
    change(content.fields.preferences, 'A quieter base');
    await user.click(
      view.getByLabelText(content.fields.requirementsDiscussion),
    );
    await user.click(view.getByRole('button', { name: /Continue/ }));
    change(content.fields.name, 'Test Traveller');
    change(content.fields.email, 'test@example.com');
    await user.click(view.getByLabelText('Telephone'));
    change(content.fields.phone, '+44 7700 900123');
    await user.click(
      view.getByLabelText('I’m ready to book when we find the right holiday.'),
    );
    assert.ok(view.getByText('Dover cruise port', { exact: false }));
    assert.ok(view.getByText('School holidays', { exact: false }));
    assert.ok(view.getByText('A quieter base'));
    await user.click(view.getByRole('button', { name: 'Edit The details' }));
    assert.equal(
      (
        view.getByLabelText(
          content.fields.departurePreferences,
        ) as HTMLInputElement
      ).value,
      'Manchester, Liverpool or Dover cruise port',
    );
    await user.click(view.getByRole('button', { name: /Continue/ }));
    await user.click(view.getByRole('button', { name: 'Back' }));
    assert.equal(
      (view.getByLabelText(content.fields.flexibleNotes) as HTMLTextAreaElement)
        .value,
      'School holidays',
    );
    assert.equal(
      (
        view.getByLabelText(
          content.fields.departurePreferences,
        ) as HTMLInputElement
      ).value,
      'Manchester, Liverpool or Dover cruise port',
    );
    await user.click(view.getByRole('button', { name: 'Back' }));
    assert.equal(
      (view.getByLabelText(content.fields.destinationIdeas) as HTMLInputElement)
        .value,
      'Italy',
    );
    assert.equal(
      (view.getByLabelText('Child 1 age at travel') as HTMLInputElement).value,
      '7',
    );
    await user.click(view.getByRole('button', { name: /Continue/ }));
    await user.click(view.getByRole('button', { name: /Continue/ }));
    assert.equal(
      (view.getByLabelText(content.fields.phone) as HTMLInputElement).value,
      '+44 7700 900123',
    );
    assert.equal(
      (
        view.getByRole('button', {
          name: /Send My Holiday Brief/,
        }) as HTMLButtonElement
      ).disabled,
      true,
    );
    await user.tab();
    assert.ok(document.activeElement instanceof dom.window.HTMLElement);
  } finally {
    cleanup();
  }
});

test('errors wait for a step attempt, update on correction and keep focus in the input', async () => {
  const { render, fireEvent, cleanup } = await import('@testing-library/react');
  const { default: userEvent } = await import('@testing-library/user-event');
  const { EnquiryForm } = await import('../src/components/enquiry/EnquiryForm');
  const user = userEvent.setup({ document: dom.window.document });
  const view = render(<EnquiryForm enabled={false} />);
  try {
    await user.click(view.getByLabelText('I know where I want to go.'));
    fireEvent.change(view.getByLabelText(content.fields.holidayType), {
      target: { value: 'family' },
    });
    fireEvent.change(view.getByLabelText(content.fields.children), {
      target: { value: '1' },
    });
    assert.equal(view.queryByRole('alert'), null);
    assert.equal(
      view
        .getByLabelText(content.fields.destinationIdeas)
        .getAttribute('aria-invalid'),
      'false',
    );
    await user.click(view.getByRole('button', { name: /Continue/ }));
    await user.click(
      view.getByRole('button', { name: /^Tell me your destination/ }),
    );
    const destination = view.getByLabelText(content.fields.destinationIdeas);
    assert.equal(document.activeElement, destination);
    await user.type(destination, 'Italy');
    assert.equal(document.activeElement, destination);
    assert.equal(destination.getAttribute('aria-invalid'), 'false');
    assert.equal(
      view.queryByRole('button', { name: /^Tell me your destination/ }),
      null,
    );
    await user.click(
      view.getByRole('button', { name: /^Child 1 age at travel:/ }),
    );
    const age = view.getByLabelText('Child 1 age at travel');
    assert.equal(document.activeElement, age);
    await user.type(age, '7');
    assert.equal(document.activeElement, age);
    assert.equal(view.queryByRole('alert'), null);
    await user.click(view.getByRole('button', { name: /Continue/ }));
    assert.equal(view.queryByRole('alert'), null);
    await user.click(view.getByLabelText('Specific dates'));
    assert.equal(view.queryByRole('alert'), null);
    await user.click(view.getByRole('button', { name: /Continue/ }));
    assert.ok(view.getByRole('alert'));
    await user.click(view.getByLabelText('Flexible dates'));
    assert.equal(
      view.queryByRole('button', { name: /^Preferred departure date:/ }),
      null,
    );
    assert.equal(
      view.queryByRole('button', { name: /^Preferred return date:/ }),
      null,
    );
  } finally {
    cleanup();
  }
});

test('telephone validation, submission loading lock, safe failure and same-id retry confirmation', async () => {
  const { render, fireEvent, cleanup, waitFor } =
    await import('@testing-library/react');
  const { default: userEvent } = await import('@testing-library/user-event');
  const { EnquiryForm } = await import('../src/components/enquiry/EnquiryForm');
  const user = userEvent.setup({ document: dom.window.document });
  const view = render(<EnquiryForm enabled />);
  const originalFetch = global.fetch;
  const posted: { submissionId: string; brief: unknown }[] = [];
  let resolveFirst: (value: Response) => void = () => {};
  let first = true;
  global.fetch = async (url, init) => {
    if (url === '/api/enquiries/session') return Response.json({ ready: true });
    posted.push(JSON.parse(String(init?.body)));
    if (first) {
      first = false;
      return await new Promise<Response>((resolve) => {
        resolveFirst = resolve;
      });
    }
    return Response.json({ reference: 'PBJ-TEST-RECEIVED' });
  };
  const change = (label: string, value: string) =>
    fireEvent.change(view.getByLabelText(label, { exact: true }), {
      target: { value },
    });
  try {
    await user.click(view.getByLabelText('I’m open to suggestions.'));
    change(content.fields.holidayType, 'cruise');
    await user.click(view.getByRole('button', { name: /Continue/ }));
    await user.click(view.getByLabelText('An approximate month or period'));
    change(content.fields.travelPeriod, 'August 2099');
    change(content.fields.duration, 'seven');
    change(
      content.fields.departurePreferences,
      'UK port / flights not required',
    );
    change(content.fields.budget, 'guidance');
    await user.click(view.getByRole('button', { name: /Continue/ }));
    change(content.fields.name, 'Test Traveller');
    change(content.fields.email, 'test@example.com');
    await user.click(view.getByLabelText('Telephone'));
    await user.click(
      view.getByLabelText('I’m exploring ideas for a future trip.'),
    );
    await user.click(
      view.getByRole('button', { name: /Send My Holiday Brief/ }),
    );
    assert.ok(
      view.getByText('Add a telephone number so Jay can call you.', {
        exact: true,
      }),
    );
    change(content.fields.phone, 'invalid');
    await user.click(
      view.getByRole('button', { name: /Send My Holiday Brief/ }),
    );
    assert.ok(
      view.getByText('Enter a telephone number with 7–15 digits.', {
        exact: true,
      }),
    );
    change(content.fields.phone, '07700 900123');
    await user.dblClick(
      view.getByRole('button', { name: /Send My Holiday Brief/ }),
    );
    await waitFor(() => assert.equal(posted.length, 1));
    assert.equal(
      (
        view.getByRole('button', {
          name: /Sending your brief/,
        }) as HTMLButtonElement
      ).disabled,
      true,
    );
    assert.equal(
      (view.getByRole('button', { name: 'Back' }) as HTMLButtonElement)
        .disabled,
      true,
    );
    resolveFirst(
      Response.json(
        { code: 'failure', message: 'raw technical secret' },
        { status: 503 },
      ),
    );
    await waitFor(() => assert.ok(view.getByText(content.messages.failure)));
    assert.equal(view.queryByText('raw technical secret'), null);
    assert.equal(
      (view.getByLabelText(content.fields.phone) as HTMLInputElement).value,
      '07700 900123',
    );
    await user.click(
      view.getByRole('button', { name: /Send My Holiday Brief/ }),
    );
    await waitFor(() =>
      assert.ok(view.getByText(content.messages.successTitle)),
    );
    assert.equal(posted.length, 2);
    assert.equal(posted[0].submissionId, posted[1].submissionId);
    assert.equal(document.activeElement?.className, 'enquiry-success');
    assert.ok(view.getByText('PBJ-TEST-RECEIVED'));
  } finally {
    global.fetch = originalFetch;
    cleanup();
  }
});
