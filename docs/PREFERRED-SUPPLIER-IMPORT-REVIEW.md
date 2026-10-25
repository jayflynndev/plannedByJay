# Preferred suppliers: historical research and import record

Researched 24 October 2026. **Prepared only: no hosted import, deployment, offer publication or enquiry activation.** This uses the existing supplier tables and applied migrations through `20261028_supplier_lookup.sql`; there is no new migration or lookup feature. The existing individual Add Supplier form stays available.

## Coverage and confidence

| Measure | Result |
| --- | --- |
| Workbook | `Prefered list.xlsx`, Sheet1 A2:A78: 77 populated rows, **76 distinct names**; repeated Easyjet A17 removed |
| Ready-to-review import | **76 records**, including explicit incomplete placeholders; not 76 fully verified legal profiles |
| Public identity/website established | **72**; four exact identities/domains still unresolved |
| Legal entity identified from official sources | **53**; includes website operators/sales agents where labelled, not necessarily package organisers |
| UK company cross-check | **33 supplier entries / 30 distinct companies**, all returned Active in actual account-free Companies House profile reads |
| Company/registration identifiers recorded | **38 entries**; five are foreign identifiers, not UK company numbers |
| Applicable ATOL holder/number supported by official supplier statements | **35 entries**; only qualifying flight arrangements, not blanket brand protection |
| Independently confirmed current CAA register entries | **0**: public CAA search/report pages were accessible, but no live holder-specific register result was obtained |
| ATOL not established | **41**: 24 component/distribution/platform entries and 17 other/unresolved entries; none is certified as never needing ATOL |
| Public business/contact address established | **32**; registered offices are separately private, not silently substituted |
| Public contact recorded | **44**: 33 published email addresses and 11 contact-page alternatives |
| No suitable public contact established | **32**; an absent email is not proof that none exists |

“Researched” means every name was investigated, not that every search succeeded. Official indexed extracts were used where full pages were unavailable; this is recorded per source. No authenticated trade portal, private account or paid/API-key service was used. No message was sent to test an address. Supplier-stated ATOL numbers need a current [CAA check](https://www.caa.co.uk/atol-protection/check-an-atol/search-atol-holders/) before an actual flight-inclusive advertisement; do not perform that check for ordinary non-flight components merely to complete this list.

Files:

- [research.json](../data/preferred-suppliers/research.json): all 76 original names/cells, proposed public names, fields, field-specific official source URLs, ATOL scope and exceptions. Specialisms are editorial suggestions.
- [registry-evidence.json](../data/preferred-suppliers/registry-evidence.json): the 30 small public UK company-profile results actually retrieved, with status, registered office, source URL and exact retrieval time. No bulk Companies House dataset.
- [import.sql](../data/preferred-suppliers/import.sql): self-contained owner-run preview/apply script. The JSON inside this SQL is the exact import payload. Its `lookup_record` provenance uses existing private fields. Supplier-page facts have day precision, represented as midnight UTC on the research date; registry facts have actual retrieval times.

## Decisions and exceptions Jay needs to review

These decisions are about identification or the particular contract, **not requests to reconfirm Dale's general permission or New Travel membership**. The workbook establishes network membership for all 76.

| Supplier(s) | Specific action |
| --- | --- |
| Crystal | Ask New Travel whether this is Crystal Cruises or Crystal Ski. No cruise company has been assigned to the ambiguous name. |
| Drive Away; Emirates Holidays; Teldar Corporate | Supply the current New Travel portal/domain or account terms identifying the exact supplier. Public research did not reliably establish these three identities/domains. Unrelated similar company names and third-party Emirates terms were excluded. |
| easyJet; Jet2 | Confirm whether these rows mean the holidays divisions. Keep the separate EasyJet flights row. Do not transfer a holidays ATOL to flight-only services. Current Jet2holidays terms retrieved state 9618; no remembered or alternative number was substituted. |
| P&O/Cunard | Combined workbook row is retained as one record. Choose the actual P&O Cruises or Cunard brand/carrier when advertising; do not treat it as a single product brand or permission to use both logos. |
| P&O Ferries Irish Routes; P&O Ferries Other Routes; DFDS; Stena Line | Choose the passenger carrier for the specific route from the existing agreement/route terms. Marketing companies and freight contacts are not reliable substitutes. P&O terms identify both Irish Sea and Short Sea companies. |
| Arbitrip; Expedia TAAP; G Adventures | Confirm contract role, rather than researching a new company: Arbitrip terms identify Israeli/UK entities; Expedia payment/service entities vary; G Adventures Inc. is the tour operator while G Adventures Limited is the UK disclosed agent/stated ATOL holder. Known holder numbers are retained separately from unresolved legal-name fields. |
| RIU Pro; Stuba; Teldar Travel; WebBeds; CruisingPower | These are portals/distributors/groups, not automatically organisers. Use the existing New Travel agreement for the contracting entity and the actual product's organiser. Do not merge Sunhotels into WebBeds by ownership. Official WebBeds/Jetset/CruisingPower domains were found; their current account contracts were not accessed. |
| Explora Journeys; Hurtigruten; Jetsetflights; UTC Travel | Confirm current contracting entity from the existing account terms. Explora legal text could not be fully retrieved; old HX terms are not evidence for current Hurtigruten; Jetset's older third-party-hosted terms were not imported; UTC's retrieved support email was obfuscated. |
| USAirtours | Resolve the official terms' inconsistent company spelling against the current account/ATOL record (terms quote 12850). No guessed legal-name/licence pair imported. |
| Anex Tour | Official operative terms name Travel Vogue Ltd (02857123; stated ATOL 5869), despite an ANEX TOUR LIMITED heading. Confirm that operative entity on the account agreement; use contact-page KT22 postcode, not the booking-page KT2 typo. |
| Travelpack | Companies House 09712043 currently says TRAVELPACK LIMITED; official contract PDF uses Travelpack Marketing & Leisure Services Ltd and states ATOL 2866. Confirm current licence-holder wording before advertising; both pieces of evidence are preserved. |
| Citalia; Gold Medal; Riviera Travel; Wendy Wu Tours | Older official PDFs/official subdomains were necessary for some facts. Citalia's registered office now differs from its 2024 terms; current registry office stays private. Gold Medal 2916 and Riviera 3430 were seen only in older material and withheld from imported licence pairs. Wendy Wu's official address differs from older third-party descriptions. Use the current agreement/CAA result for offers, not old brochures. |
| Neilson; Silversea; Sandals; WDTC Disneyland Paris | Keep role distinctions: Neilson Retail is agent, Neilson Active is organiser; Silversea UK represents the cruise principal; Sandals UK uses Unique Caribbean Holidays; the WDTC Paris row uses the UK Disney channel, not the direct Euro Disney channel. These are recorded, not unresolved name searches. |
| BookaBed; Bedsonline; Etihad Holidays; Sunhotels; Suntransfers | Swiss, Spanish or UAE entities/identifiers are deliberate. Do not turn them into UK Companies House numbers. BookaBed's own UK contact page names BookaBed AG in Switzerland. |
| Sunvil | Official contact heading uses `holidays@sunvil.co.uk`, while prose also says `holiday@`. Heading address retained; confirm it if using email. |
| Attraction World | Company details supported by official terms/sister-brand terms. Site terms restrict copying/monitoring; no continuing crawl or artwork copying. General marketing permission does not grant image rights. |

### ATOL gaps

No holder/number pair was established for these **17 non-component or unresolved entries**: Ambassador Cruise Line, APT, Crystal, easyJet, Emirates Holidays, Explora Journeys, Gold Medal, Hurtigruten, If Only, Jet2, Jetsetflights, MSC Cruises, Oceania Cruises, Riviera Travel, Titan Travel, USAirtours, Virgin Voyages. **Action:** only when preparing a flight-inclusive offer, use the existing agreement and current CAA result to identify its organiser/holder. No “not applicable” claim has been substituted for missing evidence.

For the **24 component/platform entries**, the record explains that standalone hotels, transfers, tickets, ferries, flights, lounges or distribution access do not inherently carry the organiser's ATOL. A package assembled with flights needs its actual organiser assessed. This is not a blanket regulatory classification of every product those suppliers sell.

### Contact gaps

No suitable public email or alternative contact page was established for these **32 entries**: Arbitrip, Attraction World, Bedsonline, Crystal, DFDS, Drive Away, easyJet, easyJet flights, Emirates Holidays, Etihad Holidays, Expedia TAAP, Explora Journeys, G Adventures, Gold Medal, Holiday Extras, Hoseasons, Jet2, Jetsetflights, National Holidays, P&O/Cunard, Princess Cruises, RIU Pro, Riviera Travel, SIXT, Stena Line, Teldar Travel, Teldar Corporate, TUI, USAirtours, Virgin Voyages, WebBeds, CruisingPower. **Action:** use an existing official public contact route or ask New Travel for the public business-contact details when that supplier is first needed. Do not copy private agent contacts into public disclosures. No suitable sales email was found for another 11 entries, but a public contact-page fallback is recorded; no further email research is needed simply to import them.

Some recorded emails are deliberately scoped: Citalia customer operations, Kuoni existing-booking support, Just Go customer services, Imagine customer support, Santa's Lapland pre-travel, Silversea guest experience, Travelpack flights and Wendy Wu operations. Do not label them all as general sales. Remaining missing business addresses are blank in the preview; registered addresses are retained privately with sources. **Before advertising a supplier**, verify its suitable public business/contact address rather than copying its registered office automatically.

## Historical import only

Jay confirms the 76 suppliers have already been imported. The original data and SQL are retained as research/audit artifacts, not a current setup procedure. Do not rerun the bulk import or complete all records. Use [the current supplier directory workflow](HOLIDAY-OFFERS-GUIDE.md) and update only a supplier you need. Legacy pending/verification fields no longer prescribe an approval workflow after the consolidated migration.
