import Link from 'next/link';
export default function AdminHome() {
  return (
    <>
      <h1>Website administration</h1>
      <p>Manage Articles, Holiday Types and supplier contact details.</p>
      <a className="button" href="/admin/articles">
        Open Articles
      </a>
      <a className="button button-secondary" href="/admin/holiday-types">Open Holiday Types</a>
      <a className="button button-secondary" href="/admin/suppliers">Open Suppliers</a>
      <a className="button button-secondary" href="/admin/holiday-offers">Open Holiday Offers</a>
      <a className="button button-secondary" href="/admin/offer-enquiries">Open Offer Enquiries</a>
      <Link className="button button-secondary" href="/admin/bespoke-enquiries">Open Bespoke Enquiries</Link>
    </>
  );
}
