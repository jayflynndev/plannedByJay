# Planned by Jay design system

## Explore Holidays

The `/holidays` landing grid reuses the established 4:3 photographs, editorial cards and cream/forest/sage/terracotta tokens. A single `HolidayTypePage` template gives each guide an image/introduction, distinct planning considerations, styles, native expandable questions, optional published related reading, cross-links and one final enquiry action. It has no booking widgets, promotional prices or repeated lead capture. Editable text/crops live in `src/content/holiday-types.ts`; see [HOLIDAY-PAGES-GUIDE.md](HOLIDAY-PAGES-GUIDE.md).

Use semantic H1/H2/H3 hierarchy, visible focus, native keyboard-operable question summaries and 44px link/button targets. At <=767px the hero and planning grid stack, with a 4:3 hero crop; landing cards follow existing one/two/three-column breakpoints. Three editorial style columns stack below 1024px. Reuse `SiteImage` with local assets and a labelled neutral failure state; photography never establishes accommodation availability or accessibility. Related article cards reuse the existing published-preview treatment. CSS stays scoped to `.holiday-page`; homepage layout is unchanged.

The direction combines a calm editorial layout with a friendly, practical service. Photographs complement plain, readable copy. No carousels or animation libraries.

## Phase 4 public completion

The existing homepage structure and palette remain. The portrait panel shows genuine owner photography when configured, otherwise brand typography without a public setup notice. `SiteImage` retains the containing layout when a file is missing and retries a changed URL; no replacement person or unofficial logo is generated. Official artwork slots require explicit display approval and use contain sizing.

`/why-jay` reuses Container, Button, section spacing and the sage/forest panels. Its four priorities form a two-column desktop grid and a single mobile column; numbered journey steps are a semantic ordered list. Text stays centrally editable. The footer adds a compact reusable trust-information block with clear New Travel attribution; no giant legal placeholder, empty social notice or unsupported protection promise is shown. Footer links have at least 44px targets. Public main landmarks accept programmatic focus so the existing skip link moves keyboard focus as well as scrolling.

Homepage article cards use the latest published CMS title/excerpt/type and real article URL. Neutral type panels handle missing images; no sample cards appear in empty/unavailable libraries. Cards have visible keyboard focus, readable links and existing responsive image crops. Privacy/cookie/booking layouts exist behind approval gates and are not public draft notices. Mandatory enquiry safety warnings remain unchanged.

## Phase 3 editorial and admin components (existing)

`src/app/cms.css` uses the existing cream, forest, terracotta and sage tokens. Public articles have a 900px maximum width, a narrower 760px reading column, Georgia headings and 17–18px body text with generous spacing. The article title supplies H1; Markdown H1 is safely rendered as H2. Tables scroll inside their own keyboard-focusable region. Featured images retain their proportions; Next Image supplies responsive delivery and optimisation from the dedicated editorial bucket.

The CMS uses labelled 16px inputs, 48px controls, wrapping actions, semantic details sections and a two-column editor that stacks below 1000px. At 600px, filters, metadata and article cards stack. The private live preview shares `ArticleView` and sanitised `Markdown` with public pages; its mobile frame is 390px with container-sensitive typography. Error summaries receive focus and link to relevant fields. Focus/scroll offsets account for the unchanged sticky site header. Portal navigation uses normal document links so unsaved-edit browser warnings remain effective.

Public navigation contains no administrator links. `/admin` uses practical internal navigation, real dashboard counts and a private preview, all protected on the server. Markdown HTML is disabled and sanitised, and image URLs are limited to this project's public editorial bucket. The owner maintains usage-specific alt text and logical heading order; automatic checks cannot establish the editorial quality of descriptions or dates.

## Tokens (existing palette)

All key colours live in `src/app/globals.css`:

| Token | Value | Role |
| --- | --- | --- |
| paper | #f8f6ef | Warm page background |
| ink | #183e36 | Headings, navigation and CTA panel |
| muted | #53655d | Body copy |
| accent | #b8432d | Coral buttons and eyebrow labels |
| accent-light | #efd5c5 | Pale coral details and dark-panel button |
| sage | #e8ede4 | Personal introduction background |
| line | #d7dcd2 | Borders and dividers |
| white | #ffffff | Article background and button text |

Georgia is the editorial heading font; Arial/Helvetica is the body and navigation stack. System fonts remove third-party requests. H1 is fluid from roughly 50 to 86px; H2 from 37 to 59px. H3 varies by section, generally 22–29px. Body is 16px, intro about 17px, with generous line height. There is one H1 and ordered section H2s; cards use H3s.

## Layout and spacing

The content width is 1200px, including 28px side padding (22px mobile). Desktop sections use 88px vertical padding and mobile 60px. Common gaps are 14, 18, 24, 30, 40 and 60px. Hero columns are balanced but slightly favour text. Starting points use numbered rows rather than photo cards; the personal section uses a sage panel; editorial previews are distinct from holiday cards.

## Components

Buttons use clear labels, 3px corners and generous padding; coral is primary, outline secondary. Hover darkens backgrounds without movement. Cards use modest 4px corners and simple typography. Holiday images are 4:3; editorial images 16:10 desktop and 16:9 mobile. The hero has one arched corner and a small decorative stamp; the image is never behind the headline. The genuine portrait slot has a branded fallback rather than a public setup placeholder.

## Responsive behaviour

CSS breakpoints: 1024px desktop navigation, 768px two-column hero/personal layouts and three-column editorial layout, 480px minimum two-column holiday grid. At narrower widths, columns stack. Mobile navigation is a disclosure with aria-expanded and aria-controls, native keyboard-accessible links, Escape to close and return focus, closure on link selection, and automatic closure when changing to desktop. It is not a modal, so normal tab order is preserved. No focus trap is needed.

## Accessibility and performance

Semantic header, nav, main, sections, articles and footer; en-GB language; visible skip link and focus outlines. Text uses high-contrast ink/muted colours against light surfaces; dark panels use pale text. Images have meaningful editable alt text. Decorative arrows and stamp text are hidden from assistive technology. Reduced-motion preferences remove image transitions. Links have actual destinations; unpublished editorial content is not interactive. Mobile controls and buttons have generous target sizes. Sticky-header anchor offsets keep section titles visible. Next.js Image handles local optimisation, responsive sizes, lazy loading and hero priority. Navigation and the enquiry form require client state; surrounding content stays server-rendered. Development robots disable indexing. No Lighthouse score is claimed without measurement.

## Phase 2 enquiry components

`src/app/enquiry.css` contains form-specific rules using the same cream/forest/terracotta/sage tokens. The page uses a white form panel and a compact sage aside; below 768px they stack. Departures use one optional text input. Traveller inputs collapse to one column below 480px; age fields use a compact two-column grid. Inputs have at least 48px height and 16px text, with visible labels. Checkbox targets are at least 44px high. Native selects/radios/checkboxes retain keyboard behaviour and use the forest accent. Long labels, errors and review text wrap; action buttons can wrap when necessary. Stage/error focus uses sticky-header offsets and focused inputs are kept below the existing navigation bar.

`Field`, `ChoiceGroup` and `descriptionIds` reuse labels, hints and error relationships. Stages have a numbered ordered progress list with aria-current=step, fieldset/legend groups and headings that receive focus on stage transitions. Error summaries use an alert, receive focus and offer links/buttons to the affected controls. Inputs expose aria-invalid and aria-describedby. Pending submission disables controls and Back to avoid accidental duplicates. The confirmation receives focus and shows a unique reference without claiming a booking or email delivery. No decorative animations are added. DOM tests check interactions and focus; real responsive visual review remains a launch check.
