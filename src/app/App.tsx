import { useEffect, type ReactNode } from "react";
import { BrowserRouter, HashRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { ReactLenis, useLenis } from "lenis/react";
import { StoreProvider, useDispatch, useStore } from "./store";
import { useDocumentLang, useT } from "../i18n";
import { ToastProvider, useToast } from "../ui/toast";
import { AdminShell, CreatorShell } from "./shell";
import { can } from "../domain/permissions";
import type { Permission, Seat } from "../domain/types";
import { Button, EmptyState } from "../ui/primitives";
import { LockKey } from "@phosphor-icons/react";

import { Entry } from "../screens/public/Entry";
import { Login } from "../screens/public/Login";
import { Join } from "../screens/public/Join";
import { CreatorHome } from "../screens/creator/Home";
import { Invitations } from "../screens/creator/Invitations";
import { CreatorCampaigns } from "../screens/creator/Campaigns";
import { Journey } from "../screens/creator/Journey";
import { Missions } from "../screens/creator/Missions";
import { Academy } from "../screens/creator/Academy";
import { SeasonPage } from "../screens/creator/Season";
import { AdminMissions } from "../screens/admin/Missions";
import { AdminSeasons } from "../screens/admin/Seasons";
import { AdminAcademy } from "../screens/admin/Academy";
import { Rewards } from "../screens/creator/Rewards";
import { Profile } from "../screens/creator/Profile";
import { Notifications } from "../screens/shared/Notifications";
import { AdminOverview } from "../screens/admin/Overview";
import { AdminCampaigns } from "../screens/admin/Campaigns";
import { AdminCampaignDetail } from "../screens/admin/CampaignDetail";
import { AdminCreators } from "../screens/admin/Creators";
import { AdminReview } from "../screens/admin/Review";
import { AdminLogistics } from "../screens/admin/Logistics";
import { AdminLoyalty } from "../screens/admin/Loyalty";
import { AdminProducts } from "../screens/admin/Products";

const Router = __SINGLE_FILE__ ? HashRouter : BrowserRouter;

function RequireSeat({ seat, children }: { seat: Seat; children: ReactNode }) {
  const { session } = useStore();
  const location = useLocation();
  if (!session.seat) return <Navigate to="/login" replace state={{ from: location.pathname, seat }} />;
  // The seat switcher only changes state; this guard moves the URL to the matching seat.
  if (session.seat !== seat) return <Navigate to={session.seat === "creator" ? "/creator" : "/admin"} replace />;
  return <>{children}</>;
}

function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { session } = useStore();
  const t = useT();
  if (!can(session.role, permission)) {
    return <EmptyState icon={<LockKey size={26} weight="duotone" />} title={t("noPermission")} action={<Button variant="secondary" to="/admin">{t("overview")}</Button>} />;
  }
  return <>{children}</>;
}

function ErrorWatcher() {
  const { lastError } = useStore();
  const dispatch = useDispatch();
  const toast = useToast();
  useEffect(() => {
    if (!lastError) return;
    toast(lastError.message, "error");
    dispatch({ type: "clearError" });
  }, [lastError, toast, dispatch]);
  return null;
}

function ScrollReset() {
  const { pathname } = useLocation();
  const lenis = useLenis();
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
    window.scrollTo({ top: 0 });
  }, [pathname, lenis]);
  return null;
}

function Boot() {
  useDocumentLang();
  return null;
}

function JourneyRoute() {
  const { id, tab } = useParams();
  return <Journey participationId={id!} tab={tab} />;
}

function NotFound() {
  const t = useT();
  return (
    <div className="mx-auto max-w-lg px-4 py-24">
      <EmptyState title={t("notFound")} action={<Button to="/">{t("goHome")}</Button>} />
    </div>
  );
}

export function App() {
  return (
    <StoreProvider>
      <Router>
        <ReactLenis root options={{ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 }}>
          <ToastProvider>
            <Boot />
            <ErrorWatcher />
            <ScrollReset />
            <div className="grain" aria-hidden />
            <Routes>
              <Route path="/" element={<Entry />} />
              <Route path="/login" element={<Login />} />
              <Route path="/join" element={<Join />} />
              <Route path="/creator" element={<RequireSeat seat="creator"><CreatorShell /></RequireSeat>}>
                <Route index element={<CreatorHome />} />
                <Route path="invitations" element={<Invitations />} />
                <Route path="campaigns" element={<CreatorCampaigns />} />
                <Route path="campaigns/:id" element={<JourneyRoute />} />
                <Route path="campaigns/:id/:tab" element={<JourneyRoute />} />
                <Route path="missions" element={<Missions />} />
                <Route path="missions/:id" element={<Missions />} />
                <Route path="side-quests" element={<Navigate to="/creator/missions" replace />} />
                <Route path="academy" element={<Academy />} />
                <Route path="academy/:trackId" element={<Academy />} />
                <Route path="season" element={<SeasonPage />} />
                <Route path="rewards" element={<Rewards />} />
                <Route path="profile" element={<Profile />} />
                <Route path="notifications" element={<Notifications audience="creator" />} />
              </Route>
              <Route path="/admin" element={<RequireSeat seat="brand"><AdminShell /></RequireSeat>}>
                <Route index element={<AdminOverview />} />
                <Route path="campaigns" element={<RequirePermission permission="campaigns"><AdminCampaigns /></RequirePermission>} />
                <Route path="campaigns/:id" element={<RequirePermission permission="campaigns"><AdminCampaignDetail /></RequirePermission>} />
                <Route path="missions" element={<RequirePermission permission="review"><AdminMissions /></RequirePermission>} />
                <Route path="missions/:id" element={<RequirePermission permission="review"><AdminMissions /></RequirePermission>} />
                <Route path="seasons" element={<RequirePermission permission="campaigns"><AdminSeasons /></RequirePermission>} />
                <Route path="academy" element={<RequirePermission permission="campaigns"><AdminAcademy /></RequirePermission>} />
                <Route path="creators" element={<RequirePermission permission="invite"><AdminCreators /></RequirePermission>} />
                <Route path="creators/:id" element={<RequirePermission permission="invite"><AdminCreators /></RequirePermission>} />
                <Route path="review" element={<RequirePermission permission="review"><AdminReview /></RequirePermission>} />
                <Route path="review/:pid" element={<RequirePermission permission="review"><AdminReview /></RequirePermission>} />
                <Route path="review/:pid/:subId" element={<RequirePermission permission="review"><AdminReview /></RequirePermission>} />
                <Route path="logistics" element={<RequirePermission permission="logistics"><AdminLogistics /></RequirePermission>} />
                <Route path="loyalty" element={<RequirePermission permission="loyalty"><AdminLoyalty /></RequirePermission>} />
                <Route path="products" element={<RequirePermission permission="products"><AdminProducts /></RequirePermission>} />
                <Route path="products/:id" element={<RequirePermission permission="products"><AdminProducts /></RequirePermission>} />
                <Route path="notifications" element={<Notifications audience="brand" />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ToastProvider>
        </ReactLenis>
      </Router>
    </StoreProvider>
  );
}
