import { useState, useEffect, lazy, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import CartPanel from "./CartPanel";

const HeroScene = lazy(() => import("./HeroScene"));

export default function Layout() {
  const [cartPanelOpen, setCartPanelOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close cart panel on route change
  useEffect(() => {
    setCartPanelOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Desktop: 3D WebGL scene */}
      {isDesktop && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Suspense fallback={null}>
            <HeroScene />
          </Suspense>
        </div>
      )}

      {/* Mobile: lightweight CSS animated orbs */}
      {!isDesktop && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="bg-orb-red" style={{ top: "-10%", left: "-15%" }} />
          <div className="bg-orb-green" style={{ bottom: "-10%", right: "-15%" }} />
          <div className="bg-orb-amber" style={{ top: "40%", left: "30%" }} />
          <div className="bg-mesh fixed inset-0" />
          <div className="bg-grid fixed inset-0 opacity-30" />
        </div>
      )}

      <Sidebar cartPanelOpen={cartPanelOpen} setCartPanelOpen={setCartPanelOpen} />

      <main className="lg:pl-[260px] min-h-screen relative z-10">
        <div className="pt-14 lg:pt-0">
          <Outlet context={{ setCartPanelOpen }} />
        </div>
      </main>

      <CartPanel open={cartPanelOpen} onClose={() => setCartPanelOpen(false)} />
    </div>
  );
}
