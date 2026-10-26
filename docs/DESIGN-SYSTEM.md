# Planned by Jay design system

## Explore Holidays

The `/holidays` landing grid reuses the established 4:3 photographs, editorial cards and cream/forest/sage/terracotta tokens. A single `HolidayTypePage` template gives each guide an image/introduction, distinct planning considerations, styles, native expandable questions, optional related-reading presentation, cross-links and one final enquiry action. It has no booking widgets, promotional prices or repeated lead capture. Editable text/crops live in `src/content/holiday-types.ts`.

Use semantic H1/H2/H3 hierarchy, visible focus, native keyboard-operable question summaries and 44px link/button targets. At <=767px the hero and planning grid stack, with a 4:3 hero crop; landing cards follow existing one/two/three-column breakpoints. Three editorial style columns stack below 1024px. Reuse `SiteImage` with local assets and a labelled neutral failure state; photography never establishes accommodation availability or accessibility. Related article cards reuse the existing published-preview treatment. CSS stays scoped to `.holiday-page`; homepage layout is unchanged.

The direction combines a calm editorial layout with a friendly, practical service. Photographs complement plain, readable copy. No carousels or animation libraries.

## Public pages

The existing homepage structure and palette remain. The portrait panel shows genuine owner photography when configured, otherwise brand typography without a public setup notice. `SiteImage` retains the containing layout when a file is missing and retries a changed URL; no replacement person or unofficial logo is generated. Official artwork slots require explicit display approval and use contain sizing.

`/why-jay` reuses Container, Button, section spacing and the sage/forest panels. Its four priorities form a two-column desktop grid and a single mobile column; numbered journey steps are a semantic ordered list. Text stays centrally editable. The footer adds a compact reusable trust-information block with clear New Travel attribution; no giant legal placeholder, empty social notice or unsupported protection promise is shown. Footer links have at least 44px targets. Public main landmarks accept programmatic focus so the existing skip link moves keyboard focus as well as scrolling.


## Public content presentation

The established palette, typography, static photographs, page structures, responsive grids and portrait crops remain. `src/app/content.css` retains public article/listing/offer styling; admin/editor selectors have been removed. Empty article/offer sections are hidden on the homepage, while their public indexes show existing empty-state layouts. `ArticleView` renders server-sanitised HTML in the existing article typography. `ArticleDiscovery` and `OfferViews` retain their public layout. Article photos use the article-images bucket; existing static website photographs remain local. The Holiday Brief retains its three stages, disabled answer fields and existing CSS; stage buttons are preview navigation and cannot submit an enquiry. No replacement design or backend was introduced.
