import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Sparkle, CalendarBlank, Check, X } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, EmptyState, PageHeader, Sheet, Textarea, Chip } from "../../ui/primitives";
import { Tilt, spring, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { invitationsFor, campaignById } from "../../domain/selectors";
import { BrandMark, KitList, Points, useCurrentCreator } from "../shared/bits";

export function Invitations() {
  const t = useT();
  const L = useL();
  const { date } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const nav = useNavigate();
  const [declining, setDeclining] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const list = invitationsFor(s, me.id);

  const accept = (id: string, e: React.MouseEvent) => {
    dispatch({ type: "respondInvite", participationId: id, accept: true });
    celebrate({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    toast(`${t("accepted")} ${t("acceptedBody")}`, "success");
    window.setTimeout(() => nav(`/creator/campaigns/${id}/kit`), 900);
  };
  const decline = () => {
    if (!declining) return;
    dispatch({ type: "respondInvite", participationId: declining, accept: false, reason: reason.trim() || undefined });
    setDeclining(null);
    setReason("");
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("invitations")} sub={t("invitationsSub")} />
      {list.length === 0 ? (
        <EmptyState icon={<Sparkle size={24} weight="duotone" />} title={t("noInvitations")} body={t("noInvitationsBody")} action={<Button variant="secondary" to="/creator/side-quests">{t("sideQuests")}</Button>} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <AnimatePresence>
            {list.map((p, i) => {
              const c = campaignById(s, p.campaignId)!;
              const b = s.brands.find((x) => x.id === c.brandId)!;
              return (
                <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ ...spring, delay: i * 0.05 }}>
                  <Tilt max={4} className="rounded-[var(--radius-card)]">
                    <article className="label-card flex h-full flex-col gap-5 p-6">
                      <div className="flex items-start justify-between gap-3">
                        <BrandMark brand={b} />
                        <Points value={c.points} />
                      </div>
                      <div>
                        <h2 className="text-2xl">{L(c.title)}</h2>
                        <p className="mt-2 text-[15px] text-ink-2">{L(c.hook)}</p>
                      </div>
                      <p className="text-[14px]"><span className="font-medium">{t("deliverable")}: </span>{L(c.brief.deliverable)}</p>
                      <div>
                        <div className="mb-2 text-[13px] font-medium text-ink-2">{t("kitIncludes")}</div>
                        <KitList campaign={c} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip icon={<CalendarBlank size={14} />}>{t("window")}: {date(c.window.start)} - {date(c.window.end)}</Chip>
                        {c.brief.durationSec && <Chip>{c.brief.durationSec.min}-{c.brief.durationSec.max} {t("seconds")}</Chip>}
                      </div>
                      <div className="mt-auto flex gap-2 pt-2">
                        <Button className="flex-1" onClick={(e) => accept(p.id, e)} icon={<Check size={16} weight="bold" />}>{t("accept")}</Button>
                        <Button variant="secondary" onClick={() => setDeclining(p.id)} icon={<X size={16} weight="bold" />}>{t("decline")}</Button>
                      </div>
                    </article>
                  </Tilt>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      <Sheet open={!!declining} onClose={() => setDeclining(null)} title={t("declineTitle")}>
        <p className="text-[14px] text-ink-2">{t("declineBody")}</p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-medium">{t("declineReason")}</span>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeclining(null)}>{t("cancel")}</Button>
          <Button variant="danger" onClick={decline}>{t("decline")}</Button>
        </div>
      </Sheet>
    </div>
  );
}
