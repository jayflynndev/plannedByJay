# Supplier directory

## Adding and editing suppliers

Open **Admin → Suppliers** and search the saved directory first. Search filters saved names, websites and specialisms instantly. If no record exists, choose **Add Supplier**.

Enter or paste the details in the form:

1. Supplier name.
2. Official website.
3. Legal/trading company name.
4. Public business/contact address.
5. Public contact email or official contact-page URL. Either is sufficient; both are not required.
6. ATOL holder, where applicable.
7. ATOL number, where applicable.
8. Supplier booking-conditions URL.
9. Supplier specialism, using a suggested value or your own text.

Only the supplier name is required. ATOL details are optional, and incomplete records can be saved with **Save Draft**. Choose **Approved** when Jay has checked the supplier information and is happy to use it. There is no additional approval procedure.

Use **Save Supplier** for a new record and **Save Changes** for an existing one. Confirmation or an error appears beside the controls and is announced accessibly. Requests prevent duplicate submissions; failed saves keep entered details. Existing information loads for editing without re-entry. Save regularly; unsaved edits raise a browser warning when leaving.

## Directory and archiving

The empty directory displays “No suppliers added yet.” Duplicate names ignore case and repeated whitespace. Archived names remain reserved: select **Include archived suppliers**, find the existing record and restore it instead of adding it again.

**Archive** and **Restore** require confirmation. Archiving retains the supplier's stable ID and saved information. Permanent deletion is unavailable, preserving future references. All records, including Approved records, remain private to the authorised administrator. The existing login and database permissions are unchanged.

## Setup and existing records

**No migration is required for the manual-form cleanup.** Existing supplier records and fields are unchanged. Historical source metadata remains untouched in the existing database column; the application no longer reads, displays or writes it.

For a fresh installation only, manually run `supabase/migrations/20261026_suppliers_directory.sql` in Supabase SQL Editor against the existing project. The Articles admin function must already exist. Do not re-run the original Articles setup or recreate an existing supplier database. No new credentials, services, environment variables or dependencies are needed. Nothing is applied to hosted Supabase automatically.

The form has no automated supplier research or external integration. Articles and Holiday Types retain their existing behaviour. Offers, bookings and enquiries remain outside this directory.

Validation: all 29 automated tests, ESLint, TypeScript validation and the production build passed. Tests used a temporary WebSocket preload for the installed Node 20 shell runtime, then removed it. Use the project's declared Node 22.13+ runtime for normal commands. No hosted records or database settings were changed.
