import Navbar from '../components/Navbar.jsx';
import AdvisorChat from '../features/advisor/AdvisorChat.jsx';

export default function AdvisorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col min-w-0">
        <h1 className="sr-only">Airtel AI Connectivity Advisor</h1>
        <AdvisorChat />
      </main>
    </div>
  );
}
