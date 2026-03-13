import { redirect } from 'next/navigation';

// Root page redirects to the tracker tool
// When more tools are added, this can become a tools listing page
export default function Home() {
  redirect('/torrent-trackers-list');
}
