import type { GetServerSideProps } from 'next'

// /cafezomad/menu is deprecated. The standalone menu UI was the legacy
// surface; the current flow is /cafezomad → /cafezomad/nodes → table → ordering.
// Redirect any direct visits (bookmarks, QR codes, biohack button) into the
// new flow. Server-side 308 so the change is permanent + cacheable.
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: '/cafezomad/nodes', permanent: true },
})

export default function CafeMenuRedirect() {
  return null
}
