import TopBar from '../components/layout/TopBar';
import { User, Landmark, Fingerprint, Keyboard, Brain, Download, BellRing, DollarSign, ChevronRight } from 'lucide-react';
import { auth } from '../lib/firebase';

export default function Settings() {
  const sections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', sub: 'Personal details & contact info' },
        { icon: Landmark, label: 'Linked Banks', sub: 'Manage active connections' },
      ]
    },
    {
      title: 'Security',
      items: [
        { icon: Fingerprint, label: 'Biometrics', sub: 'Face ID & Touch ID', toggle: true },
        { icon: Keyboard, label: 'PIN & Passcode', sub: 'Update app access code' },
      ]
    },
    {
      title: 'Privacy',
      items: [
        { icon: Brain, label: 'AI Memory Preferences', sub: 'Manage what Coach remembers' },
        { icon: Download, label: 'Data Export', sub: 'Download your history' },
      ]
    },
    {
      title: 'General',
      items: [
        { icon: BellRing, label: 'Notifications', sub: 'Alerts & summaries' },
        { icon: DollarSign, label: 'Currency', sub: 'USD ($)' },
      ]
    }
  ];

  return (
    <div className="bg-background min-h-screen">
      <TopBar title="Settings" />
      
      <main className="px-container-margin flex flex-col gap-8 pb-10">
        <div className="mt-4">
          <h2 className="text-display-lg-mobile font-bold tracking-tight mb-2">Settings & Security</h2>
          <p className="text-body-lg text-on-surface-variant">Manage your account preferences and secure your financial data.</p>
        </div>

        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-4">
            <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest pl-4 font-bold">{section.title}</h3>
            
            <div className="bg-surface rounded-3xl p-2 card-shadow border border-surface-container/50">
              {section.items.map((item, i) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-title-md leading-tight">{item.label}</p>
                        <p className="text-body-sm text-on-surface-variant mt-1">{item.sub}</p>
                      </div>
                    </div>
                    {item.toggle ? (
                      <div className="w-12 h-6 bg-primary-container rounded-full flex items-center px-1 justify-end">
                        <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-outline-variant" />
                    )}
                  </div>
                  {i < section.items.length - 1 && <div className="h-[1px] bg-surface-container mx-4 my-1 opacity-50" />}
                </div>
              ))}
            </div>
          </section>
        ))}

        <button 
          onClick={() => auth.signOut()}
          className="w-full py-4 text-error font-title-md bg-surface rounded-2xl border border-error/20 card-shadow mt-4"
        >
          Sign Out
        </button>
      </main>
    </div>
  );
}
