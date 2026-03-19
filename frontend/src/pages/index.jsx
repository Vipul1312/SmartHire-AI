import dynamic from "next/dynamic";

// Load entire page client-side to avoid SSR conflicts with Clerk
const App = dynamic(() => import("../components/App"), { ssr: false });

export default function Home() {
  return <App />;
}
