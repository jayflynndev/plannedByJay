-- ONE-TIME DATA IMPORT, NOT A SCHEMA MIGRATION. Manual owner execution only.
-- 76 preferred workbook names; research.json is the human review/source record.
-- Default PREVIEW: no persistent writes. Change the ONE false below to true only
-- after reviewing docs/PREFERRED-SUPPLIER-IMPORT-REVIEW.md and this preview.
-- Requires existing migrations through 20261028; run as project database owner.
begin;
set local lock_timeout = '5s';
select pg_advisory_xact_lock(734021901);
lock table public.holiday_offer_suppliers, cms_private.offer_supplier_information in share row exclusive mode;
create temporary table pbj_preferred_control(apply boolean not null) on commit drop;
insert into pbj_preferred_control values (false); -- THE ONLY APPLY SWITCH
create temporary table pbj_preferred_input(item jsonb not null) on commit drop;
insert into pbj_preferred_input select value from jsonb_array_elements($pbj_data$
[
  {
    "cell": "A2",
    "aliases": [
      "AmaWaterways"
    ],
    "payload": {
      "name": "AmaWaterways",
      "display_name": "AmaWaterways",
      "website": "https://www.amawaterways.com",
      "specialism": "River cruises",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, atol_holder, atol_number, website, specialism: https://www.amawaterways.com/uk/terms-conditions/booking-sales\nbusiness_address, public_contact: https://www.amawaterways.com/uk/help/contact-us\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/10184331.json",
      "notes": "Preferred workbook A2; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "10184331",
        "registered_address": "ABBOTS PLACE SUITE A, WALNUT TREE CLOSE, GUILDFORD, UNITED KINGDOM, GU1 4RW",
        "facts": [
          {
            "field": "legal_name",
            "value": "AmaWaterways Limited",
            "source_url": "https://www.amawaterways.com/uk/terms-conditions/booking-sales",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "AmaWaterways Limited"
          },
          {
            "field": "company_number",
            "value": "10184331",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/10184331.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.549Z",
            "state": "authoritative-source",
            "entity": "AmaWaterways Limited"
          },
          {
            "field": "registered_address",
            "value": "ABBOTS PLACE SUITE A, WALNUT TREE CLOSE, GUILDFORD, UNITED KINGDOM, GU1 4RW",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/10184331.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.549Z",
            "state": "authoritative-source",
            "entity": "AmaWaterways Limited"
          },
          {
            "field": "business_address",
            "value": "Suite A, Abbots Place, Walnut Tree Close, Guildford, Surrey GU1 4RW",
            "source_url": "https://www.amawaterways.com/uk/help/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "AmaWaterways Limited"
          },
          {
            "field": "public_contact",
            "value": "amares-intl@amawaterways.com",
            "source_url": "https://www.amawaterways.com/uk/help/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "AmaWaterways Limited"
          },
          {
            "field": "atol_holder",
            "value": "AmaWaterways Limited",
            "source_url": "https://www.amawaterways.com/uk/terms-conditions/booking-sales",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "AmaWaterways Limited"
          },
          {
            "field": "atol_number",
            "value": "11232",
            "source_url": "https://www.amawaterways.com/uk/terms-conditions/booking-sales",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "AmaWaterways Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.amawaterways.com",
            "source_url": "https://www.amawaterways.com/uk/terms-conditions/booking-sales",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "AmaWaterways Limited"
          },
          {
            "field": "specialism",
            "value": "River cruises",
            "source_url": "https://www.amawaterways.com/uk/terms-conditions/booking-sales",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "AmaWaterways Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "AmaWaterways Limited",
        "business_address": "Suite A, Abbots Place, Walnut Tree Close, Guildford, Surrey GU1 4RW",
        "public_contact": "amares-intl@amawaterways.com",
        "official_website": "https://www.amawaterways.com",
        "atol_holder": "AmaWaterways Limited",
        "atol_number": "11232"
      }
    },
    "issues": []
  },
  {
    "cell": "A3",
    "aliases": [
      "Ambassador Cruise Lines",
      "Ambassador Cruise Line"
    ],
    "payload": {
      "name": "Ambassador Cruise Lines",
      "display_name": "Ambassador Cruise Line",
      "website": "https://www.ambassadorcruiseline.com",
      "specialism": "Ocean cruises",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, business_address, public_contact, website, specialism: https://www.ambassadorcruiseline.com/information/terms-conditions/\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/13299365.json",
      "notes": "Preferred workbook A3; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. ",
      "lookup_record": {
        "company_number": "13299365",
        "registered_address": "LEVEL 5A MAPLE HOUSE, 149 TOTTENHAM COURT ROAD, LONDON, UNITED KINGDOM, W1T 7NF",
        "facts": [
          {
            "field": "legal_name",
            "value": "Ambassador Cruise Holidays Limited",
            "source_url": "https://www.ambassadorcruiseline.com/information/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Ambassador Cruise Holidays Limited"
          },
          {
            "field": "company_number",
            "value": "13299365",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/13299365.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.558Z",
            "state": "authoritative-source",
            "entity": "Ambassador Cruise Holidays Limited"
          },
          {
            "field": "registered_address",
            "value": "LEVEL 5A MAPLE HOUSE, 149 TOTTENHAM COURT ROAD, LONDON, UNITED KINGDOM, W1T 7NF",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/13299365.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.558Z",
            "state": "authoritative-source",
            "entity": "Ambassador Cruise Holidays Limited"
          },
          {
            "field": "business_address",
            "value": "Gateway House, Stonehouse Lane, Purfleet, Essex RM19 1NS",
            "source_url": "https://www.ambassadorcruiseline.com/information/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Ambassador Cruise Holidays Limited"
          },
          {
            "field": "public_contact",
            "value": "sales@ambassadorcruiseline.com",
            "source_url": "https://www.ambassadorcruiseline.com/information/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Ambassador Cruise Holidays Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.ambassadorcruiseline.com",
            "source_url": "https://www.ambassadorcruiseline.com/information/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Ambassador Cruise Holidays Limited"
          },
          {
            "field": "specialism",
            "value": "Ocean cruises",
            "source_url": "https://www.ambassadorcruiseline.com/information/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Ambassador Cruise Holidays Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Ambassador Cruise Holidays Limited",
        "business_address": "Gateway House, Stonehouse Lane, Purfleet, Essex RM19 1NS",
        "public_contact": "sales@ambassadorcruiseline.com",
        "official_website": "https://www.ambassadorcruiseline.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": []
  },
  {
    "cell": "A4",
    "aliases": [
      "Anex Tour"
    ],
    "payload": {
      "name": "Anex Tour",
      "display_name": "Anex Tour",
      "website": "https://anextour.co.uk",
      "specialism": "Package holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, atol_holder, atol_number, website, specialism: https://anextour.co.uk/booking-conditions/\nregistered_address: https://anextour.co.uk/terms-of-use/\nbusiness_address, public_contact: https://anextour.co.uk/contact-us/\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/02857123.json",
      "notes": "Preferred workbook A4; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Terms heading says ANEX TOUR LIMITED but operative contract names Travel Vogue Ltd; postcode typo KT2 in booking terms differs from KT22 on contact page. Retain contract entity and contact-page postcode; confirm on supplier agreement before advertising.",
      "lookup_record": {
        "company_number": "02857123",
        "registered_address": "BRUNSWICK HOUSE REGENT PARK, 297 KINGSTON ROAD, LEATHERHEAD,, ENGLAND, KT22 7LU",
        "facts": [
          {
            "field": "legal_name",
            "value": "Travel Vogue Ltd",
            "source_url": "https://anextour.co.uk/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travel Vogue Ltd"
          },
          {
            "field": "company_number",
            "value": "02857123",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/02857123.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.564Z",
            "state": "authoritative-source",
            "entity": "Travel Vogue Ltd"
          },
          {
            "field": "registered_address",
            "value": "BRUNSWICK HOUSE REGENT PARK, 297 KINGSTON ROAD, LEATHERHEAD,, ENGLAND, KT22 7LU",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/02857123.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.564Z",
            "state": "authoritative-source",
            "entity": "Travel Vogue Ltd"
          },
          {
            "field": "business_address",
            "value": "1st Floor, Brunswick House, Regent Park, 297 Kingston Road, Leatherhead, Surrey KT22 7LU",
            "source_url": "https://anextour.co.uk/contact-us/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travel Vogue Ltd"
          },
          {
            "field": "public_contact",
            "value": "info@anextour.co.uk",
            "source_url": "https://anextour.co.uk/contact-us/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travel Vogue Ltd"
          },
          {
            "field": "atol_holder",
            "value": "Travel Vogue Ltd",
            "source_url": "https://anextour.co.uk/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travel Vogue Ltd"
          },
          {
            "field": "atol_number",
            "value": "5869",
            "source_url": "https://anextour.co.uk/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travel Vogue Ltd"
          },
          {
            "field": "official_website",
            "value": "https://anextour.co.uk",
            "source_url": "https://anextour.co.uk/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travel Vogue Ltd"
          },
          {
            "field": "specialism",
            "value": "Package holidays",
            "source_url": "https://anextour.co.uk/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Travel Vogue Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Travel Vogue Ltd",
        "business_address": "1st Floor, Brunswick House, Regent Park, 297 Kingston Road, Leatherhead, Surrey KT22 7LU",
        "public_contact": "info@anextour.co.uk",
        "official_website": "https://anextour.co.uk",
        "atol_holder": "Travel Vogue Ltd",
        "atol_number": "5869"
      }
    },
    "issues": [
      "Terms heading says ANEX TOUR LIMITED but operative contract names Travel Vogue Ltd; postcode typo KT2 in booking terms differs from KT22 on contact page. Retain contract entity and contact-page postcode; confirm on supplier agreement before advertising."
    ]
  },
  {
    "cell": "A5",
    "aliases": [
      "APT"
    ],
    "payload": {
      "name": "APT",
      "display_name": "APT",
      "website": "https://www.aptouring.com/en-gb",
      "specialism": "Escorted tours and river cruises",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, business_address, website, specialism: https://www.aptouring.com/en-gb/terms-and-conditions\npublic_contact: https://www.aptouring.com/en-gb/connect-with-us/contact-us\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/01662539.json",
      "notes": "Preferred workbook A5; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. ",
      "lookup_record": {
        "company_number": "01662539",
        "registered_address": "3RD FLOOR 52 GROSVENOR GARDENS, LONDON, UNITED KINGDOM, SW1W 0AU",
        "facts": [
          {
            "field": "legal_name",
            "value": "Australian Pacific Touring (U.K) Limited",
            "source_url": "https://www.aptouring.com/en-gb/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Australian Pacific Touring (U.K) Limited"
          },
          {
            "field": "company_number",
            "value": "01662539",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01662539.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.607Z",
            "state": "authoritative-source",
            "entity": "Australian Pacific Touring (U.K) Limited"
          },
          {
            "field": "registered_address",
            "value": "3RD FLOOR 52 GROSVENOR GARDENS, LONDON, UNITED KINGDOM, SW1W 0AU",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01662539.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.607Z",
            "state": "authoritative-source",
            "entity": "Australian Pacific Touring (U.K) Limited"
          },
          {
            "field": "business_address",
            "value": "3rd Floor, 52 Grosvenor Gardens, London SW1W 0AU",
            "source_url": "https://www.aptouring.com/en-gb/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Australian Pacific Touring (U.K) Limited"
          },
          {
            "field": "public_contact",
            "value": "Public contact page: https://www.aptouring.com/en-gb/connect-with-us/contact-us",
            "source_url": "https://www.aptouring.com/en-gb/connect-with-us/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Australian Pacific Touring (U.K) Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.aptouring.com/en-gb",
            "source_url": "https://www.aptouring.com/en-gb/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Australian Pacific Touring (U.K) Limited"
          },
          {
            "field": "specialism",
            "value": "Escorted tours and river cruises",
            "source_url": "https://www.aptouring.com/en-gb/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Australian Pacific Touring (U.K) Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Australian Pacific Touring (U.K) Limited",
        "business_address": "3rd Floor, 52 Grosvenor Gardens, London SW1W 0AU",
        "public_contact": "Public contact page: https://www.aptouring.com/en-gb/connect-with-us/contact-us",
        "official_website": "https://www.aptouring.com/en-gb",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": []
  },
  {
    "cell": "A6",
    "aliases": [
      "Arbitrip"
    ],
    "payload": {
      "name": "Arbitrip",
      "display_name": "Arbitrip",
      "website": "https://arbitrip.com",
      "specialism": "Business hotel booking platform",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism: https://arbitrip.com/about-us/\n: https://s3.amazonaws.com/arbitrip/ArbitripTermsPrivacy.pdf",
      "notes": "Preferred workbook A6; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Official terms identify Arigato Advanced Travel Technology Ltd (Israel 515225480), with some services through Arbitrip UK Limited. Confirm which entity contracts with New Travel; no single entity assigned.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "official_website",
            "value": "https://arbitrip.com",
            "source_url": "https://arbitrip.com/about-us/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Arbitrip"
          },
          {
            "field": "specialism",
            "value": "Business hotel booking platform",
            "source_url": "https://arbitrip.com/about-us/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Arbitrip"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://arbitrip.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Official terms identify Arigato Advanced Travel Technology Ltd (Israel 515225480), with some services through Arbitrip UK Limited. Confirm which entity contracts with New Travel; no single entity assigned."
    ]
  },
  {
    "cell": "A7",
    "aliases": [
      "Attraction World"
    ],
    "payload": {
      "name": "Attraction World",
      "display_name": "Attraction World",
      "website": "https://www.attractionworld.com",
      "specialism": "Attraction tickets",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, website, specialism: https://www.attractionworld.com/PDF/terms_of_use.pdf\ncompany_number, registered_address: https://www.attractiontix.co.uk/terms-and-conditions\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/05346727.json",
      "notes": "Preferred workbook A7; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Website terms restrict automated copying/monitoring. No continuing crawl or artwork reuse; company detail supported by public sister-brand booking terms.",
      "lookup_record": {
        "company_number": "05346727",
        "registered_address": "FIRST FLOOR NEW OXFORD HOUSE, WATERLOO STREET, BIRMINGHAM, UNITED KINGDOM, B2 5UG",
        "facts": [
          {
            "field": "legal_name",
            "value": "Attraction World Limited",
            "source_url": "https://www.attractionworld.com/PDF/terms_of_use.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Attraction World Limited"
          },
          {
            "field": "company_number",
            "value": "05346727",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/05346727.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.608Z",
            "state": "authoritative-source",
            "entity": "Attraction World Limited"
          },
          {
            "field": "registered_address",
            "value": "FIRST FLOOR NEW OXFORD HOUSE, WATERLOO STREET, BIRMINGHAM, UNITED KINGDOM, B2 5UG",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/05346727.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.608Z",
            "state": "authoritative-source",
            "entity": "Attraction World Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.attractionworld.com",
            "source_url": "https://www.attractionworld.com/PDF/terms_of_use.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Attraction World Limited"
          },
          {
            "field": "specialism",
            "value": "Attraction tickets",
            "source_url": "https://www.attractionworld.com/PDF/terms_of_use.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Attraction World Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Attraction World Limited",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.attractionworld.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Website terms restrict automated copying/monitoring. No continuing crawl or artwork reuse; company detail supported by public sister-brand booking terms."
    ]
  },
  {
    "cell": "A8",
    "aliases": [
      "Audley Travel"
    ],
    "payload": {
      "name": "Audley Travel",
      "display_name": "Audley Travel",
      "website": "https://www.audleytravel.com",
      "specialism": "Tailor-made travel",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, website, specialism: https://www.audleytravel.com/contact-us/offices\natol_holder, atol_number: https://www.audleytravel.com/about-us/financial-protection\npublic_contact: https://www.audleytravel.com/contact-us\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/03190720.json",
      "notes": "Preferred workbook A8; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "03190720",
        "registered_address": "NEW MILL, NEW MILL LANE, WITNEY, OXFORDSHIRE, OX29 9SX",
        "facts": [
          {
            "field": "legal_name",
            "value": "Audley Travel Group Limited",
            "source_url": "https://www.audleytravel.com/contact-us/offices",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Audley Travel Group Limited"
          },
          {
            "field": "company_number",
            "value": "03190720",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/03190720.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.663Z",
            "state": "authoritative-source",
            "entity": "Audley Travel Group Limited"
          },
          {
            "field": "registered_address",
            "value": "NEW MILL, NEW MILL LANE, WITNEY, OXFORDSHIRE, OX29 9SX",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/03190720.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.663Z",
            "state": "authoritative-source",
            "entity": "Audley Travel Group Limited"
          },
          {
            "field": "public_contact",
            "value": "Public contact page: https://www.audleytravel.com/contact-us",
            "source_url": "https://www.audleytravel.com/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Audley Travel Group Limited"
          },
          {
            "field": "atol_holder",
            "value": "Audley Travel Group Limited",
            "source_url": "https://www.audleytravel.com/about-us/financial-protection",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Audley Travel Group Limited"
          },
          {
            "field": "atol_number",
            "value": "4817",
            "source_url": "https://www.audleytravel.com/about-us/financial-protection",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Audley Travel Group Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.audleytravel.com",
            "source_url": "https://www.audleytravel.com/contact-us/offices",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Audley Travel Group Limited"
          },
          {
            "field": "specialism",
            "value": "Tailor-made travel",
            "source_url": "https://www.audleytravel.com/contact-us/offices",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Audley Travel Group Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Audley Travel Group Limited",
        "business_address": "",
        "public_contact": "Public contact page: https://www.audleytravel.com/contact-us",
        "official_website": "https://www.audleytravel.com",
        "atol_holder": "Audley Travel Group Limited",
        "atol_number": "4817"
      }
    },
    "issues": []
  },
  {
    "cell": "A9",
    "aliases": [
      "Bedsonline"
    ],
    "payload": {
      "name": "Bedsonline",
      "display_name": "Bedsonline",
      "website": "https://discover.bedsonline.com",
      "specialism": "Trade accommodation and travel components",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, website, specialism: https://discover.bedsonline.com/en-en/legal-statement",
      "notes": "Preferred workbook A9; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. ",
      "lookup_record": {
        "company_number": "B-28931681",
        "registered_address": "Complejo Mirall Balear, Cami de Son Fangos 100, Torre A, 5a Planta, 3A-4A, 07007 Palma de Mallorca, Spain",
        "facts": [
          {
            "field": "legal_name",
            "value": "BEDSONLINE, S.L.U.",
            "source_url": "https://discover.bedsonline.com/en-en/legal-statement",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "BEDSONLINE, S.L.U."
          },
          {
            "field": "company_number",
            "value": "B-28931681",
            "source_url": "https://discover.bedsonline.com/en-en/legal-statement",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "BEDSONLINE, S.L.U."
          },
          {
            "field": "registered_address",
            "value": "Complejo Mirall Balear, Cami de Son Fangos 100, Torre A, 5a Planta, 3A-4A, 07007 Palma de Mallorca, Spain",
            "source_url": "https://discover.bedsonline.com/en-en/legal-statement",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "BEDSONLINE, S.L.U."
          },
          {
            "field": "official_website",
            "value": "https://discover.bedsonline.com",
            "source_url": "https://discover.bedsonline.com/en-en/legal-statement",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "BEDSONLINE, S.L.U."
          },
          {
            "field": "specialism",
            "value": "Trade accommodation and travel components",
            "source_url": "https://discover.bedsonline.com/en-en/legal-statement",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "BEDSONLINE, S.L.U."
          }
        ]
      },
      "disclosures": {
        "legal_name": "BEDSONLINE, S.L.U.",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://discover.bedsonline.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": []
  },
  {
    "cell": "A10",
    "aliases": [
      "Bookabed",
      "BookaBed"
    ],
    "payload": {
      "name": "Bookabed",
      "display_name": "BookaBed",
      "website": "https://www.bookabed.co.uk",
      "specialism": "Trade accommodation",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, business_address, public_contact, website, specialism: https://www.bookabed.co.uk/contact-us",
      "notes": "Preferred workbook A10; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. ",
      "lookup_record": {
        "company_number": "CHE-268.565.836",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "BookaBed AG",
            "source_url": "https://www.bookabed.co.uk/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "BookaBed AG"
          },
          {
            "field": "company_number",
            "value": "CHE-268.565.836",
            "source_url": "https://www.bookabed.co.uk/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "BookaBed AG"
          },
          {
            "field": "business_address",
            "value": "Haldenstrasse 5, CH-6340 Baar, Switzerland",
            "source_url": "https://www.bookabed.co.uk/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "BookaBed AG"
          },
          {
            "field": "public_contact",
            "value": "info@bookabed.co.uk",
            "source_url": "https://www.bookabed.co.uk/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "BookaBed AG"
          },
          {
            "field": "official_website",
            "value": "https://www.bookabed.co.uk",
            "source_url": "https://www.bookabed.co.uk/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "BookaBed AG"
          },
          {
            "field": "specialism",
            "value": "Trade accommodation",
            "source_url": "https://www.bookabed.co.uk/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "BookaBed AG"
          }
        ]
      },
      "disclosures": {
        "legal_name": "BookaBed AG",
        "business_address": "Haldenstrasse 5, CH-6340 Baar, Switzerland",
        "public_contact": "info@bookabed.co.uk",
        "official_website": "https://www.bookabed.co.uk",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": []
  },
  {
    "cell": "A11",
    "aliases": [
      "Caribtours"
    ],
    "payload": {
      "name": "Caribtours",
      "display_name": "Caribtours",
      "website": "https://www.caribtours.co.uk",
      "specialism": "Luxury and Caribbean holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, atol_holder, atol_number, website, specialism: https://www.caribtours.co.uk/about-us/terms-and-conditions/\nbusiness_address: https://www.caribtours.co.uk/Contact-us\npublic_contact: https://www.caribtours.co.uk/Contact-us\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/01402297.json",
      "notes": "Preferred workbook A11; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "01402297",
        "registered_address": "126-128 NEW KINGS ROAD, LONDON, UNITED KINGDOM, SW6 4LZ",
        "facts": [
          {
            "field": "legal_name",
            "value": "Caribtours Limited",
            "source_url": "https://www.caribtours.co.uk/about-us/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Caribtours Limited"
          },
          {
            "field": "company_number",
            "value": "01402297",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01402297.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.734Z",
            "state": "authoritative-source",
            "entity": "Caribtours Limited"
          },
          {
            "field": "registered_address",
            "value": "126-128 NEW KINGS ROAD, LONDON, UNITED KINGDOM, SW6 4LZ",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01402297.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.734Z",
            "state": "authoritative-source",
            "entity": "Caribtours Limited"
          },
          {
            "field": "business_address",
            "value": "126 New Kings Road, Fulham, London SW6 4LZ",
            "source_url": "https://www.caribtours.co.uk/Contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Caribtours Limited"
          },
          {
            "field": "public_contact",
            "value": "Public contact page: https://www.caribtours.co.uk/Contact-us",
            "source_url": "https://www.caribtours.co.uk/Contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Caribtours Limited"
          },
          {
            "field": "atol_holder",
            "value": "Caribtours Limited",
            "source_url": "https://www.caribtours.co.uk/about-us/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Caribtours Limited"
          },
          {
            "field": "atol_number",
            "value": "2674",
            "source_url": "https://www.caribtours.co.uk/about-us/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Caribtours Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.caribtours.co.uk",
            "source_url": "https://www.caribtours.co.uk/about-us/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Caribtours Limited"
          },
          {
            "field": "specialism",
            "value": "Luxury and Caribbean holidays",
            "source_url": "https://www.caribtours.co.uk/about-us/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Caribtours Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Caribtours Limited",
        "business_address": "126 New Kings Road, Fulham, London SW6 4LZ",
        "public_contact": "Public contact page: https://www.caribtours.co.uk/Contact-us",
        "official_website": "https://www.caribtours.co.uk",
        "atol_holder": "Caribtours Limited",
        "atol_number": "2674"
      }
    },
    "issues": []
  },
  {
    "cell": "A12",
    "aliases": [
      "Citalia"
    ],
    "payload": {
      "name": "Citalia",
      "display_name": "Citalia",
      "website": "https://www.citalia.com",
      "specialism": "Italy holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism: https://www.citalia.com/about/faqs/\npublic_contact: https://www.citalia.com/-/media/Files/Booking-Terms-and-Conditions-2024/Citaliabookingtermsandconditions--final--20092024.pdf?hash=1E5D91FFE44FE5C80142A53E60E86A8C&rev=a105b94f5427488e860fbf4b6c4ebb55\nlegal_name, company_number, atol_holder, atol_number: https://www.citalia.com/-/media/Files/Booking-Terms-and-Conditions-2024/Citaliabookingtermsandconditions--final--14112024.pdf?hash=81CFE09FB8103690331520ACC4F08110&rev=ae004285eeda46cf940acf943031eea1\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/00446617.json",
      "notes": "Preferred workbook A12; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Official November 2024 PDF names this company and ATOL 0285. Current Companies House registered office differs from PDF Surbiton office; registered office kept private and no stale business address inferred. Public email is customer operations.",
      "lookup_record": {
        "company_number": "00446617",
        "registered_address": "4TH FLOOR, WEST POINT, SPRINGFIELD ROAD, HORSHAM, WEST SUSSEX, ENGLAND, RH12 2PD",
        "facts": [
          {
            "field": "legal_name",
            "value": "Specialist Holidays (Travel) Limited",
            "source_url": "https://www.citalia.com/-/media/Files/Booking-Terms-and-Conditions-2024/Citaliabookingtermsandconditions--final--14112024.pdf?hash=81CFE09FB8103690331520ACC4F08110&rev=ae004285eeda46cf940acf943031eea1",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Specialist Holidays (Travel) Limited"
          },
          {
            "field": "company_number",
            "value": "00446617",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00446617.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:14:09.365Z",
            "state": "authoritative-source",
            "entity": "Specialist Holidays (Travel) Limited"
          },
          {
            "field": "registered_address",
            "value": "4TH FLOOR, WEST POINT, SPRINGFIELD ROAD, HORSHAM, WEST SUSSEX, ENGLAND, RH12 2PD",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00446617.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:14:09.365Z",
            "state": "authoritative-source",
            "entity": "Specialist Holidays (Travel) Limited"
          },
          {
            "field": "public_contact",
            "value": "customeroperations@citalia.com",
            "source_url": "https://www.citalia.com/-/media/Files/Booking-Terms-and-Conditions-2024/Citaliabookingtermsandconditions--final--20092024.pdf?hash=1E5D91FFE44FE5C80142A53E60E86A8C&rev=a105b94f5427488e860fbf4b6c4ebb55",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Specialist Holidays (Travel) Limited"
          },
          {
            "field": "atol_holder",
            "value": "Specialist Holidays (Travel) Limited",
            "source_url": "https://www.citalia.com/-/media/Files/Booking-Terms-and-Conditions-2024/Citaliabookingtermsandconditions--final--14112024.pdf?hash=81CFE09FB8103690331520ACC4F08110&rev=ae004285eeda46cf940acf943031eea1",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Specialist Holidays (Travel) Limited"
          },
          {
            "field": "atol_number",
            "value": "0285",
            "source_url": "https://www.citalia.com/-/media/Files/Booking-Terms-and-Conditions-2024/Citaliabookingtermsandconditions--final--14112024.pdf?hash=81CFE09FB8103690331520ACC4F08110&rev=ae004285eeda46cf940acf943031eea1",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Specialist Holidays (Travel) Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.citalia.com",
            "source_url": "https://www.citalia.com/about/faqs/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Specialist Holidays (Travel) Limited"
          },
          {
            "field": "specialism",
            "value": "Italy holidays",
            "source_url": "https://www.citalia.com/about/faqs/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Specialist Holidays (Travel) Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Specialist Holidays (Travel) Limited",
        "business_address": "",
        "public_contact": "customeroperations@citalia.com",
        "official_website": "https://www.citalia.com",
        "atol_holder": "Specialist Holidays (Travel) Limited",
        "atol_number": "0285"
      }
    },
    "issues": [
      "Official November 2024 PDF names this company and ATOL 0285. Current Companies House registered office differs from PDF Surbiton office; registered office kept private and no stale business address inferred. Public email is customer operations."
    ]
  },
  {
    "cell": "A13",
    "aliases": [
      "Crystal"
    ],
    "payload": {
      "name": "Crystal",
      "display_name": "Crystal",
      "website": "",
      "specialism": "Cruises or ski holidays — identity unresolved",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": ": https://www.crystalcruises.com/legal/contract-uk",
      "notes": "Preferred workbook A13; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. Workbook says only Crystal. Confirm Crystal Cruises versus Crystal Ski. Cruise terms identify Crystal Cruises Ltd (Bahamas), while UK company 14275143 is not automatically the carrier. No candidate identity imported.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": []
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Workbook says only Crystal. Confirm Crystal Cruises versus Crystal Ski. Cruise terms identify Crystal Cruises Ltd (Bahamas), while UK company 14275143 is not automatically the carrier. No candidate identity imported."
    ]
  },
  {
    "cell": "A14",
    "aliases": [
      "DFDS"
    ],
    "payload": {
      "name": "DFDS",
      "display_name": "DFDS",
      "website": "https://www.dfds.com",
      "specialism": "Ferries",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism: https://www.dfds.com/en-gb/passenger-ferries",
      "notes": "Preferred workbook A14; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Passenger contracting entity depends on route. Do not use freight-company contacts or staging-site emails; confirm applicable passenger entity from current route terms.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "official_website",
            "value": "https://www.dfds.com",
            "source_url": "https://www.dfds.com/en-gb/passenger-ferries",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "DFDS"
          },
          {
            "field": "specialism",
            "value": "Ferries",
            "source_url": "https://www.dfds.com/en-gb/passenger-ferries",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "DFDS"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.dfds.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Passenger contracting entity depends on route. Do not use freight-company contacts or staging-site emails; confirm applicable passenger entity from current route terms."
    ]
  },
  {
    "cell": "A15",
    "aliases": [
      "Drive Away"
    ],
    "payload": {
      "name": "Drive Away",
      "display_name": "Drive Away",
      "website": "",
      "specialism": "Car hire — identity unresolved",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "",
      "notes": "Preferred workbook A15; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. No reliable UK supplier identity established. Confirm the Drive Away portal/domain from New Travel; unrelated Companies House name matches and Australian DriveAway are not sufficient.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": []
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "No reliable UK supplier identity established. Confirm the Drive Away portal/domain from New Travel; unrelated Companies House name matches and Australian DriveAway are not sufficient."
    ]
  },
  {
    "cell": "A16",
    "aliases": [
      "Easyjet",
      "easyJet"
    ],
    "payload": {
      "name": "Easyjet",
      "display_name": "easyJet",
      "website": "https://www.easyjet.com",
      "specialism": "Airline or holidays — division unresolved",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism: https://www.easyjet.com/en/holidays/info/booking-conditions",
      "notes": "Preferred workbook A16; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. Workbook separately lists EasyJet flights. Confirm this row means easyJet holidays before assigning easyJet holidays Limited (11927917; ATOL 11694). No holiday-company identity imported.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "official_website",
            "value": "https://www.easyjet.com",
            "source_url": "https://www.easyjet.com/en/holidays/info/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "easyJet"
          },
          {
            "field": "specialism",
            "value": "Airline or holidays — division unresolved",
            "source_url": "https://www.easyjet.com/en/holidays/info/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "easyJet"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.easyjet.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Workbook separately lists EasyJet flights. Confirm this row means easyJet holidays before assigning easyJet holidays Limited (11927917; ATOL 11694). No holiday-company identity imported."
    ]
  },
  {
    "cell": "A18",
    "aliases": [
      "EasyJet flights",
      "easyJet flights"
    ],
    "payload": {
      "name": "EasyJet flights",
      "display_name": "easyJet flights",
      "website": "https://www.easyjet.com",
      "specialism": "Flight-only airline",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, website, specialism: https://www.easyjet.com/en/holidays/info/booking-conditions\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/03034606.json",
      "notes": "Preferred workbook A18; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Airline company named in holidays terms; actual operating carrier can differ by flight. Do not apply easyJet holidays ATOL 11694 to flight-only bookings.",
      "lookup_record": {
        "company_number": "03034606",
        "registered_address": "HANGAR 89 LONDON LUTON AIRPORT, LUTON, BEDFORDSHIRE, LU2 9PF",
        "facts": [
          {
            "field": "legal_name",
            "value": "easyJet Airline Company Limited",
            "source_url": "https://www.easyjet.com/en/holidays/info/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "easyJet Airline Company Limited"
          },
          {
            "field": "company_number",
            "value": "03034606",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/03034606.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.751Z",
            "state": "authoritative-source",
            "entity": "easyJet Airline Company Limited"
          },
          {
            "field": "registered_address",
            "value": "HANGAR 89 LONDON LUTON AIRPORT, LUTON, BEDFORDSHIRE, LU2 9PF",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/03034606.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.751Z",
            "state": "authoritative-source",
            "entity": "easyJet Airline Company Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.easyjet.com",
            "source_url": "https://www.easyjet.com/en/holidays/info/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "easyJet Airline Company Limited"
          },
          {
            "field": "specialism",
            "value": "Flight-only airline",
            "source_url": "https://www.easyjet.com/en/holidays/info/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "easyJet Airline Company Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "easyJet Airline Company Limited",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.easyjet.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Airline company named in holidays terms; actual operating carrier can differ by flight. Do not apply easyJet holidays ATOL 11694 to flight-only bookings."
    ]
  },
  {
    "cell": "A19",
    "aliases": [
      "Emirates Holidays"
    ],
    "payload": {
      "name": "Emirates Holidays",
      "display_name": "Emirates Holidays",
      "website": "",
      "specialism": "Airline holidays — UK contract entity unresolved",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "",
      "notes": "Preferred workbook A19; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. Could not establish current UK contract entity from accessible official evidence. Third-party dnata terms not imported. Confirm current official UK booking conditions/domain via New Travel.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": []
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Could not establish current UK contract entity from accessible official evidence. Third-party dnata terms not imported. Confirm current official UK booking conditions/domain via New Travel."
    ]
  },
  {
    "cell": "A20",
    "aliases": [
      "Ethiad Holidays",
      "Etihad Holidays"
    ],
    "payload": {
      "name": "Ethiad Holidays",
      "display_name": "Etihad Holidays",
      "website": "https://www.etihadholidays.co.uk",
      "specialism": "Flight-inclusive holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, business_address, atol_holder, atol_number, website, specialism: https://www.etihadholidays.co.uk/terms-and-conditions/",
      "notes": "Preferred workbook A20; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Company identifier is an Abu Dhabi commercial licence, not a UK Companies House number; original workbook spelling Ethiad retained privately.",
      "lookup_record": {
        "company_number": "2243312",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "Capital Holidays (International) Sole Proprietorship L.L.C",
            "source_url": "https://www.etihadholidays.co.uk/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Capital Holidays (International) Sole Proprietorship L.L.C"
          },
          {
            "field": "company_number",
            "value": "2243312",
            "source_url": "https://www.etihadholidays.co.uk/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Capital Holidays (International) Sole Proprietorship L.L.C"
          },
          {
            "field": "business_address",
            "value": "Abu Dhabi National Exhibition Centre, Khaleej Al Arabi Street, PO Box 5546, Abu Dhabi, UAE",
            "source_url": "https://www.etihadholidays.co.uk/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Capital Holidays (International) Sole Proprietorship L.L.C"
          },
          {
            "field": "atol_holder",
            "value": "Capital Holidays (International) Sole Proprietorship L.L.C",
            "source_url": "https://www.etihadholidays.co.uk/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Capital Holidays (International) Sole Proprietorship L.L.C"
          },
          {
            "field": "atol_number",
            "value": "11125",
            "source_url": "https://www.etihadholidays.co.uk/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Capital Holidays (International) Sole Proprietorship L.L.C"
          },
          {
            "field": "official_website",
            "value": "https://www.etihadholidays.co.uk",
            "source_url": "https://www.etihadholidays.co.uk/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Capital Holidays (International) Sole Proprietorship L.L.C"
          },
          {
            "field": "specialism",
            "value": "Flight-inclusive holidays",
            "source_url": "https://www.etihadholidays.co.uk/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Capital Holidays (International) Sole Proprietorship L.L.C"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Capital Holidays (International) Sole Proprietorship L.L.C",
        "business_address": "Abu Dhabi National Exhibition Centre, Khaleej Al Arabi Street, PO Box 5546, Abu Dhabi, UAE",
        "public_contact": "",
        "official_website": "https://www.etihadholidays.co.uk",
        "atol_holder": "Capital Holidays (International) Sole Proprietorship L.L.C",
        "atol_number": "11125"
      }
    },
    "issues": [
      "Company identifier is an Abu Dhabi commercial licence, not a UK Companies House number; original workbook spelling Ethiad retained privately."
    ]
  },
  {
    "cell": "A21",
    "aliases": [
      "ExpediaTaap",
      "Expedia TAAP"
    ],
    "payload": {
      "name": "ExpediaTaap",
      "display_name": "Expedia TAAP",
      "website": "https://www.expediataap.co.uk",
      "specialism": "Travel-agent booking programme",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism, atol_holder, atol_number: https://www.expediataap.co.uk/",
      "notes": "Preferred workbook A21; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Official UK TAAP states Expedia, Inc. ATOL 5788 for qualifying packages. Payment/service entities vary; consumer Expedia terms are not proof of the New Travel TAAP contracting entity. Legal-name field withheld.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "atol_holder",
            "value": "Expedia, Inc.",
            "source_url": "https://www.expediataap.co.uk/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Expedia, Inc."
          },
          {
            "field": "atol_number",
            "value": "5788",
            "source_url": "https://www.expediataap.co.uk/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Expedia, Inc."
          },
          {
            "field": "official_website",
            "value": "https://www.expediataap.co.uk",
            "source_url": "https://www.expediataap.co.uk/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Expedia TAAP"
          },
          {
            "field": "specialism",
            "value": "Travel-agent booking programme",
            "source_url": "https://www.expediataap.co.uk/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Expedia TAAP"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.expediataap.co.uk",
        "atol_holder": "Expedia, Inc.",
        "atol_number": "5788"
      }
    },
    "issues": [
      "Official UK TAAP states Expedia, Inc. ATOL 5788 for qualifying packages. Payment/service entities vary; consumer Expedia terms are not proof of the New Travel TAAP contracting entity. Legal-name field withheld."
    ]
  },
  {
    "cell": "A22",
    "aliases": [
      "Explora Journeys"
    ],
    "payload": {
      "name": "Explora Journeys",
      "display_name": "Explora Journeys",
      "website": "https://explorajourneys.com",
      "specialism": "Luxury ocean cruises",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism: https://explorajourneys.com/uk/en/legal/booking-terms-and-conditions",
      "notes": "Preferred workbook A22; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. UK terms page identified but full legal text inaccessible to research tool. Confirm exact carrier/organiser and any flight-package licence; do not inherit MSC ATOL by group association.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "official_website",
            "value": "https://explorajourneys.com",
            "source_url": "https://explorajourneys.com/uk/en/legal/booking-terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Explora Journeys"
          },
          {
            "field": "specialism",
            "value": "Luxury ocean cruises",
            "source_url": "https://explorajourneys.com/uk/en/legal/booking-terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Explora Journeys"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://explorajourneys.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "UK terms page identified but full legal text inaccessible to research tool. Confirm exact carrier/organiser and any flight-package licence; do not inherit MSC ATOL by group association."
    ]
  },
  {
    "cell": "A23",
    "aliases": [
      "Faremine"
    ],
    "payload": {
      "name": "Faremine",
      "display_name": "Faremine",
      "website": "https://faremine.com",
      "specialism": "Trade flights and holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, business_address, atol_holder, atol_number, website, specialism: https://faremine.com/contact/\npublic_contact: https://faremine.com/contact/\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/01526617.json",
      "notes": "Preferred workbook A23; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "01526617",
        "registered_address": "42-44 HIGH STREET, NORTHWOOD, ENGLAND, HA6 1BL",
        "facts": [
          {
            "field": "legal_name",
            "value": "Gazelle Travel Limited",
            "source_url": "https://faremine.com/contact/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Gazelle Travel Limited"
          },
          {
            "field": "company_number",
            "value": "01526617",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01526617.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.733Z",
            "state": "authoritative-source",
            "entity": "Gazelle Travel Limited"
          },
          {
            "field": "registered_address",
            "value": "42-44 HIGH STREET, NORTHWOOD, ENGLAND, HA6 1BL",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01526617.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.733Z",
            "state": "authoritative-source",
            "entity": "Gazelle Travel Limited"
          },
          {
            "field": "business_address",
            "value": "42-44 High Street, Northwood, Middlesex HA6 1BL",
            "source_url": "https://faremine.com/contact/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Gazelle Travel Limited"
          },
          {
            "field": "public_contact",
            "value": "reservations@faremine.com",
            "source_url": "https://faremine.com/contact/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Gazelle Travel Limited"
          },
          {
            "field": "atol_holder",
            "value": "Gazelle Travel Limited",
            "source_url": "https://faremine.com/contact/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Gazelle Travel Limited"
          },
          {
            "field": "atol_number",
            "value": "4067",
            "source_url": "https://faremine.com/contact/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Gazelle Travel Limited"
          },
          {
            "field": "official_website",
            "value": "https://faremine.com",
            "source_url": "https://faremine.com/contact/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Gazelle Travel Limited"
          },
          {
            "field": "specialism",
            "value": "Trade flights and holidays",
            "source_url": "https://faremine.com/contact/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Gazelle Travel Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Gazelle Travel Limited",
        "business_address": "42-44 High Street, Northwood, Middlesex HA6 1BL",
        "public_contact": "reservations@faremine.com",
        "official_website": "https://faremine.com",
        "atol_holder": "Gazelle Travel Limited",
        "atol_number": "4067"
      }
    },
    "issues": []
  },
  {
    "cell": "A24",
    "aliases": [
      "Flexible Autos"
    ],
    "payload": {
      "name": "Flexible Autos",
      "display_name": "Flexible Autos",
      "website": "https://www.flexibleautos.com",
      "specialism": "Trade car hire",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, public_contact, website, specialism: https://www.flexibleautos.com/tier4_uk/Default.aspx\nbusiness_address: https://www.flexiblecarhire.com/",
      "notes": "Preferred workbook A24; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Do not confuse with unrelated Flexautos Ltd / flexautos.co.uk.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "Flexiblecarhire.com Ltd",
            "source_url": "https://www.flexibleautos.com/tier4_uk/Default.aspx",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Flexiblecarhire.com Ltd"
          },
          {
            "field": "business_address",
            "value": "Suite 6, Hoddesdon Enterprise Centre, Pindar Road, Hoddesdon, Hertfordshire EN11 0FJ",
            "source_url": "https://www.flexiblecarhire.com/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Flexiblecarhire.com Ltd"
          },
          {
            "field": "public_contact",
            "value": "reservations@flexibleautos.com",
            "source_url": "https://www.flexibleautos.com/tier4_uk/Default.aspx",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Flexiblecarhire.com Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.flexibleautos.com",
            "source_url": "https://www.flexibleautos.com/tier4_uk/Default.aspx",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Flexiblecarhire.com Ltd"
          },
          {
            "field": "specialism",
            "value": "Trade car hire",
            "source_url": "https://www.flexibleautos.com/tier4_uk/Default.aspx",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Flexiblecarhire.com Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Flexiblecarhire.com Ltd",
        "business_address": "Suite 6, Hoddesdon Enterprise Centre, Pindar Road, Hoddesdon, Hertfordshire EN11 0FJ",
        "public_contact": "reservations@flexibleautos.com",
        "official_website": "https://www.flexibleautos.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Do not confuse with unrelated Flexautos Ltd / flexautos.co.uk."
    ]
  },
  {
    "cell": "A25",
    "aliases": [
      "G-Adventures",
      "G Adventures"
    ],
    "payload": {
      "name": "G-Adventures",
      "display_name": "G Adventures",
      "website": "https://www.gadventures.com",
      "specialism": "Small-group adventure tours",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism, atol_holder, atol_number: https://www.gadventures.com/terms-conditions/booking-terms/uk-booking-terms/",
      "notes": "Preferred workbook A25; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Tour operator is G Adventures Inc. (Barbados); G Adventures Limited may act as UK disclosed agent and holds stated ATOL 10808. Choose actual contracting entity from confirmation, not one blanket legal-name field.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "atol_holder",
            "value": "G Adventures Limited",
            "source_url": "https://www.gadventures.com/terms-conditions/booking-terms/uk-booking-terms/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "G Adventures Limited"
          },
          {
            "field": "atol_number",
            "value": "10808",
            "source_url": "https://www.gadventures.com/terms-conditions/booking-terms/uk-booking-terms/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "G Adventures Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.gadventures.com",
            "source_url": "https://www.gadventures.com/terms-conditions/booking-terms/uk-booking-terms/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "G Adventures"
          },
          {
            "field": "specialism",
            "value": "Small-group adventure tours",
            "source_url": "https://www.gadventures.com/terms-conditions/booking-terms/uk-booking-terms/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "G Adventures"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.gadventures.com",
        "atol_holder": "G Adventures Limited",
        "atol_number": "10808"
      }
    },
    "issues": [
      "Tour operator is G Adventures Inc. (Barbados); G Adventures Limited may act as UK disclosed agent and holds stated ATOL 10808. Choose actual contracting entity from confirmation, not one blanket legal-name field."
    ]
  },
  {
    "cell": "A26",
    "aliases": [
      "Globus"
    ],
    "payload": {
      "name": "Globus",
      "display_name": "Globus",
      "website": "https://www.globusjourneys.co.uk",
      "specialism": "Escorted tours",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, atol_holder, atol_number, website, specialism: https://www.globusjourneys.co.uk/terms/\nbusiness_address: https://www.globusjourneys.co.uk/contact/\npublic_contact: https://www.globusjourneys.co.uk/contact/",
      "notes": "Preferred workbook A26; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "Cosmos Tours Limited",
            "source_url": "https://www.globusjourneys.co.uk/terms/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Cosmos Tours Limited"
          },
          {
            "field": "business_address",
            "value": "Fourth Floor, Gateway House, 28 The Quadrant, Richmond, Surrey TW9 1DN",
            "source_url": "https://www.globusjourneys.co.uk/contact/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Cosmos Tours Limited"
          },
          {
            "field": "public_contact",
            "value": "Public contact page: https://www.globusjourneys.co.uk/contact/",
            "source_url": "https://www.globusjourneys.co.uk/contact/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Cosmos Tours Limited"
          },
          {
            "field": "atol_holder",
            "value": "Cosmos Tours Limited",
            "source_url": "https://www.globusjourneys.co.uk/terms/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Cosmos Tours Limited"
          },
          {
            "field": "atol_number",
            "value": "1082",
            "source_url": "https://www.globusjourneys.co.uk/terms/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Cosmos Tours Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.globusjourneys.co.uk",
            "source_url": "https://www.globusjourneys.co.uk/terms/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Cosmos Tours Limited"
          },
          {
            "field": "specialism",
            "value": "Escorted tours",
            "source_url": "https://www.globusjourneys.co.uk/terms/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Cosmos Tours Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Cosmos Tours Limited",
        "business_address": "Fourth Floor, Gateway House, 28 The Quadrant, Richmond, Surrey TW9 1DN",
        "public_contact": "Public contact page: https://www.globusjourneys.co.uk/contact/",
        "official_website": "https://www.globusjourneys.co.uk",
        "atol_holder": "Cosmos Tours Limited",
        "atol_number": "1082"
      }
    },
    "issues": []
  },
  {
    "cell": "A27",
    "aliases": [
      "Goldmedal",
      "Gold Medal"
    ],
    "payload": {
      "name": "Goldmedal",
      "display_name": "Gold Medal",
      "website": "https://www.goldmedal.co.uk",
      "specialism": "Trade tailor-made holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, business_address, website, specialism: https://media.goldmedal.co.uk/media/ahgppnas/gm-booking-conditions-essential-information-nov-25.pdf\n: https://media.goldmedal.co.uk/media/0ukdvcr4/gm-booking-conditions-essential-information-mar-2024.pdf\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/01376076.json",
      "notes": "Preferred workbook A27; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. Official March 2024 terms state ATOL 2916. Current November 2025 terms identified entity/address but licence not reconfirmed in retrieved text; pair withheld pending current check.",
      "lookup_record": {
        "company_number": "01376076",
        "registered_address": "LANCASTER HOUSE, CENTURION WAY, LEYLAND, ENGLAND, PR26 6TX",
        "facts": [
          {
            "field": "legal_name",
            "value": "Gold Medal Travel Group Limited",
            "source_url": "https://media.goldmedal.co.uk/media/ahgppnas/gm-booking-conditions-essential-information-nov-25.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Gold Medal Travel Group Limited"
          },
          {
            "field": "company_number",
            "value": "01376076",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01376076.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.869Z",
            "state": "authoritative-source",
            "entity": "Gold Medal Travel Group Limited"
          },
          {
            "field": "registered_address",
            "value": "LANCASTER HOUSE, CENTURION WAY, LEYLAND, ENGLAND, PR26 6TX",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01376076.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.869Z",
            "state": "authoritative-source",
            "entity": "Gold Medal Travel Group Limited"
          },
          {
            "field": "business_address",
            "value": "Lancaster House, Centurion Way, Leyland, Lancashire PR26 6TX",
            "source_url": "https://media.goldmedal.co.uk/media/ahgppnas/gm-booking-conditions-essential-information-nov-25.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Gold Medal Travel Group Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.goldmedal.co.uk",
            "source_url": "https://media.goldmedal.co.uk/media/ahgppnas/gm-booking-conditions-essential-information-nov-25.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Gold Medal Travel Group Limited"
          },
          {
            "field": "specialism",
            "value": "Trade tailor-made holidays",
            "source_url": "https://media.goldmedal.co.uk/media/ahgppnas/gm-booking-conditions-essential-information-nov-25.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Gold Medal Travel Group Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Gold Medal Travel Group Limited",
        "business_address": "Lancaster House, Centurion Way, Leyland, Lancashire PR26 6TX",
        "public_contact": "",
        "official_website": "https://www.goldmedal.co.uk",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Official March 2024 terms state ATOL 2916. Current November 2025 terms identified entity/address but licence not reconfirmed in retrieved text; pair withheld pending current check."
    ]
  },
  {
    "cell": "A28",
    "aliases": [
      "Holiday Extras"
    ],
    "payload": {
      "name": "Holiday Extras",
      "display_name": "Holiday Extras",
      "website": "https://www.holidayextras.com",
      "specialism": "Airport parking, hotels and travel extras",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, website, specialism: https://www.holidayextras.com/about-us/company-information.html\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/01693250.json",
      "notes": "Preferred workbook A28; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Holiday Extras Cover Limited is a separate insurance entity; do not substitute its company or regulatory details.",
      "lookup_record": {
        "company_number": "01693250",
        "registered_address": "ASHFORD ROAD, NEWINGREEN, HYTHE, KENT, CT21 4JF",
        "facts": [
          {
            "field": "legal_name",
            "value": "Holiday Extras Limited",
            "source_url": "https://www.holidayextras.com/about-us/company-information.html",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Holiday Extras Limited"
          },
          {
            "field": "company_number",
            "value": "01693250",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01693250.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.870Z",
            "state": "authoritative-source",
            "entity": "Holiday Extras Limited"
          },
          {
            "field": "registered_address",
            "value": "ASHFORD ROAD, NEWINGREEN, HYTHE, KENT, CT21 4JF",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01693250.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.870Z",
            "state": "authoritative-source",
            "entity": "Holiday Extras Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.holidayextras.com",
            "source_url": "https://www.holidayextras.com/about-us/company-information.html",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Holiday Extras Limited"
          },
          {
            "field": "specialism",
            "value": "Airport parking, hotels and travel extras",
            "source_url": "https://www.holidayextras.com/about-us/company-information.html",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Holiday Extras Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Holiday Extras Limited",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.holidayextras.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Holiday Extras Cover Limited is a separate insurance entity; do not substitute its company or regulatory details."
    ]
  },
  {
    "cell": "A29",
    "aliases": [
      "Hoseasosns",
      "Hoseasons"
    ],
    "payload": {
      "name": "Hoseasosns",
      "display_name": "Hoseasons",
      "website": "https://www.hoseasons.co.uk",
      "specialism": "UK accommodation",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, website, specialism: https://www.hoseasons.co.uk/legal/terms-of-use",
      "notes": "Preferred workbook A29; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Terms of use identify website operator; actual accommodation contract/provider must be checked for the specific product.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "Awaze Vacation Rentals Ltd",
            "source_url": "https://www.hoseasons.co.uk/legal/terms-of-use",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Awaze Vacation Rentals Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.hoseasons.co.uk",
            "source_url": "https://www.hoseasons.co.uk/legal/terms-of-use",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Awaze Vacation Rentals Ltd"
          },
          {
            "field": "specialism",
            "value": "UK accommodation",
            "source_url": "https://www.hoseasons.co.uk/legal/terms-of-use",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Awaze Vacation Rentals Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Awaze Vacation Rentals Ltd",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.hoseasons.co.uk",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Terms of use identify website operator; actual accommodation contract/provider must be checked for the specific product."
    ]
  },
  {
    "cell": "A30",
    "aliases": [
      "Hurtigruten"
    ],
    "payload": {
      "name": "Hurtigruten",
      "display_name": "Hurtigruten",
      "website": "https://www.hurtigruten.com/en-gb",
      "specialism": "Norwegian coastal cruising",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "public_contact, website, specialism: https://www.hurtigruten.com/en-gb/help/contact",
      "notes": "Preferred workbook A30; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. Do not confuse Hurtigruten with HX. Current UK contracting entity and applicable flight-package licence not established.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "public_contact",
            "value": "uk.sales@hurtigruten.com",
            "source_url": "https://www.hurtigruten.com/en-gb/help/contact",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hurtigruten"
          },
          {
            "field": "official_website",
            "value": "https://www.hurtigruten.com/en-gb",
            "source_url": "https://www.hurtigruten.com/en-gb/help/contact",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hurtigruten"
          },
          {
            "field": "specialism",
            "value": "Norwegian coastal cruising",
            "source_url": "https://www.hurtigruten.com/en-gb/help/contact",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Hurtigruten"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "uk.sales@hurtigruten.com",
        "official_website": "https://www.hurtigruten.com/en-gb",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Do not confuse Hurtigruten with HX. Current UK contracting entity and applicable flight-package licence not established."
    ]
  },
  {
    "cell": "A31",
    "aliases": [
      "If Only"
    ],
    "payload": {
      "name": "If Only",
      "display_name": "If Only",
      "website": "https://www.ifonly.net",
      "specialism": "Luxury tailor-made holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, business_address, public_contact, website, specialism: https://www.ifonlyholidays.com/documents/bookingconditions.pdf\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/SC268032.json",
      "notes": "Preferred workbook A31; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. ",
      "lookup_record": {
        "company_number": "SC268032",
        "registered_address": "ABBEY HOUSE 2ND FLOOR, 10 BOTHWELL STREET, GLASGOW, SCOTLAND, G2 6LU",
        "facts": [
          {
            "field": "legal_name",
            "value": "If Only Holidays Ltd",
            "source_url": "https://www.ifonlyholidays.com/documents/bookingconditions.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "If Only Holidays Ltd"
          },
          {
            "field": "company_number",
            "value": "SC268032",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/SC268032.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.869Z",
            "state": "authoritative-source",
            "entity": "If Only Holidays Ltd"
          },
          {
            "field": "registered_address",
            "value": "ABBEY HOUSE 2ND FLOOR, 10 BOTHWELL STREET, GLASGOW, SCOTLAND, G2 6LU",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/SC268032.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.869Z",
            "state": "authoritative-source",
            "entity": "If Only Holidays Ltd"
          },
          {
            "field": "business_address",
            "value": "10 Bothwell Street, Glasgow G2 6LU",
            "source_url": "https://www.ifonlyholidays.com/documents/bookingconditions.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "If Only Holidays Ltd"
          },
          {
            "field": "public_contact",
            "value": "info@ifonly.net",
            "source_url": "https://www.ifonlyholidays.com/documents/bookingconditions.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "If Only Holidays Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.ifonly.net",
            "source_url": "https://www.ifonlyholidays.com/documents/bookingconditions.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "If Only Holidays Ltd"
          },
          {
            "field": "specialism",
            "value": "Luxury tailor-made holidays",
            "source_url": "https://www.ifonlyholidays.com/documents/bookingconditions.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "If Only Holidays Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "If Only Holidays Ltd",
        "business_address": "10 Bothwell Street, Glasgow G2 6LU",
        "public_contact": "info@ifonly.net",
        "official_website": "https://www.ifonly.net",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": []
  },
  {
    "cell": "A32",
    "aliases": [
      "Imagine Cruises",
      "Imagine Cruising"
    ],
    "payload": {
      "name": "Imagine Cruises",
      "display_name": "Imagine Cruising",
      "website": "https://www.imaginecruising.co.uk",
      "specialism": "Cruise and stay packages",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, business_address, website, specialism: https://www.imaginecruising.co.uk/terms-conditions/\npublic_contact: https://www.imaginecruising.co.uk/contact-us\natol_holder, atol_number: https://www.imaginecruising.co.uk/terms-conditions/\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/06803008.json",
      "notes": "Preferred workbook A32; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "06803008",
        "registered_address": "2ND FLOOR NUCLEUS HOUSE, 2 LOWER MORTLAKE ROAD, RICHMOND, UNITED KINGDOM, TW9 2JA",
        "facts": [
          {
            "field": "legal_name",
            "value": "Imagine Cruising Limited",
            "source_url": "https://www.imaginecruising.co.uk/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Imagine Cruising Limited"
          },
          {
            "field": "company_number",
            "value": "06803008",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/06803008.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.915Z",
            "state": "authoritative-source",
            "entity": "Imagine Cruising Limited"
          },
          {
            "field": "registered_address",
            "value": "2ND FLOOR NUCLEUS HOUSE, 2 LOWER MORTLAKE ROAD, RICHMOND, UNITED KINGDOM, TW9 2JA",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/06803008.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.915Z",
            "state": "authoritative-source",
            "entity": "Imagine Cruising Limited"
          },
          {
            "field": "business_address",
            "value": "2nd Floor, Nucleus House, 2 Lower Mortlake Road, Richmond TW9 2JA",
            "source_url": "https://www.imaginecruising.co.uk/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Imagine Cruising Limited"
          },
          {
            "field": "public_contact",
            "value": "customersupport@imaginecruising.co.uk",
            "source_url": "https://www.imaginecruising.co.uk/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Imagine Cruising Limited"
          },
          {
            "field": "atol_holder",
            "value": "Imagine Cruising Limited",
            "source_url": "https://www.imaginecruising.co.uk/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Imagine Cruising Limited"
          },
          {
            "field": "atol_number",
            "value": "11078",
            "source_url": "https://www.imaginecruising.co.uk/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Imagine Cruising Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.imaginecruising.co.uk",
            "source_url": "https://www.imaginecruising.co.uk/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Imagine Cruising Limited"
          },
          {
            "field": "specialism",
            "value": "Cruise and stay packages",
            "source_url": "https://www.imaginecruising.co.uk/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Imagine Cruising Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Imagine Cruising Limited",
        "business_address": "2nd Floor, Nucleus House, 2 Lower Mortlake Road, Richmond TW9 2JA",
        "public_contact": "customersupport@imaginecruising.co.uk",
        "official_website": "https://www.imaginecruising.co.uk",
        "atol_holder": "Imagine Cruising Limited",
        "atol_number": "11078"
      }
    },
    "issues": []
  },
  {
    "cell": "A33",
    "aliases": [
      "Inghams"
    ],
    "payload": {
      "name": "Inghams",
      "display_name": "Inghams",
      "website": "https://www.inghams.co.uk",
      "specialism": "Ski and walking holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, atol_holder, atol_number, website, specialism: https://www.inghams.co.uk/legal/terms-conditions/booking-conditions\npublic_contact: https://www.inghams.co.uk/contact-us\ncompany_number, business_address: https://www.inghams.co.uk/legal/terms-conditions/booking-conditions\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/00350786.json",
      "notes": "Preferred workbook A33; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "00350786",
        "registered_address": "NELSON HOUSE, 55-59 VICTORIA ROAD, FARNBOROUGH, ENGLAND, GU14 7PA",
        "facts": [
          {
            "field": "legal_name",
            "value": "Hotelplan Limited",
            "source_url": "https://www.inghams.co.uk/legal/terms-conditions/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Limited"
          },
          {
            "field": "company_number",
            "value": "00350786",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00350786.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.067Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Limited"
          },
          {
            "field": "registered_address",
            "value": "NELSON HOUSE, 55-59 VICTORIA ROAD, FARNBOROUGH, ENGLAND, GU14 7PA",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00350786.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.067Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Limited"
          },
          {
            "field": "business_address",
            "value": "Nelson House, 55-59 Victoria Road, Farnborough, Hampshire GU14 7PA",
            "source_url": "https://www.inghams.co.uk/legal/terms-conditions/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Limited"
          },
          {
            "field": "public_contact",
            "value": "enquiries@inghams.co.uk",
            "source_url": "https://www.inghams.co.uk/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Limited"
          },
          {
            "field": "atol_holder",
            "value": "Hotelplan Limited",
            "source_url": "https://www.inghams.co.uk/legal/terms-conditions/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Limited"
          },
          {
            "field": "atol_number",
            "value": "0025",
            "source_url": "https://www.inghams.co.uk/legal/terms-conditions/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.inghams.co.uk",
            "source_url": "https://www.inghams.co.uk/legal/terms-conditions/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Limited"
          },
          {
            "field": "specialism",
            "value": "Ski and walking holidays",
            "source_url": "https://www.inghams.co.uk/legal/terms-conditions/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Hotelplan Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Hotelplan Limited",
        "business_address": "Nelson House, 55-59 Victoria Road, Farnborough, Hampshire GU14 7PA",
        "public_contact": "enquiries@inghams.co.uk",
        "official_website": "https://www.inghams.co.uk",
        "atol_holder": "Hotelplan Limited",
        "atol_number": "0025"
      }
    },
    "issues": []
  },
  {
    "cell": "A34",
    "aliases": [
      "Jet2"
    ],
    "payload": {
      "name": "Jet2",
      "display_name": "Jet2",
      "website": "https://www.jet2holidays.com",
      "specialism": "Airline or package holidays — division unresolved",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism: https://www.jet2holidays.com/en/terms-and-conditions",
      "notes": "Preferred workbook A34; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. Workbook says Jet2, not Jet2holidays. Official holidays terms currently state ATOL 9618; do not substitute remembered numbers or apply holidays licence to Jet2.com flights. Confirm intended division before assigning entity/licence.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "official_website",
            "value": "https://www.jet2holidays.com",
            "source_url": "https://www.jet2holidays.com/en/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Jet2"
          },
          {
            "field": "specialism",
            "value": "Airline or package holidays — division unresolved",
            "source_url": "https://www.jet2holidays.com/en/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Jet2"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.jet2holidays.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Workbook says Jet2, not Jet2holidays. Official holidays terms currently state ATOL 9618; do not substitute remembered numbers or apply holidays licence to Jet2.com flights. Confirm intended division before assigning entity/licence."
    ]
  },
  {
    "cell": "A35",
    "aliases": [
      "Jetsetflights"
    ],
    "payload": {
      "name": "Jetsetflights",
      "display_name": "Jetsetflights",
      "website": "https://jetsetholidays.co.uk",
      "specialism": "Trade flights and tailor-made holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism: https://jetsetholidays.co.uk/",
      "notes": "Preferred workbook A35; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. Official Jetset Flights portal identified. Current terms are not exposed in retrieved page. Third-party hosted 2023 document names Cresta World Travel Limited (02662445), ATOL 3200; current legal/licence pair not imported. Check current account terms via existing New Travel access.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "official_website",
            "value": "https://jetsetholidays.co.uk",
            "source_url": "https://jetsetholidays.co.uk/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Jetsetflights"
          },
          {
            "field": "specialism",
            "value": "Trade flights and tailor-made holidays",
            "source_url": "https://jetsetholidays.co.uk/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Jetsetflights"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://jetsetholidays.co.uk",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Official Jetset Flights portal identified. Current terms are not exposed in retrieved page. Third-party hosted 2023 document names Cresta World Travel Limited (02662445), ATOL 3200; current legal/licence pair not imported. Check current account terms via existing New Travel access."
    ]
  },
  {
    "cell": "A36",
    "aliases": [
      "JTA",
      "JTA Travel"
    ],
    "payload": {
      "name": "JTA",
      "display_name": "JTA Travel",
      "website": "https://www.jtaholidays.co.uk",
      "specialism": "Trade flights and packages",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, business_address, public_contact, atol_holder, atol_number, website, specialism: https://www.jtaholidays.co.uk/pages/terms",
      "notes": "Preferred workbook A36; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "Alfendo Ltd",
            "source_url": "https://www.jtaholidays.co.uk/pages/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Alfendo Ltd"
          },
          {
            "field": "business_address",
            "value": "2210 The Crescent, Birmingham Business Park, Birmingham B37 7YE",
            "source_url": "https://www.jtaholidays.co.uk/pages/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Alfendo Ltd"
          },
          {
            "field": "public_contact",
            "value": "info@jtatravel.co.uk",
            "source_url": "https://www.jtaholidays.co.uk/pages/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Alfendo Ltd"
          },
          {
            "field": "atol_holder",
            "value": "Alfendo Ltd",
            "source_url": "https://www.jtaholidays.co.uk/pages/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Alfendo Ltd"
          },
          {
            "field": "atol_number",
            "value": "4110",
            "source_url": "https://www.jtaholidays.co.uk/pages/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Alfendo Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.jtaholidays.co.uk",
            "source_url": "https://www.jtaholidays.co.uk/pages/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Alfendo Ltd"
          },
          {
            "field": "specialism",
            "value": "Trade flights and packages",
            "source_url": "https://www.jtaholidays.co.uk/pages/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Alfendo Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Alfendo Ltd",
        "business_address": "2210 The Crescent, Birmingham Business Park, Birmingham B37 7YE",
        "public_contact": "info@jtatravel.co.uk",
        "official_website": "https://www.jtaholidays.co.uk",
        "atol_holder": "Alfendo Ltd",
        "atol_number": "4110"
      }
    },
    "issues": []
  },
  {
    "cell": "A37",
    "aliases": [
      "Just Go Holidays"
    ],
    "payload": {
      "name": "Just Go Holidays",
      "display_name": "Just Go Holidays",
      "website": "https://www.justgoholidays.com",
      "specialism": "Coach and escorted holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, registered_address, atol_holder, atol_number, website, specialism: https://www.justgoholidays.com/about-us/terms\npublic_contact: https://www.justgoholidays.com/about-us/faqs\nbusiness_address: https://www.justgoholidays.com/about-us/faqs",
      "notes": "Preferred workbook A37; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "",
        "registered_address": "1st Floor, 111 High Street, Cheltenham GL50 1DW",
        "facts": [
          {
            "field": "legal_name",
            "value": "Just Go Holidays Limited",
            "source_url": "https://www.justgoholidays.com/about-us/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Just Go Holidays Limited"
          },
          {
            "field": "registered_address",
            "value": "1st Floor, 111 High Street, Cheltenham GL50 1DW",
            "source_url": "https://www.justgoholidays.com/about-us/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Just Go Holidays Limited"
          },
          {
            "field": "business_address",
            "value": "1st Floor, 111 High Street, Cheltenham GL50 1DW",
            "source_url": "https://www.justgoholidays.com/about-us/faqs",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Just Go Holidays Limited"
          },
          {
            "field": "public_contact",
            "value": "customerservices@justgoholidays.com",
            "source_url": "https://www.justgoholidays.com/about-us/faqs",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Just Go Holidays Limited"
          },
          {
            "field": "atol_holder",
            "value": "Just Go Holidays Limited",
            "source_url": "https://www.justgoholidays.com/about-us/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Just Go Holidays Limited"
          },
          {
            "field": "atol_number",
            "value": "10889",
            "source_url": "https://www.justgoholidays.com/about-us/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Just Go Holidays Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.justgoholidays.com",
            "source_url": "https://www.justgoholidays.com/about-us/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Just Go Holidays Limited"
          },
          {
            "field": "specialism",
            "value": "Coach and escorted holidays",
            "source_url": "https://www.justgoholidays.com/about-us/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Just Go Holidays Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Just Go Holidays Limited",
        "business_address": "1st Floor, 111 High Street, Cheltenham GL50 1DW",
        "public_contact": "customerservices@justgoholidays.com",
        "official_website": "https://www.justgoholidays.com",
        "atol_holder": "Just Go Holidays Limited",
        "atol_number": "10889"
      }
    },
    "issues": []
  },
  {
    "cell": "A38",
    "aliases": [
      "Kuoni"
    ],
    "payload": {
      "name": "Kuoni",
      "display_name": "Kuoni",
      "website": "https://www.kuoni.co.uk",
      "specialism": "Luxury tailor-made holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, atol_holder, atol_number, website, specialism: https://www.kuoni.co.uk/useful-information/terms-and-conditions/\npublic_contact: https://www.kuoni.co.uk/useful-information/help-and-support/help-with-an-existing-holiday/\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/00395623.json",
      "notes": "Preferred workbook A38; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Email is published support for existing holidays, not a confirmed general sales mailbox.",
      "lookup_record": {
        "company_number": "00395623",
        "registered_address": "TOURISTIK HOUSE, ONE DORKING OFFICE PARK, DORKING, SURREY, ENGLAND, RH4 1HJ",
        "facts": [
          {
            "field": "legal_name",
            "value": "DERTOUR UK Ltd",
            "source_url": "https://www.kuoni.co.uk/useful-information/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "DERTOUR UK Ltd"
          },
          {
            "field": "company_number",
            "value": "00395623",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00395623.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.937Z",
            "state": "authoritative-source",
            "entity": "DERTOUR UK Ltd"
          },
          {
            "field": "registered_address",
            "value": "TOURISTIK HOUSE, ONE DORKING OFFICE PARK, DORKING, SURREY, ENGLAND, RH4 1HJ",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00395623.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.937Z",
            "state": "authoritative-source",
            "entity": "DERTOUR UK Ltd"
          },
          {
            "field": "public_contact",
            "value": "support@kuoni.co.uk",
            "source_url": "https://www.kuoni.co.uk/useful-information/help-and-support/help-with-an-existing-holiday/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "DERTOUR UK Ltd"
          },
          {
            "field": "atol_holder",
            "value": "DERTOUR UK Ltd",
            "source_url": "https://www.kuoni.co.uk/useful-information/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "DERTOUR UK Ltd"
          },
          {
            "field": "atol_number",
            "value": "0132",
            "source_url": "https://www.kuoni.co.uk/useful-information/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "DERTOUR UK Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.kuoni.co.uk",
            "source_url": "https://www.kuoni.co.uk/useful-information/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "DERTOUR UK Ltd"
          },
          {
            "field": "specialism",
            "value": "Luxury tailor-made holidays",
            "source_url": "https://www.kuoni.co.uk/useful-information/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "DERTOUR UK Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "DERTOUR UK Ltd",
        "business_address": "",
        "public_contact": "support@kuoni.co.uk",
        "official_website": "https://www.kuoni.co.uk",
        "atol_holder": "DERTOUR UK Ltd",
        "atol_number": "0132"
      }
    },
    "issues": [
      "Email is published support for existing holidays, not a confirmed general sales mailbox."
    ]
  },
  {
    "cell": "A39",
    "aliases": [
      "Lounge Pass"
    ],
    "payload": {
      "name": "Lounge Pass",
      "display_name": "Lounge Pass",
      "website": "https://www.loungepass.com",
      "specialism": "Airport lounge access",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, website, specialism: https://www.loungepass.com/index.cfm?c=2&fuseaction=information.termsofuse_popup\npublic_contact: https://www.loungepass.com/index.cfm?c=2&fuseaction=information.tandc_popup\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/02728518.json",
      "notes": "Preferred workbook A39; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. ",
      "lookup_record": {
        "company_number": "02728518",
        "registered_address": "3 MORE LONDON RIVERSIDE, 5TH FLOOR, LONDON, UNITED KINGDOM, SE1 2AQ",
        "facts": [
          {
            "field": "legal_name",
            "value": "Priority Pass Ltd",
            "source_url": "https://www.loungepass.com/index.cfm?c=2&fuseaction=information.termsofuse_popup",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Priority Pass Ltd"
          },
          {
            "field": "company_number",
            "value": "02728518",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/02728518.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.936Z",
            "state": "authoritative-source",
            "entity": "Priority Pass Ltd"
          },
          {
            "field": "registered_address",
            "value": "3 MORE LONDON RIVERSIDE, 5TH FLOOR, LONDON, UNITED KINGDOM, SE1 2AQ",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/02728518.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.936Z",
            "state": "authoritative-source",
            "entity": "Priority Pass Ltd"
          },
          {
            "field": "public_contact",
            "value": "info@loungepass.com",
            "source_url": "https://www.loungepass.com/index.cfm?c=2&fuseaction=information.tandc_popup",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Priority Pass Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.loungepass.com",
            "source_url": "https://www.loungepass.com/index.cfm?c=2&fuseaction=information.termsofuse_popup",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Priority Pass Ltd"
          },
          {
            "field": "specialism",
            "value": "Airport lounge access",
            "source_url": "https://www.loungepass.com/index.cfm?c=2&fuseaction=information.termsofuse_popup",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Priority Pass Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Priority Pass Ltd",
        "business_address": "",
        "public_contact": "info@loungepass.com",
        "official_website": "https://www.loungepass.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": []
  },
  {
    "cell": "A40",
    "aliases": [
      "Mercury Holidays"
    ],
    "payload": {
      "name": "Mercury Holidays",
      "display_name": "Mercury Holidays",
      "website": "https://www.mercuryholidays.co.uk",
      "specialism": "Escorted tours and beach holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, business_address, website, specialism: https://www.mercuryholidays.co.uk/info/terms-and-conditions\ncompany_number, atol_holder, atol_number: https://www.sunspottours.com/info/terms-and-conditions\npublic_contact: https://www.mercuryholidays.co.uk/info/contact-us\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/01470134.json",
      "notes": "Preferred workbook A40; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "01470134",
        "registered_address": "ST. JOHN'S HOUSE, SUFFOLK WAY, SEVENOAKS, KENT, UNITED KINGDOM, TN13 1YL",
        "facts": [
          {
            "field": "legal_name",
            "value": "Sunspot Tours Ltd",
            "source_url": "https://www.mercuryholidays.co.uk/info/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sunspot Tours Ltd"
          },
          {
            "field": "company_number",
            "value": "01470134",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01470134.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.995Z",
            "state": "authoritative-source",
            "entity": "Sunspot Tours Ltd"
          },
          {
            "field": "registered_address",
            "value": "ST. JOHN'S HOUSE, SUFFOLK WAY, SEVENOAKS, KENT, UNITED KINGDOM, TN13 1YL",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01470134.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.995Z",
            "state": "authoritative-source",
            "entity": "Sunspot Tours Ltd"
          },
          {
            "field": "business_address",
            "value": "St John's House, Suffolk Way, Sevenoaks, Kent TN13 1YL",
            "source_url": "https://www.mercuryholidays.co.uk/info/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sunspot Tours Ltd"
          },
          {
            "field": "public_contact",
            "value": "Public contact page: https://www.mercuryholidays.co.uk/info/contact-us",
            "source_url": "https://www.mercuryholidays.co.uk/info/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sunspot Tours Ltd"
          },
          {
            "field": "atol_holder",
            "value": "Sunspot Tours Ltd",
            "source_url": "https://www.sunspottours.com/info/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sunspot Tours Ltd"
          },
          {
            "field": "atol_number",
            "value": "1631",
            "source_url": "https://www.sunspottours.com/info/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sunspot Tours Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.mercuryholidays.co.uk",
            "source_url": "https://www.mercuryholidays.co.uk/info/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sunspot Tours Ltd"
          },
          {
            "field": "specialism",
            "value": "Escorted tours and beach holidays",
            "source_url": "https://www.mercuryholidays.co.uk/info/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Sunspot Tours Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Sunspot Tours Ltd",
        "business_address": "St John's House, Suffolk Way, Sevenoaks, Kent TN13 1YL",
        "public_contact": "Public contact page: https://www.mercuryholidays.co.uk/info/contact-us",
        "official_website": "https://www.mercuryholidays.co.uk",
        "atol_holder": "Sunspot Tours Ltd",
        "atol_number": "1631"
      }
    },
    "issues": []
  },
  {
    "cell": "A41",
    "aliases": [
      "MSC",
      "MSC Cruises"
    ],
    "payload": {
      "name": "MSC",
      "display_name": "MSC Cruises",
      "website": "https://www.msccruises.co.uk",
      "specialism": "Ocean cruises",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, registered_address, public_contact, website, specialism: https://www.msccruises.co.uk/terms-conditions",
      "notes": "Preferred workbook A41; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. Official UK terms identify Swiss organiser. ATOL protection clause observed but licence number not established; no group-number assumption.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "Avenue Eugene-Pittard 16, 1206 Geneva, Switzerland",
        "facts": [
          {
            "field": "legal_name",
            "value": "MSC Cruises SA",
            "source_url": "https://www.msccruises.co.uk/terms-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "MSC Cruises SA"
          },
          {
            "field": "registered_address",
            "value": "Avenue Eugene-Pittard 16, 1206 Geneva, Switzerland",
            "source_url": "https://www.msccruises.co.uk/terms-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "MSC Cruises SA"
          },
          {
            "field": "public_contact",
            "value": "customerservice@msccruises.co.uk",
            "source_url": "https://www.msccruises.co.uk/terms-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "MSC Cruises SA"
          },
          {
            "field": "official_website",
            "value": "https://www.msccruises.co.uk",
            "source_url": "https://www.msccruises.co.uk/terms-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "MSC Cruises SA"
          },
          {
            "field": "specialism",
            "value": "Ocean cruises",
            "source_url": "https://www.msccruises.co.uk/terms-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "MSC Cruises SA"
          }
        ]
      },
      "disclosures": {
        "legal_name": "MSC Cruises SA",
        "business_address": "",
        "public_contact": "customerservice@msccruises.co.uk",
        "official_website": "https://www.msccruises.co.uk",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Official UK terms identify Swiss organiser. ATOL protection clause observed but licence number not established; no group-number assumption."
    ]
  },
  {
    "cell": "A42",
    "aliases": [
      "National Holidays"
    ],
    "payload": {
      "name": "National Holidays",
      "display_name": "National Holidays",
      "website": "https://www.nationalholidays.com",
      "specialism": "Coach holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, registered_address, atol_holder, atol_number, website, specialism: https://www.justgoholidays.com/about-us/terms",
      "notes": "Preferred workbook A42; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Same legal operator as Just Go; retain distinct brand. ATOL only for qualifying flight products, not ordinary coach-only trips.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "1st Floor, 111 High Street, Cheltenham GL50 1DW",
        "facts": [
          {
            "field": "legal_name",
            "value": "Just Go Holidays Limited",
            "source_url": "https://www.justgoholidays.com/about-us/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Just Go Holidays Limited"
          },
          {
            "field": "registered_address",
            "value": "1st Floor, 111 High Street, Cheltenham GL50 1DW",
            "source_url": "https://www.justgoholidays.com/about-us/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Just Go Holidays Limited"
          },
          {
            "field": "atol_holder",
            "value": "Just Go Holidays Limited",
            "source_url": "https://www.justgoholidays.com/about-us/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Just Go Holidays Limited"
          },
          {
            "field": "atol_number",
            "value": "10889",
            "source_url": "https://www.justgoholidays.com/about-us/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Just Go Holidays Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.nationalholidays.com",
            "source_url": "https://www.justgoholidays.com/about-us/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Just Go Holidays Limited"
          },
          {
            "field": "specialism",
            "value": "Coach holidays",
            "source_url": "https://www.justgoholidays.com/about-us/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Just Go Holidays Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Just Go Holidays Limited",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.nationalholidays.com",
        "atol_holder": "Just Go Holidays Limited",
        "atol_number": "10889"
      }
    },
    "issues": [
      "Same legal operator as Just Go; retain distinct brand. ATOL only for qualifying flight products, not ordinary coach-only trips."
    ]
  },
  {
    "cell": "A43",
    "aliases": [
      "Neilson Active Holidays"
    ],
    "payload": {
      "name": "Neilson Active Holidays",
      "display_name": "Neilson Active Holidays",
      "website": "https://www.neilson.co.uk",
      "specialism": "Active beach and ski holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, business_address, public_contact, website, specialism: https://www.neilson.co.uk/help/booking-conditions\natol_holder, atol_number: https://www.neilson.co.uk/help/website-conditions\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/02987304.json",
      "notes": "Preferred workbook A43; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Neilson Retail Limited is the website/booking agent; Neilson Active Holidays Limited is the package organiser.",
      "lookup_record": {
        "company_number": "02987304",
        "registered_address": "LOCKSVIEW, BRIGHTON MARINA, BRIGHTON, EAST SUSSEX, BN2 5HA",
        "facts": [
          {
            "field": "legal_name",
            "value": "Neilson Active Holidays Limited",
            "source_url": "https://www.neilson.co.uk/help/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Neilson Active Holidays Limited"
          },
          {
            "field": "company_number",
            "value": "02987304",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/02987304.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.999Z",
            "state": "authoritative-source",
            "entity": "Neilson Active Holidays Limited"
          },
          {
            "field": "registered_address",
            "value": "LOCKSVIEW, BRIGHTON MARINA, BRIGHTON, EAST SUSSEX, BN2 5HA",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/02987304.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.999Z",
            "state": "authoritative-source",
            "entity": "Neilson Active Holidays Limited"
          },
          {
            "field": "business_address",
            "value": "Locksview, Brighton Marina, Brighton, East Sussex BN2 5HA",
            "source_url": "https://www.neilson.co.uk/help/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Neilson Active Holidays Limited"
          },
          {
            "field": "public_contact",
            "value": "sales@neilson.com",
            "source_url": "https://www.neilson.co.uk/help/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Neilson Active Holidays Limited"
          },
          {
            "field": "atol_holder",
            "value": "Neilson Active Holidays Limited",
            "source_url": "https://www.neilson.co.uk/help/website-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Neilson Active Holidays Limited"
          },
          {
            "field": "atol_number",
            "value": "10794",
            "source_url": "https://www.neilson.co.uk/help/website-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Neilson Active Holidays Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.neilson.co.uk",
            "source_url": "https://www.neilson.co.uk/help/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Neilson Active Holidays Limited"
          },
          {
            "field": "specialism",
            "value": "Active beach and ski holidays",
            "source_url": "https://www.neilson.co.uk/help/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Neilson Active Holidays Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Neilson Active Holidays Limited",
        "business_address": "Locksview, Brighton Marina, Brighton, East Sussex BN2 5HA",
        "public_contact": "sales@neilson.com",
        "official_website": "https://www.neilson.co.uk",
        "atol_holder": "Neilson Active Holidays Limited",
        "atol_number": "10794"
      }
    },
    "issues": [
      "Neilson Retail Limited is the website/booking agent; Neilson Active Holidays Limited is the package organiser."
    ]
  },
  {
    "cell": "A44",
    "aliases": [
      "New Market Holidays",
      "Newmarket Holidays"
    ],
    "payload": {
      "name": "New Market Holidays",
      "display_name": "Newmarket Holidays",
      "website": "https://www.newmarketholidays.co.uk",
      "specialism": "Escorted tours",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, atol_holder, atol_number, website, specialism: https://www.newmarketholidays.co.uk/terms-and-conditions/tours-with-flights-or-eurostar/\ncompany_number: https://find-and-update.company-information.service.gov.uk/company/02238316\npublic_contact: https://www.newmarketholidays.co.uk/contact-us/\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/02238316.json",
      "notes": "Preferred workbook A44; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "02238316",
        "registered_address": "CANTIUM HOUSE, RAILWAY APPROACH, WALLINGTON, SM6 0BP",
        "facts": [
          {
            "field": "legal_name",
            "value": "Newmarket Holidays Ltd",
            "source_url": "https://www.newmarketholidays.co.uk/terms-and-conditions/tours-with-flights-or-eurostar/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Newmarket Holidays Ltd"
          },
          {
            "field": "company_number",
            "value": "02238316",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/02238316.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:14:09.455Z",
            "state": "authoritative-source",
            "entity": "Newmarket Holidays Ltd"
          },
          {
            "field": "registered_address",
            "value": "CANTIUM HOUSE, RAILWAY APPROACH, WALLINGTON, SM6 0BP",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/02238316.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:14:09.455Z",
            "state": "authoritative-source",
            "entity": "Newmarket Holidays Ltd"
          },
          {
            "field": "public_contact",
            "value": "Public contact page: https://www.newmarketholidays.co.uk/contact-us/",
            "source_url": "https://www.newmarketholidays.co.uk/contact-us/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Newmarket Holidays Ltd"
          },
          {
            "field": "atol_holder",
            "value": "Newmarket Holidays Ltd",
            "source_url": "https://www.newmarketholidays.co.uk/terms-and-conditions/tours-with-flights-or-eurostar/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Newmarket Holidays Ltd"
          },
          {
            "field": "atol_number",
            "value": "2325",
            "source_url": "https://www.newmarketholidays.co.uk/terms-and-conditions/tours-with-flights-or-eurostar/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Newmarket Holidays Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.newmarketholidays.co.uk",
            "source_url": "https://www.newmarketholidays.co.uk/terms-and-conditions/tours-with-flights-or-eurostar/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Newmarket Holidays Ltd"
          },
          {
            "field": "specialism",
            "value": "Escorted tours",
            "source_url": "https://www.newmarketholidays.co.uk/terms-and-conditions/tours-with-flights-or-eurostar/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Newmarket Holidays Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Newmarket Holidays Ltd",
        "business_address": "",
        "public_contact": "Public contact page: https://www.newmarketholidays.co.uk/contact-us/",
        "official_website": "https://www.newmarketholidays.co.uk",
        "atol_holder": "Newmarket Holidays Ltd",
        "atol_number": "2325"
      }
    },
    "issues": []
  },
  {
    "cell": "A45",
    "aliases": [
      "NCL Cruises",
      "Norwegian Cruise Line"
    ],
    "payload": {
      "name": "NCL Cruises",
      "display_name": "Norwegian Cruise Line",
      "website": "https://www.ncl.com/uk/en",
      "specialism": "Ocean cruises",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, business_address, public_contact, atol_holder, atol_number, website, specialism: https://www.ncl.com/uk/en/terms",
      "notes": "Preferred workbook A45; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "NCL (Bahamas) Ltd.",
            "source_url": "https://www.ncl.com/uk/en/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "NCL (Bahamas) Ltd."
          },
          {
            "field": "business_address",
            "value": "Mountbatten House, Grosvenor Square, Southampton SO15 2JU",
            "source_url": "https://www.ncl.com/uk/en/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "NCL (Bahamas) Ltd."
          },
          {
            "field": "public_contact",
            "value": "reservations@ncl.com",
            "source_url": "https://www.ncl.com/uk/en/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "NCL (Bahamas) Ltd."
          },
          {
            "field": "atol_holder",
            "value": "NCL (Bahamas) Ltd.",
            "source_url": "https://www.ncl.com/uk/en/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "NCL (Bahamas) Ltd."
          },
          {
            "field": "atol_number",
            "value": "2752",
            "source_url": "https://www.ncl.com/uk/en/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "NCL (Bahamas) Ltd."
          },
          {
            "field": "official_website",
            "value": "https://www.ncl.com/uk/en",
            "source_url": "https://www.ncl.com/uk/en/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "NCL (Bahamas) Ltd."
          },
          {
            "field": "specialism",
            "value": "Ocean cruises",
            "source_url": "https://www.ncl.com/uk/en/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "NCL (Bahamas) Ltd."
          }
        ]
      },
      "disclosures": {
        "legal_name": "NCL (Bahamas) Ltd.",
        "business_address": "Mountbatten House, Grosvenor Square, Southampton SO15 2JU",
        "public_contact": "reservations@ncl.com",
        "official_website": "https://www.ncl.com/uk/en",
        "atol_holder": "NCL (Bahamas) Ltd.",
        "atol_number": "2752"
      }
    },
    "issues": []
  },
  {
    "cell": "A46",
    "aliases": [
      "Oceania Cruise",
      "Oceania Cruises"
    ],
    "payload": {
      "name": "Oceania Cruise",
      "display_name": "Oceania Cruises",
      "website": "https://www.oceaniacruises.com",
      "specialism": "Ocean cruises",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, website, specialism: https://www.oceaniacruises.com/legal/ticket-contract/Documents/Legal/81604553469/eu-uu-ticket-contract.pdf\npublic_contact: https://oceaniacruises.zendesk.com/hc/en-us/articles/6018274396563-Contact-Us-Phone-Numbers",
      "notes": "Preferred workbook A46; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. Official UK/Europe ticket contract identifies carrier. Licence number and UK contact entity not established; do not inherit NCL parent licence.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "Oceania Cruises S. de R.L.",
            "source_url": "https://www.oceaniacruises.com/legal/ticket-contract/Documents/Legal/81604553469/eu-uu-ticket-contract.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Oceania Cruises S. de R.L."
          },
          {
            "field": "public_contact",
            "value": "Public contact page: https://oceaniacruises.zendesk.com/hc/en-us/articles/6018274396563-Contact-Us-Phone-Numbers",
            "source_url": "https://oceaniacruises.zendesk.com/hc/en-us/articles/6018274396563-Contact-Us-Phone-Numbers",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Oceania Cruises S. de R.L."
          },
          {
            "field": "official_website",
            "value": "https://www.oceaniacruises.com",
            "source_url": "https://www.oceaniacruises.com/legal/ticket-contract/Documents/Legal/81604553469/eu-uu-ticket-contract.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Oceania Cruises S. de R.L."
          },
          {
            "field": "specialism",
            "value": "Ocean cruises",
            "source_url": "https://www.oceaniacruises.com/legal/ticket-contract/Documents/Legal/81604553469/eu-uu-ticket-contract.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Oceania Cruises S. de R.L."
          }
        ]
      },
      "disclosures": {
        "legal_name": "Oceania Cruises S. de R.L.",
        "business_address": "",
        "public_contact": "Public contact page: https://oceaniacruises.zendesk.com/hc/en-us/articles/6018274396563-Contact-Us-Phone-Numbers",
        "official_website": "https://www.oceaniacruises.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Official UK/Europe ticket contract identifies carrier. Licence number and UK contact entity not established; do not inherit NCL parent licence."
    ]
  },
  {
    "cell": "A47",
    "aliases": [
      "Olympic Holidays"
    ],
    "payload": {
      "name": "Olympic Holidays",
      "display_name": "Olympic Holidays",
      "website": "https://www.olympicholidays.com",
      "specialism": "Greek islands and Mediterranean holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, business_address, public_contact, atol_holder, atol_number, website, specialism: https://www.olympicholidays.com/help/booking-terms-and-conditions/",
      "notes": "Preferred workbook A47; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "Travelworld Vacations Ltd",
            "source_url": "https://www.olympicholidays.com/help/booking-terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travelworld Vacations Ltd"
          },
          {
            "field": "business_address",
            "value": "c/o Interaction Worldwide Ltd, 1 Torrington Park, London N12 9TB",
            "source_url": "https://www.olympicholidays.com/help/booking-terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travelworld Vacations Ltd"
          },
          {
            "field": "public_contact",
            "value": "enquiries@olympicholidays.com",
            "source_url": "https://www.olympicholidays.com/help/booking-terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travelworld Vacations Ltd"
          },
          {
            "field": "atol_holder",
            "value": "Travelworld Vacations Ltd",
            "source_url": "https://www.olympicholidays.com/help/booking-terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travelworld Vacations Ltd"
          },
          {
            "field": "atol_number",
            "value": "4108",
            "source_url": "https://www.olympicholidays.com/help/booking-terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travelworld Vacations Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.olympicholidays.com",
            "source_url": "https://www.olympicholidays.com/help/booking-terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travelworld Vacations Ltd"
          },
          {
            "field": "specialism",
            "value": "Greek islands and Mediterranean holidays",
            "source_url": "https://www.olympicholidays.com/help/booking-terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Travelworld Vacations Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Travelworld Vacations Ltd",
        "business_address": "c/o Interaction Worldwide Ltd, 1 Torrington Park, London N12 9TB",
        "public_contact": "enquiries@olympicholidays.com",
        "official_website": "https://www.olympicholidays.com",
        "atol_holder": "Travelworld Vacations Ltd",
        "atol_number": "4108"
      }
    },
    "issues": []
  },
  {
    "cell": "A48",
    "aliases": [
      "P&O/Cunard",
      "P&O / Cunard"
    ],
    "payload": {
      "name": "P&O/Cunard",
      "display_name": "P&O / Cunard",
      "website": "https://www.pocruises.com",
      "specialism": "Ocean cruises",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, atol_holder, atol_number, website, specialism: https://www.pocruises.com/company-information\n: https://www.cunard.com/en-gb/advice-and-policies/consumer-protection\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/04039524.json",
      "notes": "Preferred workbook A48; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Combined workbook entry covers P&O Cruises AND Cunard. Keep one staging registry record; select actual brand and carrier for each offer. No implied permission for either logo.",
      "lookup_record": {
        "company_number": "04039524",
        "registered_address": "CARNIVAL HOUSE, 100 HARBOUR PARADE, SOUTHAMPTON, HAMPSHIRE, UNITED KINGDOM, SO15 1ST",
        "facts": [
          {
            "field": "legal_name",
            "value": "Carnival UK Ltd",
            "source_url": "https://www.pocruises.com/company-information",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Carnival UK Ltd"
          },
          {
            "field": "company_number",
            "value": "04039524",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/04039524.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.996Z",
            "state": "authoritative-source",
            "entity": "Carnival UK Ltd"
          },
          {
            "field": "registered_address",
            "value": "CARNIVAL HOUSE, 100 HARBOUR PARADE, SOUTHAMPTON, HAMPSHIRE, UNITED KINGDOM, SO15 1ST",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/04039524.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.996Z",
            "state": "authoritative-source",
            "entity": "Carnival UK Ltd"
          },
          {
            "field": "atol_holder",
            "value": "Carnival UK Ltd",
            "source_url": "https://www.pocruises.com/company-information",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Carnival UK Ltd"
          },
          {
            "field": "atol_number",
            "value": "6294",
            "source_url": "https://www.pocruises.com/company-information",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Carnival UK Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.pocruises.com",
            "source_url": "https://www.pocruises.com/company-information",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Carnival UK Ltd"
          },
          {
            "field": "specialism",
            "value": "Ocean cruises",
            "source_url": "https://www.pocruises.com/company-information",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Carnival UK Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Carnival UK Ltd",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.pocruises.com",
        "atol_holder": "Carnival UK Ltd",
        "atol_number": "6294"
      }
    },
    "issues": [
      "Combined workbook entry covers P&O Cruises AND Cunard. Keep one staging registry record; select actual brand and carrier for each offer. No implied permission for either logo."
    ]
  },
  {
    "cell": "A49",
    "aliases": [
      "P&O Ferries Irish Routes",
      "P&O Ferries — Irish routes"
    ],
    "payload": {
      "name": "P&O Ferries Irish Routes",
      "display_name": "P&O Ferries — Irish routes",
      "website": "https://www.poferries.com",
      "specialism": "Ferries",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, public_contact, specialism: https://www.poferries.com/en/about-us\n: https://po-ecom-prod-xp-93-113810-cd-cdn.azureedge.net/-/media/poferries/feature/by-webpage/terms-and-conditions/2025/tc_en_30dec24.pdf?hash=C2D7F0113CE6369B49291F4CF769E69A&rev=93d5e9b8035145e686eeba7e67882db2",
      "notes": "Preferred workbook A49; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Route-specific carrier required. Official terms name P&O European Ferries (Irish Sea) Limited 00318227 and P&O Short Sea Ferries Limited 03291852. Do not equate marketing-company 06038077 with every carrier; confirm applicable route before setting legal name.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "public_contact",
            "value": "customer.services@poferries.com",
            "source_url": "https://www.poferries.com/en/about-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "P&O Ferries — Irish routes"
          },
          {
            "field": "official_website",
            "value": "https://www.poferries.com",
            "source_url": "https://www.poferries.com/en/about-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "P&O Ferries — Irish routes"
          },
          {
            "field": "specialism",
            "value": "Ferries",
            "source_url": "https://www.poferries.com/en/about-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "P&O Ferries — Irish routes"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "customer.services@poferries.com",
        "official_website": "https://www.poferries.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Route-specific carrier required. Official terms name P&O European Ferries (Irish Sea) Limited 00318227 and P&O Short Sea Ferries Limited 03291852. Do not equate marketing-company 06038077 with every carrier; confirm applicable route before setting legal name."
    ]
  },
  {
    "cell": "A50",
    "aliases": [
      "P&O Ferries Other Routes",
      "P&O Ferries — other routes"
    ],
    "payload": {
      "name": "P&O Ferries Other Routes",
      "display_name": "P&O Ferries — other routes",
      "website": "https://www.poferries.com",
      "specialism": "Ferries",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, public_contact, specialism: https://www.poferries.com/en/about-us\n: https://po-ecom-prod-xp-93-113810-cd-cdn.azureedge.net/-/media/poferries/feature/by-webpage/terms-and-conditions/2025/tc_en_30dec24.pdf?hash=C2D7F0113CE6369B49291F4CF769E69A&rev=93d5e9b8035145e686eeba7e67882db2",
      "notes": "Preferred workbook A50; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Route-specific carrier required. Official terms name P&O European Ferries (Irish Sea) Limited 00318227 and P&O Short Sea Ferries Limited 03291852. Do not equate marketing-company 06038077 with every carrier; confirm applicable route before setting legal name.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "public_contact",
            "value": "customer.services@poferries.com",
            "source_url": "https://www.poferries.com/en/about-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "P&O Ferries — other routes"
          },
          {
            "field": "official_website",
            "value": "https://www.poferries.com",
            "source_url": "https://www.poferries.com/en/about-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "P&O Ferries — other routes"
          },
          {
            "field": "specialism",
            "value": "Ferries",
            "source_url": "https://www.poferries.com/en/about-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "P&O Ferries — other routes"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "customer.services@poferries.com",
        "official_website": "https://www.poferries.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Route-specific carrier required. Official terms name P&O European Ferries (Irish Sea) Limited 00318227 and P&O Short Sea Ferries Limited 03291852. Do not equate marketing-company 06038077 with every carrier; confirm applicable route before setting legal name."
    ]
  },
  {
    "cell": "A51",
    "aliases": [
      "Princess",
      "Princess Cruises"
    ],
    "payload": {
      "name": "Princess",
      "display_name": "Princess Cruises",
      "website": "https://www.princess.com",
      "specialism": "Ocean cruises",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, website, specialism: https://gb-www.princess.com/en-uk/legal/legal-information\natol_holder, atol_number: https://www.princess.com/en-int/legal/consumer-protection\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/04039524.json",
      "notes": "Preferred workbook A51; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "04039524",
        "registered_address": "CARNIVAL HOUSE, 100 HARBOUR PARADE, SOUTHAMPTON, HAMPSHIRE, UNITED KINGDOM, SO15 1ST",
        "facts": [
          {
            "field": "legal_name",
            "value": "Carnival UK Ltd",
            "source_url": "https://gb-www.princess.com/en-uk/legal/legal-information",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Carnival UK Ltd"
          },
          {
            "field": "company_number",
            "value": "04039524",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/04039524.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.996Z",
            "state": "authoritative-source",
            "entity": "Carnival UK Ltd"
          },
          {
            "field": "registered_address",
            "value": "CARNIVAL HOUSE, 100 HARBOUR PARADE, SOUTHAMPTON, HAMPSHIRE, UNITED KINGDOM, SO15 1ST",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/04039524.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:49.996Z",
            "state": "authoritative-source",
            "entity": "Carnival UK Ltd"
          },
          {
            "field": "atol_holder",
            "value": "Carnival UK Ltd",
            "source_url": "https://www.princess.com/en-int/legal/consumer-protection",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Carnival UK Ltd"
          },
          {
            "field": "atol_number",
            "value": "6294",
            "source_url": "https://www.princess.com/en-int/legal/consumer-protection",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Carnival UK Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.princess.com",
            "source_url": "https://gb-www.princess.com/en-uk/legal/legal-information",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Carnival UK Ltd"
          },
          {
            "field": "specialism",
            "value": "Ocean cruises",
            "source_url": "https://gb-www.princess.com/en-uk/legal/legal-information",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Carnival UK Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Carnival UK Ltd",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.princess.com",
        "atol_holder": "Carnival UK Ltd",
        "atol_number": "6294"
      }
    },
    "issues": []
  },
  {
    "cell": "A52",
    "aliases": [
      "Railbookers"
    ],
    "payload": {
      "name": "Railbookers",
      "display_name": "Railbookers",
      "website": "https://www.railbookers.co.uk",
      "specialism": "Rail holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, business_address, atol_holder, atol_number, website, specialism: https://www.railbookers.co.uk/terms-and-conditions\npublic_contact: https://www.railbookers.co.uk/contact-us",
      "notes": "Preferred workbook A52; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Rail packages can include flights; ATOL applies only to qualifying flight arrangements.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "Railbookers UK Trading Ltd",
            "source_url": "https://www.railbookers.co.uk/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Railbookers UK Trading Ltd"
          },
          {
            "field": "business_address",
            "value": "107-111 Fleet Street, London EC4A 2AB",
            "source_url": "https://www.railbookers.co.uk/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Railbookers UK Trading Ltd"
          },
          {
            "field": "public_contact",
            "value": "Public contact page: https://www.railbookers.co.uk/contact-us",
            "source_url": "https://www.railbookers.co.uk/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Railbookers UK Trading Ltd"
          },
          {
            "field": "atol_holder",
            "value": "Railbookers UK Trading Ltd",
            "source_url": "https://www.railbookers.co.uk/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Railbookers UK Trading Ltd"
          },
          {
            "field": "atol_number",
            "value": "7579",
            "source_url": "https://www.railbookers.co.uk/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Railbookers UK Trading Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.railbookers.co.uk",
            "source_url": "https://www.railbookers.co.uk/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Railbookers UK Trading Ltd"
          },
          {
            "field": "specialism",
            "value": "Rail holidays",
            "source_url": "https://www.railbookers.co.uk/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Railbookers UK Trading Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Railbookers UK Trading Ltd",
        "business_address": "107-111 Fleet Street, London EC4A 2AB",
        "public_contact": "Public contact page: https://www.railbookers.co.uk/contact-us",
        "official_website": "https://www.railbookers.co.uk",
        "atol_holder": "Railbookers UK Trading Ltd",
        "atol_number": "7579"
      }
    },
    "issues": [
      "Rail packages can include flights; ATOL applies only to qualifying flight arrangements."
    ]
  },
  {
    "cell": "A53",
    "aliases": [
      "RedSea Holidays",
      "Red Sea Holidays"
    ],
    "payload": {
      "name": "RedSea Holidays",
      "display_name": "Red Sea Holidays",
      "website": "https://www.redseaholidays.co.uk",
      "specialism": "Egypt and Red Sea holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, website, specialism: https://www.redseaholidays.co.uk/en/terms-and-conditions/\nbusiness_address, public_contact: https://www.redseaholidays.co.uk/en/contact-us/\natol_holder, atol_number: https://www.redseaholidays.co.uk/en/booking-conditions/\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/06418075.json",
      "notes": "Preferred workbook A53; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "06418075",
        "registered_address": "5 NEW STREET SQUARE, LONDON, EC4A 3TW",
        "facts": [
          {
            "field": "legal_name",
            "value": "Red Sea Holidays UK Ltd",
            "source_url": "https://www.redseaholidays.co.uk/en/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Red Sea Holidays UK Ltd"
          },
          {
            "field": "company_number",
            "value": "06418075",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/06418075.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.067Z",
            "state": "authoritative-source",
            "entity": "Red Sea Holidays UK Ltd"
          },
          {
            "field": "registered_address",
            "value": "5 NEW STREET SQUARE, LONDON, EC4A 3TW",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/06418075.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.067Z",
            "state": "authoritative-source",
            "entity": "Red Sea Holidays UK Ltd"
          },
          {
            "field": "business_address",
            "value": "Richmond House, 16-20 Regent Street, Cambridge CB2 1DB",
            "source_url": "https://www.redseaholidays.co.uk/en/contact-us/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Red Sea Holidays UK Ltd"
          },
          {
            "field": "public_contact",
            "value": "customersupport@redseaholidays.co.uk",
            "source_url": "https://www.redseaholidays.co.uk/en/contact-us/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Red Sea Holidays UK Ltd"
          },
          {
            "field": "atol_holder",
            "value": "Red Sea Holidays UK Ltd",
            "source_url": "https://www.redseaholidays.co.uk/en/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Red Sea Holidays UK Ltd"
          },
          {
            "field": "atol_number",
            "value": "9749",
            "source_url": "https://www.redseaholidays.co.uk/en/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Red Sea Holidays UK Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.redseaholidays.co.uk",
            "source_url": "https://www.redseaholidays.co.uk/en/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Red Sea Holidays UK Ltd"
          },
          {
            "field": "specialism",
            "value": "Egypt and Red Sea holidays",
            "source_url": "https://www.redseaholidays.co.uk/en/terms-and-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Red Sea Holidays UK Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Red Sea Holidays UK Ltd",
        "business_address": "Richmond House, 16-20 Regent Street, Cambridge CB2 1DB",
        "public_contact": "customersupport@redseaholidays.co.uk",
        "official_website": "https://www.redseaholidays.co.uk",
        "atol_holder": "Red Sea Holidays UK Ltd",
        "atol_number": "9749"
      }
    },
    "issues": []
  },
  {
    "cell": "A54",
    "aliases": [
      "Riu Pro",
      "RIU Pro"
    ],
    "payload": {
      "name": "Riu Pro",
      "display_name": "RIU Pro",
      "website": "https://www.riu.com/en/professionals",
      "specialism": "Hotel trade portal",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism: https://www.riu.com/en/professionals",
      "notes": "Preferred workbook A54; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Trade portal, not automatically the hotel operator/package organiser. Confirm contracting RIU entity from New Travel agreement or relevant property; do not use unrelated RIU hotel-company records.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "official_website",
            "value": "https://www.riu.com/en/professionals",
            "source_url": "https://www.riu.com/en/professionals",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "RIU Pro"
          },
          {
            "field": "specialism",
            "value": "Hotel trade portal",
            "source_url": "https://www.riu.com/en/professionals",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "RIU Pro"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.riu.com/en/professionals",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Trade portal, not automatically the hotel operator/package organiser. Confirm contracting RIU entity from New Travel agreement or relevant property; do not use unrelated RIU hotel-company records."
    ]
  },
  {
    "cell": "A55",
    "aliases": [
      "Riviera Travel"
    ],
    "payload": {
      "name": "Riviera Travel",
      "display_name": "Riviera Travel",
      "website": "https://www.rivieratravel.co.uk",
      "specialism": "River cruises and escorted tours",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, website, specialism: https://mon.rivieratravel.ie/company-policies/booking-conditions\ncompany_number, business_address: https://mon.rivieratravel.ie/contact\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/01869298.json",
      "notes": "Preferred workbook A55; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. UK brand/legal relationship supported by official Irish-market terms. Current UK contact/licence not verified from accessible official UK page; US Riviera Travel LLC is a different entity. Older brochures cite 3430 but no current pair imported.",
      "lookup_record": {
        "company_number": "01869298",
        "registered_address": "NEW MANOR, 328 WETMORE ROAD, BURTON ON TRENT, STAFFS, DE14 1SP",
        "facts": [
          {
            "field": "legal_name",
            "value": "Riviera Tours Limited",
            "source_url": "https://mon.rivieratravel.ie/company-policies/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Riviera Tours Limited"
          },
          {
            "field": "company_number",
            "value": "01869298",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01869298.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:14:09.566Z",
            "state": "authoritative-source",
            "entity": "Riviera Tours Limited"
          },
          {
            "field": "registered_address",
            "value": "NEW MANOR, 328 WETMORE ROAD, BURTON ON TRENT, STAFFS, DE14 1SP",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/01869298.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:14:09.566Z",
            "state": "authoritative-source",
            "entity": "Riviera Tours Limited"
          },
          {
            "field": "business_address",
            "value": "New Manor, 328 Wetmore Road, Burton-on-Trent DE14 1SP",
            "source_url": "https://mon.rivieratravel.ie/contact",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Riviera Tours Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.rivieratravel.co.uk",
            "source_url": "https://mon.rivieratravel.ie/company-policies/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Riviera Tours Limited"
          },
          {
            "field": "specialism",
            "value": "River cruises and escorted tours",
            "source_url": "https://mon.rivieratravel.ie/company-policies/booking-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Riviera Tours Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Riviera Tours Limited",
        "business_address": "New Manor, 328 Wetmore Road, Burton-on-Trent DE14 1SP",
        "public_contact": "",
        "official_website": "https://www.rivieratravel.co.uk",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "UK brand/legal relationship supported by official Irish-market terms. Current UK contact/licence not verified from accessible official UK page; US Riviera Travel LLC is a different entity. Older brochures cite 3430 but no current pair imported."
    ]
  },
  {
    "cell": "A56",
    "aliases": [
      "Sandals"
    ],
    "payload": {
      "name": "Sandals",
      "display_name": "Sandals",
      "website": "https://www.sandals.co.uk",
      "specialism": "Caribbean resort holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, public_contact, atol_holder, atol_number, website, specialism: https://www.sandals.co.uk/terms-conditions/\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/04122639.json",
      "notes": "Preferred workbook A56; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. UK contracting company differs from worldwide representative Unique Travel Corp.",
      "lookup_record": {
        "company_number": "04122639",
        "registered_address": "2ND FLOOR NUCLEUS HOUSE, 2 LOWER MORTLAKE ROAD, RICHMOND, ENGLAND, TW9 2JA",
        "facts": [
          {
            "field": "legal_name",
            "value": "Unique Caribbean Holidays Limited",
            "source_url": "https://www.sandals.co.uk/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Unique Caribbean Holidays Limited"
          },
          {
            "field": "company_number",
            "value": "04122639",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/04122639.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.032Z",
            "state": "authoritative-source",
            "entity": "Unique Caribbean Holidays Limited"
          },
          {
            "field": "registered_address",
            "value": "2ND FLOOR NUCLEUS HOUSE, 2 LOWER MORTLAKE ROAD, RICHMOND, ENGLAND, TW9 2JA",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/04122639.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.032Z",
            "state": "authoritative-source",
            "entity": "Unique Caribbean Holidays Limited"
          },
          {
            "field": "public_contact",
            "value": "sales@sandals.co.uk",
            "source_url": "https://www.sandals.co.uk/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Unique Caribbean Holidays Limited"
          },
          {
            "field": "atol_holder",
            "value": "Unique Caribbean Holidays Limited",
            "source_url": "https://www.sandals.co.uk/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Unique Caribbean Holidays Limited"
          },
          {
            "field": "atol_number",
            "value": "11174",
            "source_url": "https://www.sandals.co.uk/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Unique Caribbean Holidays Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.sandals.co.uk",
            "source_url": "https://www.sandals.co.uk/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Unique Caribbean Holidays Limited"
          },
          {
            "field": "specialism",
            "value": "Caribbean resort holidays",
            "source_url": "https://www.sandals.co.uk/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Unique Caribbean Holidays Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Unique Caribbean Holidays Limited",
        "business_address": "",
        "public_contact": "sales@sandals.co.uk",
        "official_website": "https://www.sandals.co.uk",
        "atol_holder": "Unique Caribbean Holidays Limited",
        "atol_number": "11174"
      }
    },
    "issues": [
      "UK contracting company differs from worldwide representative Unique Travel Corp."
    ]
  },
  {
    "cell": "A57",
    "aliases": [
      "Santas Lapland",
      "Santa's Lapland"
    ],
    "payload": {
      "name": "Santas Lapland",
      "display_name": "Santa's Lapland",
      "website": "https://www.santaslapland.com",
      "specialism": "Lapland family holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, business_address, website, specialism: https://www.santaslapland.com/terms-conditions/booking-conditions/\npublic_contact: https://www.santaslapland.com/contact-us/\natol_holder, atol_number: https://www.santaslapland.com/terms-conditions/booking-conditions/\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/00350786.json",
      "notes": "Preferred workbook A57; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "00350786",
        "registered_address": "NELSON HOUSE, 55-59 VICTORIA ROAD, FARNBOROUGH, ENGLAND, GU14 7PA",
        "facts": [
          {
            "field": "legal_name",
            "value": "Hotelplan Ltd",
            "source_url": "https://www.santaslapland.com/terms-conditions/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Ltd"
          },
          {
            "field": "company_number",
            "value": "00350786",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00350786.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.067Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Ltd"
          },
          {
            "field": "registered_address",
            "value": "NELSON HOUSE, 55-59 VICTORIA ROAD, FARNBOROUGH, ENGLAND, GU14 7PA",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00350786.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.067Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Ltd"
          },
          {
            "field": "business_address",
            "value": "Nelson House, 55-59 Victoria Road, Farnborough, Hampshire GU14 7PA",
            "source_url": "https://www.santaslapland.com/terms-conditions/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Ltd"
          },
          {
            "field": "public_contact",
            "value": "beforeyoutravel@santaslapland.com",
            "source_url": "https://www.santaslapland.com/contact-us/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Ltd"
          },
          {
            "field": "atol_holder",
            "value": "Hotelplan Ltd",
            "source_url": "https://www.santaslapland.com/terms-conditions/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Ltd"
          },
          {
            "field": "atol_number",
            "value": "0025",
            "source_url": "https://www.santaslapland.com/terms-conditions/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.santaslapland.com",
            "source_url": "https://www.santaslapland.com/terms-conditions/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Hotelplan Ltd"
          },
          {
            "field": "specialism",
            "value": "Lapland family holidays",
            "source_url": "https://www.santaslapland.com/terms-conditions/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Hotelplan Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Hotelplan Ltd",
        "business_address": "Nelson House, 55-59 Victoria Road, Farnborough, Hampshire GU14 7PA",
        "public_contact": "beforeyoutravel@santaslapland.com",
        "official_website": "https://www.santaslapland.com",
        "atol_holder": "Hotelplan Ltd",
        "atol_number": "0025"
      }
    },
    "issues": []
  },
  {
    "cell": "A58",
    "aliases": [
      "Silversea"
    ],
    "payload": {
      "name": "Silversea",
      "display_name": "Silversea",
      "website": "https://www.silversea.com",
      "specialism": "Luxury ocean and expedition cruises",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, business_address, public_contact, website, specialism: https://www.silversea.com/guest-terms/united-kingdom/united-kingdom-booking-conditions-en/\natol_holder, atol_number: https://www.silversea.com/guest-terms/united-kingdom/united-kingdom-booking-conditions-en/",
      "notes": "Preferred workbook A58; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. UK company is general sales/representative agent; Silversea Cruises Ltd is cruise principal. Guest-experience email is customer support.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "Silversea Cruises (UK) Ltd.",
            "source_url": "https://www.silversea.com/guest-terms/united-kingdom/united-kingdom-booking-conditions-en/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Silversea Cruises (UK) Ltd."
          },
          {
            "field": "business_address",
            "value": "7 The Heights, Brooklands, Weybridge, Surrey KT13 0NY",
            "source_url": "https://www.silversea.com/guest-terms/united-kingdom/united-kingdom-booking-conditions-en/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Silversea Cruises (UK) Ltd."
          },
          {
            "field": "public_contact",
            "value": "guestexperience@silversea.com",
            "source_url": "https://www.silversea.com/guest-terms/united-kingdom/united-kingdom-booking-conditions-en/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Silversea Cruises (UK) Ltd."
          },
          {
            "field": "atol_holder",
            "value": "Silversea Cruises (UK) Ltd.",
            "source_url": "https://www.silversea.com/guest-terms/united-kingdom/united-kingdom-booking-conditions-en/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Silversea Cruises (UK) Ltd."
          },
          {
            "field": "atol_number",
            "value": "4681",
            "source_url": "https://www.silversea.com/guest-terms/united-kingdom/united-kingdom-booking-conditions-en/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Silversea Cruises (UK) Ltd."
          },
          {
            "field": "official_website",
            "value": "https://www.silversea.com",
            "source_url": "https://www.silversea.com/guest-terms/united-kingdom/united-kingdom-booking-conditions-en/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Silversea Cruises (UK) Ltd."
          },
          {
            "field": "specialism",
            "value": "Luxury ocean and expedition cruises",
            "source_url": "https://www.silversea.com/guest-terms/united-kingdom/united-kingdom-booking-conditions-en/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Silversea Cruises (UK) Ltd."
          }
        ]
      },
      "disclosures": {
        "legal_name": "Silversea Cruises (UK) Ltd.",
        "business_address": "7 The Heights, Brooklands, Weybridge, Surrey KT13 0NY",
        "public_contact": "guestexperience@silversea.com",
        "official_website": "https://www.silversea.com",
        "atol_holder": "Silversea Cruises (UK) Ltd.",
        "atol_number": "4681"
      }
    },
    "issues": [
      "UK company is general sales/representative agent; Silversea Cruises Ltd is cruise principal. Guest-experience email is customer support."
    ]
  },
  {
    "cell": "A59",
    "aliases": [
      "Sixt",
      "SIXT"
    ],
    "payload": {
      "name": "Sixt",
      "display_name": "SIXT",
      "website": "https://www.sixt.co.uk",
      "specialism": "Car hire",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name: https://www.sixt.co.uk/shared/data-protection/DSGVO_sixt_one_en.pdf\nbusiness_address, website, specialism: https://www.sixt.co.uk/pages/imprint/?noredirect=en_GB",
      "notes": "Preferred workbook A59; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Imprint lists register entry 440897 without jurisdiction; not treated as a UK company number.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "Sixt rent a car Ltd.",
            "source_url": "https://www.sixt.co.uk/shared/data-protection/DSGVO_sixt_one_en.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sixt rent a car Ltd."
          },
          {
            "field": "business_address",
            "value": "Keypoint, 17-23 High Street, Slough SL1 1DY",
            "source_url": "https://www.sixt.co.uk/pages/imprint/?noredirect=en_GB",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sixt rent a car Ltd."
          },
          {
            "field": "official_website",
            "value": "https://www.sixt.co.uk",
            "source_url": "https://www.sixt.co.uk/pages/imprint/?noredirect=en_GB",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sixt rent a car Ltd."
          },
          {
            "field": "specialism",
            "value": "Car hire",
            "source_url": "https://www.sixt.co.uk/pages/imprint/?noredirect=en_GB",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Sixt rent a car Ltd."
          }
        ]
      },
      "disclosures": {
        "legal_name": "Sixt rent a car Ltd.",
        "business_address": "Keypoint, 17-23 High Street, Slough SL1 1DY",
        "public_contact": "",
        "official_website": "https://www.sixt.co.uk",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Imprint lists register entry 440897 without jurisdiction; not treated as a UK company number."
    ]
  },
  {
    "cell": "A60",
    "aliases": [
      "Solmar Villas"
    ],
    "payload": {
      "name": "Solmar Villas",
      "display_name": "Solmar Villas",
      "website": "https://www.solmarvillas.com",
      "specialism": "Villa holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism: https://www.solmarvillas.com/information/booking-terms-and-conditions\nlegal_name, company_number: https://find-and-update.company-information.service.gov.uk/company/07174709\nbusiness_address: https://www.solmarvillas.com/contact-us\natol_holder, atol_number: https://www.solmarvillas.com/information/your-financial-protection\npublic_contact: https://www.solmarvillas.com/contact-us\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/07174709.json",
      "notes": "Preferred workbook A60; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Company association supported by matching official Solmar postal address and Companies House registered address, not solely a company-name match. Villa-only and flight-inclusive arrangements require separate protection assessments.",
      "lookup_record": {
        "company_number": "07174709",
        "registered_address": "2/3 FIRST AVENUE, CENTRUM 100, BURTON-ON-TRENT, STAFFORDSHIRE, ENGLAND, DE14 2WE",
        "facts": [
          {
            "field": "legal_name",
            "value": "Solmar Villas Limited",
            "source_url": "https://find-and-update.company-information.service.gov.uk/company/07174709",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Solmar Villas Limited"
          },
          {
            "field": "company_number",
            "value": "07174709",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/07174709.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:14:09.508Z",
            "state": "authoritative-source",
            "entity": "Solmar Villas Limited"
          },
          {
            "field": "registered_address",
            "value": "2/3 FIRST AVENUE, CENTRUM 100, BURTON-ON-TRENT, STAFFORDSHIRE, ENGLAND, DE14 2WE",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/07174709.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:14:09.508Z",
            "state": "authoritative-source",
            "entity": "Solmar Villas Limited"
          },
          {
            "field": "business_address",
            "value": "Units 2 and 3, First Avenue, Centrum 100, Burton upon Trent, Staffordshire DE14 2WE",
            "source_url": "https://www.solmarvillas.com/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Solmar Villas Limited"
          },
          {
            "field": "public_contact",
            "value": "Public contact page: https://www.solmarvillas.com/contact-us",
            "source_url": "https://www.solmarvillas.com/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Solmar Villas Limited"
          },
          {
            "field": "atol_holder",
            "value": "Solmar Villas Limited",
            "source_url": "https://www.solmarvillas.com/information/your-financial-protection",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Solmar Villas Limited"
          },
          {
            "field": "atol_number",
            "value": "10334",
            "source_url": "https://www.solmarvillas.com/information/your-financial-protection",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Solmar Villas Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.solmarvillas.com",
            "source_url": "https://www.solmarvillas.com/information/booking-terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Solmar Villas Limited"
          },
          {
            "field": "specialism",
            "value": "Villa holidays",
            "source_url": "https://www.solmarvillas.com/information/booking-terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Solmar Villas Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Solmar Villas Limited",
        "business_address": "Units 2 and 3, First Avenue, Centrum 100, Burton upon Trent, Staffordshire DE14 2WE",
        "public_contact": "Public contact page: https://www.solmarvillas.com/contact-us",
        "official_website": "https://www.solmarvillas.com",
        "atol_holder": "Solmar Villas Limited",
        "atol_number": "10334"
      }
    },
    "issues": [
      "Company association supported by matching official Solmar postal address and Companies House registered address, not solely a company-name match. Villa-only and flight-inclusive arrangements require separate protection assessments."
    ]
  },
  {
    "cell": "A61",
    "aliases": [
      "Stena Line"
    ],
    "payload": {
      "name": "Stena Line",
      "display_name": "Stena Line",
      "website": "https://www.stenaline.co.uk",
      "specialism": "Ferries",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": ": https://find-and-update.company-information.service.gov.uk/company/02454575\nwebsite, specialism: https://www.stenaline.co.uk/",
      "notes": "Preferred workbook A61; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Multiple UK companies exist (Stena Line Limited 01402237; Stena Line (UK) Limited 02454575). Confirm passenger-route contracting company; no legal company selected from name match alone.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "official_website",
            "value": "https://www.stenaline.co.uk",
            "source_url": "https://www.stenaline.co.uk/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Stena Line"
          },
          {
            "field": "specialism",
            "value": "Ferries",
            "source_url": "https://www.stenaline.co.uk/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Stena Line"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.stenaline.co.uk",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Multiple UK companies exist (Stena Line Limited 01402237; Stena Line (UK) Limited 02454575). Confirm passenger-route contracting company; no legal company selected from name match alone."
    ]
  },
  {
    "cell": "A62",
    "aliases": [
      "Stuba"
    ],
    "payload": {
      "name": "Stuba",
      "display_name": "Stuba",
      "website": "https://stuba.com",
      "specialism": "Trade accommodation and transfers",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "public_contact, website, specialism: https://stuba.com/contact-us/\n: https://stuba.com/terms-conditions/",
      "notes": "Preferred workbook A62; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Official terms describe Stuba service but retrieved text does not identify a single contracting legal entity; obtain New Travel contract entity.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "public_contact",
            "value": "help@stuba.com",
            "source_url": "https://stuba.com/contact-us/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Stuba"
          },
          {
            "field": "official_website",
            "value": "https://stuba.com",
            "source_url": "https://stuba.com/contact-us/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Stuba"
          },
          {
            "field": "specialism",
            "value": "Trade accommodation and transfers",
            "source_url": "https://stuba.com/contact-us/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Stuba"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "help@stuba.com",
        "official_website": "https://stuba.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Official terms describe Stuba service but retrieved text does not identify a single contracting legal entity; obtain New Travel contract entity."
    ]
  },
  {
    "cell": "A63",
    "aliases": [
      "Sun Hotels",
      "Sunhotels"
    ],
    "payload": {
      "name": "Sun Hotels",
      "display_name": "Sunhotels",
      "website": "https://www.sunhotels.com",
      "specialism": "Trade accommodation and travel components",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, website, specialism: https://www.sunhotels.com/en/contact/privacy-policy\nlegal_name: https://www.sunhotels.com/en/contact/terms-and-conditions/\npublic_contact: https://www.sunhotels.com/en/contact/",
      "notes": "Preferred workbook A63; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Dubai registration, not a UK Companies House number. Do not apply this entity to every WebBeds group product.",
      "lookup_record": {
        "company_number": "91277",
        "registered_address": "Suite 3212-3216, Al Shatha Tower, PO Box 502115, Dubai Media City, Dubai, UAE",
        "facts": [
          {
            "field": "legal_name",
            "value": "WebBeds FZ-LLC",
            "source_url": "https://www.sunhotels.com/en/contact/privacy-policy",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "WebBeds FZ-LLC"
          },
          {
            "field": "company_number",
            "value": "91277",
            "source_url": "https://www.sunhotels.com/en/contact/privacy-policy",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "WebBeds FZ-LLC"
          },
          {
            "field": "registered_address",
            "value": "Suite 3212-3216, Al Shatha Tower, PO Box 502115, Dubai Media City, Dubai, UAE",
            "source_url": "https://www.sunhotels.com/en/contact/privacy-policy",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "WebBeds FZ-LLC"
          },
          {
            "field": "public_contact",
            "value": "sales@sunhotels.com",
            "source_url": "https://www.sunhotels.com/en/contact/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "WebBeds FZ-LLC"
          },
          {
            "field": "official_website",
            "value": "https://www.sunhotels.com",
            "source_url": "https://www.sunhotels.com/en/contact/privacy-policy",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "WebBeds FZ-LLC"
          },
          {
            "field": "specialism",
            "value": "Trade accommodation and travel components",
            "source_url": "https://www.sunhotels.com/en/contact/privacy-policy",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "WebBeds FZ-LLC"
          }
        ]
      },
      "disclosures": {
        "legal_name": "WebBeds FZ-LLC",
        "business_address": "",
        "public_contact": "sales@sunhotels.com",
        "official_website": "https://www.sunhotels.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Dubai registration, not a UK Companies House number. Do not apply this entity to every WebBeds group product."
    ]
  },
  {
    "cell": "A64",
    "aliases": [
      "SunTransfers",
      "Suntransfers"
    ],
    "payload": {
      "name": "SunTransfers",
      "display_name": "Suntransfers",
      "website": "https://www.suntransfers.com",
      "specialism": "Airport transfers",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, public_contact, website, specialism: https://www.suntransfers.com/terms-and-conditions\nbusiness_address: https://www.suntransfers.com/contact-us",
      "notes": "Preferred workbook A64; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. ",
      "lookup_record": {
        "company_number": "ES-B64767627",
        "registered_address": "Ctra de l'Estartit 143-145, 17257 Torroella de Montgri, Girona, Spain",
        "facts": [
          {
            "field": "legal_name",
            "value": "ST Services Iberia S.L.",
            "source_url": "https://www.suntransfers.com/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "ST Services Iberia S.L."
          },
          {
            "field": "company_number",
            "value": "ES-B64767627",
            "source_url": "https://www.suntransfers.com/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "ST Services Iberia S.L."
          },
          {
            "field": "registered_address",
            "value": "Ctra de l'Estartit 143-145, 17257 Torroella de Montgri, Girona, Spain",
            "source_url": "https://www.suntransfers.com/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "ST Services Iberia S.L."
          },
          {
            "field": "business_address",
            "value": "Ctra de l'Estartit 143-145, 17257 Torroella de Montgri, Girona, Spain",
            "source_url": "https://www.suntransfers.com/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "ST Services Iberia S.L."
          },
          {
            "field": "public_contact",
            "value": "info@suntransfers.com",
            "source_url": "https://www.suntransfers.com/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "ST Services Iberia S.L."
          },
          {
            "field": "official_website",
            "value": "https://www.suntransfers.com",
            "source_url": "https://www.suntransfers.com/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "ST Services Iberia S.L."
          },
          {
            "field": "specialism",
            "value": "Airport transfers",
            "source_url": "https://www.suntransfers.com/terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "ST Services Iberia S.L."
          }
        ]
      },
      "disclosures": {
        "legal_name": "ST Services Iberia S.L.",
        "business_address": "Ctra de l'Estartit 143-145, 17257 Torroella de Montgri, Girona, Spain",
        "public_contact": "info@suntransfers.com",
        "official_website": "https://www.suntransfers.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": []
  },
  {
    "cell": "A65",
    "aliases": [
      "Sunvil"
    ],
    "payload": {
      "name": "Sunvil",
      "display_name": "Sunvil",
      "website": "https://www.sunvil.co.uk",
      "specialism": "Tailor-made and specialist holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, business_address, atol_holder, atol_number, website, specialism: https://www.sunvil.co.uk/terms\npublic_contact: https://www.sunvil.co.uk/contact-us\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/00984970.json",
      "notes": "Preferred workbook A65; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Contact page heading uses holidays@ but prose also uses holiday@; imported heading address. Verify deliverability if using it; no email sent.",
      "lookup_record": {
        "company_number": "00984970",
        "registered_address": "SUNVIL 16A CROWN ROAD, CROWN YARD, ST MARGARETS, TWICKENHAM, UNITED KINGDOM, TW1 3EE",
        "facts": [
          {
            "field": "legal_name",
            "value": "Sunvil International Sales Limited",
            "source_url": "https://www.sunvil.co.uk/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sunvil International Sales Limited"
          },
          {
            "field": "company_number",
            "value": "00984970",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00984970.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.116Z",
            "state": "authoritative-source",
            "entity": "Sunvil International Sales Limited"
          },
          {
            "field": "registered_address",
            "value": "SUNVIL 16A CROWN ROAD, CROWN YARD, ST MARGARETS, TWICKENHAM, UNITED KINGDOM, TW1 3EE",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00984970.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.116Z",
            "state": "authoritative-source",
            "entity": "Sunvil International Sales Limited"
          },
          {
            "field": "business_address",
            "value": "Crown Yard, 16A Crown Road, St Margaret's, Twickenham, London TW1 3EE",
            "source_url": "https://www.sunvil.co.uk/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sunvil International Sales Limited"
          },
          {
            "field": "public_contact",
            "value": "holidays@sunvil.co.uk",
            "source_url": "https://www.sunvil.co.uk/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sunvil International Sales Limited"
          },
          {
            "field": "atol_holder",
            "value": "Sunvil International Sales Limited",
            "source_url": "https://www.sunvil.co.uk/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sunvil International Sales Limited"
          },
          {
            "field": "atol_number",
            "value": "0808",
            "source_url": "https://www.sunvil.co.uk/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sunvil International Sales Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.sunvil.co.uk",
            "source_url": "https://www.sunvil.co.uk/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Sunvil International Sales Limited"
          },
          {
            "field": "specialism",
            "value": "Tailor-made and specialist holidays",
            "source_url": "https://www.sunvil.co.uk/terms",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Sunvil International Sales Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Sunvil International Sales Limited",
        "business_address": "Crown Yard, 16A Crown Road, St Margaret's, Twickenham, London TW1 3EE",
        "public_contact": "holidays@sunvil.co.uk",
        "official_website": "https://www.sunvil.co.uk",
        "atol_holder": "Sunvil International Sales Limited",
        "atol_number": "0808"
      }
    },
    "issues": [
      "Contact page heading uses holidays@ but prose also uses holiday@; imported heading address. Verify deliverability if using it; no email sent."
    ]
  },
  {
    "cell": "A66",
    "aliases": [
      "Teldar Travel"
    ],
    "payload": {
      "name": "Teldar Travel",
      "display_name": "Teldar Travel",
      "website": "https://teldartravel.com",
      "specialism": "Trade accommodation",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism: https://gekko-group.com/en/our-brands-2/teldar-travel/",
      "notes": "Preferred workbook A66; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Gekko confirms Teldar Travel brand. UK company 11866581 exists but brand/contract relationship not established; obtain contracting entity from New Travel agreement.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "official_website",
            "value": "https://teldartravel.com",
            "source_url": "https://gekko-group.com/en/our-brands-2/teldar-travel/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Teldar Travel"
          },
          {
            "field": "specialism",
            "value": "Trade accommodation",
            "source_url": "https://gekko-group.com/en/our-brands-2/teldar-travel/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Teldar Travel"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://teldartravel.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Gekko confirms Teldar Travel brand. UK company 11866581 exists but brand/contract relationship not established; obtain contracting entity from New Travel agreement."
    ]
  },
  {
    "cell": "A67",
    "aliases": [
      "Teldar Corporate"
    ],
    "payload": {
      "name": "Teldar Corporate",
      "display_name": "Teldar Corporate",
      "website": "",
      "specialism": "Corporate hotel distribution — division unresolved",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "",
      "notes": "Preferred workbook A67; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. No reliable public page establishing this exact division found. Confirm portal and contracting company via New Travel; do not use unrelated teldar.ch or Teldan records.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": []
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "No reliable public page establishing this exact division found. Confirm portal and contracting company via New Travel; do not use unrelated teldar.ch or Teldan records."
    ]
  },
  {
    "cell": "A68",
    "aliases": [
      "Titan Travel"
    ],
    "payload": {
      "name": "Titan Travel",
      "display_name": "Titan Travel",
      "website": "https://www.titantravel.co.uk",
      "specialism": "Escorted tours",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, website, specialism: https://a.storyblok.com/f/108167/x/c72b0d71d5/titan-booking-conditions.pdf\npublic_contact: https://www.titantravel.co.uk/contact-us",
      "notes": "Preferred workbook A68; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. Official hosted booking terms identify Saga Travel Group (UK) Limited; do not substitute historical Titan entity or a remembered ATOL. Current licence and business address remain unestablished.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "Saga Travel Group (UK) Limited",
            "source_url": "https://a.storyblok.com/f/108167/x/c72b0d71d5/titan-booking-conditions.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Saga Travel Group (UK) Limited"
          },
          {
            "field": "public_contact",
            "value": "Public contact page: https://www.titantravel.co.uk/contact-us",
            "source_url": "https://www.titantravel.co.uk/contact-us",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Saga Travel Group (UK) Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.titantravel.co.uk",
            "source_url": "https://a.storyblok.com/f/108167/x/c72b0d71d5/titan-booking-conditions.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Saga Travel Group (UK) Limited"
          },
          {
            "field": "specialism",
            "value": "Escorted tours",
            "source_url": "https://a.storyblok.com/f/108167/x/c72b0d71d5/titan-booking-conditions.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Saga Travel Group (UK) Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Saga Travel Group (UK) Limited",
        "business_address": "",
        "public_contact": "Public contact page: https://www.titantravel.co.uk/contact-us",
        "official_website": "https://www.titantravel.co.uk",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Official hosted booking terms identify Saga Travel Group (UK) Limited; do not substitute historical Titan entity or a remembered ATOL. Current licence and business address remain unestablished."
    ]
  },
  {
    "cell": "A69",
    "aliases": [
      "Travelpack"
    ],
    "payload": {
      "name": "Travelpack",
      "display_name": "Travelpack",
      "website": "https://www.travelpack.com",
      "specialism": "Trade flights and tailor-made holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, website, specialism: https://www.travelpack.com/public/imagedb/defaults/Travelpack-Limited-Booking-Conditions.pdf\npublic_contact: https://www.travelpack.com/general/contactus\natol_holder, atol_number: https://www.travelpack.com/public/imagedb/defaults/Travelpack-Limited-Booking-Conditions.pdf\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/09712043.json\nlegal_name: https://data.companieshouse.gov.uk/doc/company/09712043.json",
      "notes": "Preferred workbook A69; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. PDF filename says Travelpack Limited, but operative contract names Travelpack Marketing & Leisure Services Ltd. Public email is the flights department. Companies House now names 09712043 TRAVELPACK LIMITED; official terms still use Travelpack Marketing & Leisure Services Ltd. Current legal name imported; confirm current ATOL holder wording before advertising.",
      "lookup_record": {
        "company_number": "09712043",
        "registered_address": "523 HIGH ROAD, WEMBLEY, MIDDLESEX, ENGLAND, HA0 2DH",
        "facts": [
          {
            "field": "legal_name",
            "value": "Travelpack Limited",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/09712043.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travelpack Limited"
          },
          {
            "field": "company_number",
            "value": "09712043",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/09712043.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.097Z",
            "state": "authoritative-source",
            "entity": "Travelpack Limited"
          },
          {
            "field": "registered_address",
            "value": "523 HIGH ROAD, WEMBLEY, MIDDLESEX, ENGLAND, HA0 2DH",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/09712043.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.097Z",
            "state": "authoritative-source",
            "entity": "Travelpack Limited"
          },
          {
            "field": "public_contact",
            "value": "flights@travelpack.com",
            "source_url": "https://www.travelpack.com/general/contactus",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travelpack Limited"
          },
          {
            "field": "atol_holder",
            "value": "Travelpack Marketing & Leisure Services Ltd",
            "source_url": "https://www.travelpack.com/public/imagedb/defaults/Travelpack-Limited-Booking-Conditions.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travelpack Marketing & Leisure Services Ltd"
          },
          {
            "field": "atol_number",
            "value": "2866",
            "source_url": "https://www.travelpack.com/public/imagedb/defaults/Travelpack-Limited-Booking-Conditions.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travelpack Marketing & Leisure Services Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.travelpack.com",
            "source_url": "https://www.travelpack.com/public/imagedb/defaults/Travelpack-Limited-Booking-Conditions.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Travelpack Limited"
          },
          {
            "field": "specialism",
            "value": "Trade flights and tailor-made holidays",
            "source_url": "https://www.travelpack.com/public/imagedb/defaults/Travelpack-Limited-Booking-Conditions.pdf",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Travelpack Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Travelpack Limited",
        "business_address": "",
        "public_contact": "flights@travelpack.com",
        "official_website": "https://www.travelpack.com",
        "atol_holder": "Travelpack Marketing & Leisure Services Ltd",
        "atol_number": "2866"
      }
    },
    "issues": [
      "PDF filename says Travelpack Limited, but operative contract names Travelpack Marketing & Leisure Services Ltd. Public email is the flights department.",
      "Companies House now names 09712043 TRAVELPACK LIMITED; official terms still use Travelpack Marketing & Leisure Services Ltd. Current legal name imported; confirm current ATOL holder wording before advertising."
    ]
  },
  {
    "cell": "A70",
    "aliases": [
      "Tui",
      "TUI"
    ],
    "payload": {
      "name": "Tui",
      "display_name": "TUI",
      "website": "https://www.tui.co.uk",
      "specialism": "Package holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, atol_holder, atol_number, website, specialism: https://www.tui.co.uk/destinations/info/website-terms-and-conditions\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/02830117.json",
      "notes": "Preferred workbook A70; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. ",
      "lookup_record": {
        "company_number": "02830117",
        "registered_address": "WIGMORE HOUSE, WIGMORE LANE, LUTON, BEDFORDSHIRE, UNITED KINGDOM, LU2 9TN",
        "facts": [
          {
            "field": "legal_name",
            "value": "TUI UK Limited",
            "source_url": "https://www.tui.co.uk/destinations/info/website-terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "TUI UK Limited"
          },
          {
            "field": "company_number",
            "value": "02830117",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/02830117.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.116Z",
            "state": "authoritative-source",
            "entity": "TUI UK Limited"
          },
          {
            "field": "registered_address",
            "value": "WIGMORE HOUSE, WIGMORE LANE, LUTON, BEDFORDSHIRE, UNITED KINGDOM, LU2 9TN",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/02830117.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.116Z",
            "state": "authoritative-source",
            "entity": "TUI UK Limited"
          },
          {
            "field": "atol_holder",
            "value": "TUI UK Limited",
            "source_url": "https://www.tui.co.uk/destinations/info/website-terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "TUI UK Limited"
          },
          {
            "field": "atol_number",
            "value": "2524",
            "source_url": "https://www.tui.co.uk/destinations/info/website-terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "TUI UK Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.tui.co.uk",
            "source_url": "https://www.tui.co.uk/destinations/info/website-terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "TUI UK Limited"
          },
          {
            "field": "specialism",
            "value": "Package holidays",
            "source_url": "https://www.tui.co.uk/destinations/info/website-terms-and-conditions",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "TUI UK Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "TUI UK Limited",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.tui.co.uk",
        "atol_holder": "TUI UK Limited",
        "atol_number": "2524"
      }
    },
    "issues": []
  },
  {
    "cell": "A71",
    "aliases": [
      "Us Airtours",
      "USAirtours"
    ],
    "payload": {
      "name": "Us Airtours",
      "display_name": "USAirtours",
      "website": "https://usairtours.co.uk",
      "specialism": "North America and cruise holidays",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism: https://usairtours.co.uk/booking-conditions/?swcfpc=1\nbusiness_address: https://usairtours.co.uk/contact-us/",
      "notes": "Preferred workbook A71; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. Current official terms heading says USAirtours Worldwide Limited, but operative text misspells USAIRTOUS WORLD WIDE LTD and quotes ATOL 12850. Different UK company 09640358 is not a safe substitute. Confirm exact holder/company before importing legal or licence pair.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "business_address",
            "value": "Saxon House, 27 Duke Street, Chelmsford, Essex CM1 1HT",
            "source_url": "https://usairtours.co.uk/contact-us/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "USAirtours"
          },
          {
            "field": "official_website",
            "value": "https://usairtours.co.uk",
            "source_url": "https://usairtours.co.uk/booking-conditions/?swcfpc=1",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "USAirtours"
          },
          {
            "field": "specialism",
            "value": "North America and cruise holidays",
            "source_url": "https://usairtours.co.uk/booking-conditions/?swcfpc=1",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "USAirtours"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "Saxon House, 27 Duke Street, Chelmsford, Essex CM1 1HT",
        "public_contact": "",
        "official_website": "https://usairtours.co.uk",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Current official terms heading says USAirtours Worldwide Limited, but operative text misspells USAIRTOUS WORLD WIDE LTD and quotes ATOL 12850. Different UK company 09640358 is not a safe substitute. Confirm exact holder/company before importing legal or licence pair."
    ]
  },
  {
    "cell": "A72",
    "aliases": [
      "UTC Travel"
    ],
    "payload": {
      "name": "UTC Travel",
      "display_name": "UTC Travel",
      "website": "https://utc.travel",
      "specialism": "Travel membership and booking platform",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "website, specialism: https://utctravel.outseta.com/support/kb/articles/rm0w41WX/how-can-i-contact-you\npublic_contact: https://utctravel.outseta.com/support/kb/articles/rm0w41WX/how-can-i-contact-you",
      "notes": "Preferred workbook A72; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Official support page supplies phone 01133 404 444 but email is obfuscated in retrieved text. Contracting company and any organiser licence unresolved; request account terms from New Travel.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "public_contact",
            "value": "Public contact page: https://utctravel.outseta.com/support/kb/articles/rm0w41WX/how-can-i-contact-you",
            "source_url": "https://utctravel.outseta.com/support/kb/articles/rm0w41WX/how-can-i-contact-you",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "UTC Travel"
          },
          {
            "field": "official_website",
            "value": "https://utc.travel",
            "source_url": "https://utctravel.outseta.com/support/kb/articles/rm0w41WX/how-can-i-contact-you",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "UTC Travel"
          },
          {
            "field": "specialism",
            "value": "Travel membership and booking platform",
            "source_url": "https://utctravel.outseta.com/support/kb/articles/rm0w41WX/how-can-i-contact-you",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "UTC Travel"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "Public contact page: https://utctravel.outseta.com/support/kb/articles/rm0w41WX/how-can-i-contact-you",
        "official_website": "https://utc.travel",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Official support page supplies phone 01133 404 444 but email is obfuscated in retrieved text. Contracting company and any organiser licence unresolved; request account terms from New Travel."
    ]
  },
  {
    "cell": "A73",
    "aliases": [
      "Virgin Voyages"
    ],
    "payload": {
      "name": "Virgin Voyages",
      "display_name": "Virgin Voyages",
      "website": "https://www.virginvoyages.com",
      "specialism": "Adult ocean cruises",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, business_address, website, specialism: https://www.virginvoyages.com/uk-ticket-contract",
      "notes": "Preferred workbook A73; researched 24 October 2026. Original name preserved. Not established; do not advertise ATOL protection from this record. UK ticket contract names Bermuda company with Florida booking office. Do not infer ATOL coverage for an agent-created fly-cruise from cruise brand alone.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "legal_name",
            "value": "Virgin Cruises Intermediate Limited",
            "source_url": "https://www.virginvoyages.com/uk-ticket-contract",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Virgin Cruises Intermediate Limited"
          },
          {
            "field": "business_address",
            "value": "1000 S. Pine Island Road, Suite 600, Plantation, Florida 33324, USA",
            "source_url": "https://www.virginvoyages.com/uk-ticket-contract",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Virgin Cruises Intermediate Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.virginvoyages.com",
            "source_url": "https://www.virginvoyages.com/uk-ticket-contract",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Virgin Cruises Intermediate Limited"
          },
          {
            "field": "specialism",
            "value": "Adult ocean cruises",
            "source_url": "https://www.virginvoyages.com/uk-ticket-contract",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Virgin Cruises Intermediate Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Virgin Cruises Intermediate Limited",
        "business_address": "1000 S. Pine Island Road, Suite 600, Plantation, Florida 33324, USA",
        "public_contact": "",
        "official_website": "https://www.virginvoyages.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "UK ticket contract names Bermuda company with Florida booking office. Do not infer ATOL coverage for an agent-created fly-cruise from cruise brand alone."
    ]
  },
  {
    "cell": "A74",
    "aliases": [
      "WDTC - Walt Disney World",
      "Walt Disney Travel Company — Walt Disney World"
    ],
    "payload": {
      "name": "WDTC - Walt Disney World",
      "display_name": "Walt Disney Travel Company — Walt Disney World",
      "website": "https://www.disneyholidays.co.uk/walt-disney-world",
      "specialism": "Disney holiday packages",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, public_contact, atol_holder, atol_number, website, specialism: https://www.disneyholidays.co.uk/walt-disney-world/help/terms-conditions/\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/00530051.json",
      "notes": "Preferred workbook A74; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. WDTC is a division of the UK company. This is the WDTC booking channel, not automatically the entity selling directly on disneylandparis.com.",
      "lookup_record": {
        "company_number": "00530051",
        "registered_address": "3 QUEEN CAROLINE STREET, HAMMERSMITH, LONDON, W6 9PE",
        "facts": [
          {
            "field": "legal_name",
            "value": "The Walt Disney Company Limited",
            "source_url": "https://www.disneyholidays.co.uk/walt-disney-world/help/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "company_number",
            "value": "00530051",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00530051.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.170Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "registered_address",
            "value": "3 QUEEN CAROLINE STREET, HAMMERSMITH, LONDON, W6 9PE",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00530051.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.170Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "public_contact",
            "value": "disneytraveluk@disneyonline.com",
            "source_url": "https://www.disneyholidays.co.uk/walt-disney-world/help/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "atol_holder",
            "value": "The Walt Disney Company Limited",
            "source_url": "https://www.disneyholidays.co.uk/walt-disney-world/help/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "atol_number",
            "value": "10401",
            "source_url": "https://www.disneyholidays.co.uk/walt-disney-world/help/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.disneyholidays.co.uk/walt-disney-world",
            "source_url": "https://www.disneyholidays.co.uk/walt-disney-world/help/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "specialism",
            "value": "Disney holiday packages",
            "source_url": "https://www.disneyholidays.co.uk/walt-disney-world/help/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "The Walt Disney Company Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "The Walt Disney Company Limited",
        "business_address": "",
        "public_contact": "disneytraveluk@disneyonline.com",
        "official_website": "https://www.disneyholidays.co.uk/walt-disney-world",
        "atol_holder": "The Walt Disney Company Limited",
        "atol_number": "10401"
      }
    },
    "issues": [
      "WDTC is a division of the UK company. This is the WDTC booking channel, not automatically the entity selling directly on disneylandparis.com."
    ]
  },
  {
    "cell": "A75",
    "aliases": [
      "WDTC - Disneyland Paris",
      "Walt Disney Travel Company — Disneyland Paris"
    ],
    "payload": {
      "name": "WDTC - Disneyland Paris",
      "display_name": "Walt Disney Travel Company — Disneyland Paris",
      "website": "https://www.disneyholidays.co.uk/disneyland-paris",
      "specialism": "Disney holiday packages",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, registered_address, public_contact, atol_holder, atol_number, website, specialism: https://www.disneyholidays.co.uk/disneyland-paris/help/terms-conditions/\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/00530051.json",
      "notes": "Preferred workbook A75; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. WDTC is a division of the UK company. This is the WDTC booking channel, not automatically the entity selling directly on disneylandparis.com.",
      "lookup_record": {
        "company_number": "00530051",
        "registered_address": "3 QUEEN CAROLINE STREET, HAMMERSMITH, LONDON, W6 9PE",
        "facts": [
          {
            "field": "legal_name",
            "value": "The Walt Disney Company Limited",
            "source_url": "https://www.disneyholidays.co.uk/disneyland-paris/help/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "company_number",
            "value": "00530051",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00530051.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.170Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "registered_address",
            "value": "3 QUEEN CAROLINE STREET, HAMMERSMITH, LONDON, W6 9PE",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/00530051.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.170Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "public_contact",
            "value": "disneytraveluk@disneyonline.com",
            "source_url": "https://www.disneyholidays.co.uk/disneyland-paris/help/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "atol_holder",
            "value": "The Walt Disney Company Limited",
            "source_url": "https://www.disneyholidays.co.uk/disneyland-paris/help/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "atol_number",
            "value": "10401",
            "source_url": "https://www.disneyholidays.co.uk/disneyland-paris/help/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "official_website",
            "value": "https://www.disneyholidays.co.uk/disneyland-paris",
            "source_url": "https://www.disneyholidays.co.uk/disneyland-paris/help/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "The Walt Disney Company Limited"
          },
          {
            "field": "specialism",
            "value": "Disney holiday packages",
            "source_url": "https://www.disneyholidays.co.uk/disneyland-paris/help/terms-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "The Walt Disney Company Limited"
          }
        ]
      },
      "disclosures": {
        "legal_name": "The Walt Disney Company Limited",
        "business_address": "",
        "public_contact": "disneytraveluk@disneyonline.com",
        "official_website": "https://www.disneyholidays.co.uk/disneyland-paris",
        "atol_holder": "The Walt Disney Company Limited",
        "atol_number": "10401"
      }
    },
    "issues": [
      "WDTC is a division of the UK company. This is the WDTC booking channel, not automatically the entity selling directly on disneylandparis.com."
    ]
  },
  {
    "cell": "A76",
    "aliases": [
      "Webbeds",
      "WebBeds"
    ],
    "payload": {
      "name": "Webbeds",
      "display_name": "WebBeds",
      "website": "https://www.webbeds.com",
      "specialism": "Trade accommodation distribution",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": ": https://find-and-update.company-information.service.gov.uk/company/07761565\n: https://find-and-update.company-information.service.gov.uk/company/04714729\nwebsite, specialism: https://www.webbeds.com/",
      "notes": "Preferred workbook A76; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Official group website established. Group includes WebBeds Limited 07761565, WebBeds UK Services Limited 04714729 and WebBeds FZ-LLC. Confirm contracting entity from New Travel agreement; do not merge with Sunhotels solely by ownership.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "official_website",
            "value": "https://www.webbeds.com",
            "source_url": "https://www.webbeds.com/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "WebBeds"
          },
          {
            "field": "specialism",
            "value": "Trade accommodation distribution",
            "source_url": "https://www.webbeds.com/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "WebBeds"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://www.webbeds.com",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Official group website established. Group includes WebBeds Limited 07761565, WebBeds UK Services Limited 04714729 and WebBeds FZ-LLC. Confirm contracting entity from New Travel agreement; do not merge with Sunhotels solely by ownership."
    ]
  },
  {
    "cell": "A77",
    "aliases": [
      "WendyWu",
      "Wendy Wu Tours"
    ],
    "payload": {
      "name": "WendyWu",
      "display_name": "Wendy Wu Tours",
      "website": "https://www.wendywutours.co.uk",
      "specialism": "Asia and specialist escorted tours",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": "legal_name, company_number, business_address, public_contact, website, specialism: https://blog.wendywutours.co.uk/help-and-advice/booking-conditions/\natol_holder, atol_number: https://webservices.wendywutours.co.uk/help-and-advice/booking-conditions/\ncompany_number, registered_address: https://data.companieshouse.gov.uk/doc/company/05107061.json",
      "notes": "Preferred workbook A77; researched 24 October 2026. Original name preserved. Official supplier states this ATOL for qualifying flight-inclusive arrangements; current CAA register entry not independently confirmed. Check the actual organiser/certificate for each offer. Published email is operations for booking changes. Legal facts retrieved on official blog/webservices subdomains; review against current agreement, not older third-party office addresses.",
      "lookup_record": {
        "company_number": "05107061",
        "registered_address": "151F TOWER BRIDGE ROAD, LONDON, ENGLAND, SE1 3JE",
        "facts": [
          {
            "field": "legal_name",
            "value": "Wendy Wu Tours Ltd",
            "source_url": "https://blog.wendywutours.co.uk/help-and-advice/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Wendy Wu Tours Ltd"
          },
          {
            "field": "company_number",
            "value": "05107061",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/05107061.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.184Z",
            "state": "authoritative-source",
            "entity": "Wendy Wu Tours Ltd"
          },
          {
            "field": "registered_address",
            "value": "151F TOWER BRIDGE ROAD, LONDON, ENGLAND, SE1 3JE",
            "source_url": "https://data.companieshouse.gov.uk/doc/company/05107061.json",
            "source_type": "companies-house",
            "retrieved_at": "2026-10-24T17:10:50.184Z",
            "state": "authoritative-source",
            "entity": "Wendy Wu Tours Ltd"
          },
          {
            "field": "business_address",
            "value": "Newhams Yard, 151-153 Tower Bridge Road, London SE1 3JE",
            "source_url": "https://blog.wendywutours.co.uk/help-and-advice/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Wendy Wu Tours Ltd"
          },
          {
            "field": "public_contact",
            "value": "operations@wendywutours.co.uk",
            "source_url": "https://blog.wendywutours.co.uk/help-and-advice/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Wendy Wu Tours Ltd"
          },
          {
            "field": "atol_holder",
            "value": "Wendy Wu Tours Ltd",
            "source_url": "https://webservices.wendywutours.co.uk/help-and-advice/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Wendy Wu Tours Ltd"
          },
          {
            "field": "atol_number",
            "value": "6639",
            "source_url": "https://webservices.wendywutours.co.uk/help-and-advice/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Wendy Wu Tours Ltd"
          },
          {
            "field": "official_website",
            "value": "https://www.wendywutours.co.uk",
            "source_url": "https://blog.wendywutours.co.uk/help-and-advice/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "Wendy Wu Tours Ltd"
          },
          {
            "field": "specialism",
            "value": "Asia and specialist escorted tours",
            "source_url": "https://blog.wendywutours.co.uk/help-and-advice/booking-conditions/",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "Wendy Wu Tours Ltd"
          }
        ]
      },
      "disclosures": {
        "legal_name": "Wendy Wu Tours Ltd",
        "business_address": "Newhams Yard, 151-153 Tower Bridge Road, London SE1 3JE",
        "public_contact": "operations@wendywutours.co.uk",
        "official_website": "https://www.wendywutours.co.uk",
        "atol_holder": "Wendy Wu Tours Ltd",
        "atol_number": "6639"
      }
    },
    "issues": [
      "Published email is operations for booking changes. Legal facts retrieved on official blog/webservices subdomains; review against current agreement, not older third-party office addresses."
    ]
  },
  {
    "cell": "A78",
    "aliases": [
      "Cruisingpower",
      "CruisingPower"
    ],
    "payload": {
      "name": "Cruisingpower",
      "display_name": "CruisingPower",
      "website": "https://secure.cruisingpower.com/home",
      "specialism": "Cruise trade booking portal",
      "active": false,
      "permission": "pending",
      "network_confirmed": true,
      "permission_basis": "new-travel-network",
      "usage_notes": "Dale's written confirmation: It's no worries at all to put whatever offers you see from suppliers we work with on your site as long as you stipulate who the offer is with. Date of original confirmation not supplied; not invented. Does not grant supplier-specific artwork rights.",
      "disclosure_evidence": ": https://www.royalcaribbean.com/guest-terms/gb/united-kingdom-english/\nwebsite, specialism: https://secure.cruisingpower.com/home",
      "notes": "Preferred workbook A78; researched 24 October 2026. Original name preserved. Component, distributor or platform: ATOL is not inherent to the standalone service. No own licence established; any flight-inclusive package needs its actual organiser checked. Official trade portal identified; not a single organiser. Select actual Royal Caribbean group cruise brand/carrier and flight-package holder per offer. No authenticated portal access attempted.",
      "lookup_record": {
        "company_number": "",
        "registered_address": "",
        "facts": [
          {
            "field": "official_website",
            "value": "https://secure.cruisingpower.com/home",
            "source_url": "https://secure.cruisingpower.com/home",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "authoritative-source",
            "entity": "CruisingPower"
          },
          {
            "field": "specialism",
            "value": "Cruise trade booking portal",
            "source_url": "https://secure.cruisingpower.com/home",
            "source_type": "official-operator",
            "retrieved_at": "2026-10-24T00:00:00.000Z",
            "state": "suggested",
            "entity": "CruisingPower"
          }
        ]
      },
      "disclosures": {
        "legal_name": "",
        "business_address": "",
        "public_contact": "",
        "official_website": "https://secure.cruisingpower.com/home",
        "atol_holder": "",
        "atol_number": ""
      }
    },
    "issues": [
      "Official trade portal identified; not a single organiser. Select actual Royal Caribbean group cruise brand/carrier and flight-package holder per offer. No authenticated portal access attempted."
    ]
  }
]
$pbj_data$::jsonb);
do $$begin
  if (select count(*) from pbj_preferred_input)<>76 then raise exception 'Expected exactly 76 preferred names'; end if;
  if exists(select 1 from pbj_preferred_input a join pbj_preferred_input b on a.item->>'cell'<b.item->>'cell'
    cross join lateral jsonb_array_elements_text(a.item->'aliases') x
    cross join lateral jsonb_array_elements_text(b.item->'aliases') y
    where lower(btrim(regexp_replace(x.value,'\s+',' ','g')))=lower(btrim(regexp_replace(y.value,'\s+',' ','g'))))
  then raise exception 'Overlapping import aliases: review batch before applying'; end if;
end $$;
create temporary table pbj_preferred_plan on commit drop as
with input as (
  select item, item->'payload' p,
    lower(regexp_replace(split_part(regexp_replace(item#>>'{payload,website}','^https://',''), '/',1),'^www\.','')) host
  from pbj_preferred_input
), records as (
  select s.*,i.name,i.normalised_name,i.website,i.lookup_record,
    (i.permission='pending' and i.permission_date is null and i.disclosures_verified_at is null
      and i.website='' and i.agent_url='' and i.contact='' and i.account_reference=''
      and i.usage_notes='' and i.disclosure_evidence='' and i.revision=1
      and s.logo_id is null and s.logo_alt='' and s.specialism=''
      and not exists(select 1 from jsonb_each_text(s.disclosures) d where d.value<>'')
      and coalesce(i.lookup_record->>'company_number','')='' and coalesce(i.lookup_record->>'registered_address','')=''
      and coalesce(i.lookup_record->'facts','[]'::jsonb)='[]'::jsonb
      and (i.notes='' or i.notes like 'Name from New Travel preferred supplier list: Sheet1!%')
      and lower(btrim(regexp_replace(s.display_name,'\s+',' ','g')))=i.normalised_name
      and not exists(select 1 from public.holiday_offers o where o.supplier_id=s.id)) name_only
    ,
    lower(regexp_replace(split_part(regexp_replace(coalesce(nullif(i.website,''),s.disclosures->>'official_website',''),'^https://',''), '/',1),'^www\.','')) host
  from public.holiday_offer_suppliers s left join cms_private.offer_supplier_information i on i.supplier_id=s.id
)
select input.item, input.p, exact.ids,exact.names exact_matches, possible.names possible_matches,
  case when cardinality(exact.names)>1 then 'review_multiple_matches'
    when cardinality(exact.names)=1 and exact.name_only then 'enrich_name_only_draft'
    when cardinality(exact.names)=1 then 'preserve_existing'
    when cardinality(possible.names)>0 then 'review_possible_duplicate'
    else 'insert_pending_review' end action
from input
cross join lateral (
  select coalesce(array_agg(r.display_name order by r.display_name),'{}'::text[]) names,
    array_agg(r.id) ids,bool_and(r.name_only) name_only
  from records r where exists(select 1 from jsonb_array_elements_text(input.item->'aliases') a
    where lower(btrim(regexp_replace(a.value,'\s+',' ','g'))) in
      (lower(btrim(regexp_replace(r.display_name,'\s+',' ','g'))),r.normalised_name))
) exact
cross join lateral (
  select coalesce(array_agg(r.display_name order by r.display_name),'{}'::text[]) names
  from records r where
    (coalesce(input.p#>>'{lookup_record,company_number}','')<>'' and input.p#>>'{lookup_record,company_number}'=r.lookup_record->>'company_number')
    or (coalesce(input.p#>>'{disclosures,legal_name}','')<>'' and lower(input.p#>>'{disclosures,legal_name}')=lower(r.disclosures->>'legal_name'))
    or (input.host<>'' and input.host=r.host and (select count(*) from input other where other.host=input.host)=1)
) possible;
do $$declare r record; sid uuid; begin
  if not (select apply from pbj_preferred_control) then return; end if;
  for r in select * from pbj_preferred_plan where action='insert_pending_review' loop
    insert into public.holiday_offer_suppliers(display_name,specialism,disclosures)
      values(r.p->>'display_name',r.p->>'specialism',r.p->'disclosures') returning id into sid;
    insert into cms_private.offer_supplier_information
      (supplier_id,name,website,notes,active,permission,network_confirmed,permission_basis,usage_notes,disclosure_evidence,lookup_record)
      values(sid,r.p->>'name',r.p->>'website',r.p->>'notes',false,'pending',true,'new-travel-network',r.p->>'usage_notes',r.p->>'disclosure_evidence',r.p->'lookup_record');
  end loop;
  for r in select * from pbj_preferred_plan where action='enrich_name_only_draft' loop
    -- Only untouched, empty, revision-1 drafts with no linked offers qualify.
    -- IDs and original names remain; no existing researched/verified field is replaced.
    update public.holiday_offer_suppliers set display_name=r.p->>'display_name',specialism=r.p->>'specialism',disclosures=r.p->'disclosures' where id=r.ids[1];
    update cms_private.offer_supplier_information set website=r.p->>'website',
      notes=concat_ws(E'\n\n',nullif(notes,''),r.p->>'notes'),network_confirmed=true,
      permission_basis='new-travel-network',usage_notes=r.p->>'usage_notes',disclosure_evidence=r.p->>'disclosure_evidence',
      lookup_record=r.p->'lookup_record',revision=revision+1 where supplier_id=r.ids[1];
  end loop;
end $$;
-- Each result row includes mode/count. Existing researched or reviewed records
-- are NEVER overwritten. Only untouched, empty drafts qualify for enrichment.
-- All source provenance, network evidence and review notes remain cms_private.
select (select apply from pbj_preferred_control) applied,
  action,count(*) over(partition by action) action_count,
  item->>'cell' workbook_cell,p->>'name' workbook_name,p->>'display_name' display_name,
  exact_matches,possible_matches,p#>>'{disclosures,legal_name}' legal_name,
  p#>>'{disclosures,business_address}' business_address,
  p#>>'{disclosures,public_contact}' public_contact,p->>'website' website,
  p#>>'{disclosures,atol_holder}' supplier_stated_atol_holder,
  p#>>'{disclosures,atol_number}' supplier_stated_atol_number,item->'issues' review_notes
from pbj_preferred_plan order by p->>'name';
commit;
