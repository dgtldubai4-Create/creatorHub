import { Certificate } from "@phosphor-icons/react";
import { useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Avatar, Chip, PageHeader, Section, Stat } from "../../ui/primitives";
import { trackProgress } from "../../domain/selectors";

export function AdminAcademy() {
  const t = useT();
  const L = useL();
  const { num, date } = useFormat();
  const s = useStore();
  const completions = Object.values(s.academy.progress).reduce((n, p) => n + Object.keys(p).length, 0);
  const certs = Object.values(s.academy.certificates).reduce((n, c) => n + c.length, 0);
  const learners = Object.keys(s.academy.progress).length;
  return (
    <div className="flex flex-col gap-10">
      <PageHeader title={t("academyAdmin")} sub={t("academySub")} />
      <div className="grid grid-cols-3 gap-3">
        <Stat label={t("completions")} value={num(completions)} />
        <Stat label={t("certificates")} value={num(certs)} tone="leaf" />
        <Stat label={t("creators")} value={num(learners)} />
      </div>
      <Section title={t("tracks")}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {s.academy.tracks.map((tr) => {
            const rows = s.creators.map((c) => ({ c, p: trackProgress(s, c.id, tr.id) })).filter((x) => x.p.done > 0).sort((a, b) => b.p.done - a.p.done);
            return (
              <div key={tr.id} className="card flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-2"><h3 className="text-lg">{L(tr.title)}</h3><Chip>{t(`lv_${tr.levelRequired}` as const)}</Chip></div>
                <div className="text-[12.5px] text-ink-3">{tr.modules.length} {t("modules")} · {rows.filter((r) => r.p.complete).length} {t("certificates").toLowerCase()}</div>
                <ul className="grid gap-1.5">
                  {rows.slice(0, 6).map(({ c, p }) => <li key={c.id} className="flex items-center gap-2 text-[13px]"><Avatar name={c.name} hue={c.hue} size={24} /><span className="min-w-0 flex-1 truncate">{c.name}</span>{p.complete ? <Certificate size={16} weight="fill" className="text-leaf" /> : <span className="tabular text-ink-3">{p.done}/{p.total}</span>}</li>)}
                  {rows.length === 0 && <li className="text-[13px] text-ink-3">{t("nothingHere")}</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>
      <Section title={t("mentoring")}>
        <ul className="card divide-y divide-line">
          {s.mentorSessions.map((ms) => <li key={ms.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-[14px]"><span className="font-medium">{L(ms.title)}</span><span className="text-ink-3">{ms.mentor} · {date(ms.at)}</span><span className="ms-auto tabular text-ink-2">{ms.bookedBy.length}/{ms.seats}</span></li>)}
        </ul>
      </Section>
    </div>
  );
}
