export default function AdminHome() {
  return (
    <>
      <h1>Website administration</h1>
      <p>Write, preview and publish travel advice and Holiday Types.</p>
      <a className="button" href="/admin/articles">
        Open Articles
      </a>
      <a className="button button-secondary" href="/admin/holiday-types">Open Holiday Types</a>
    </>
  );
}
