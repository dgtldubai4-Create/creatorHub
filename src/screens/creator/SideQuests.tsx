import { useState } from "react";
import { useParams } from "react-router-dom";
import { Compass, CalendarBlank, Upload } from "@phosphor-icons/react";
import { useDispatch, useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Chip, PageHeader, Sheet, Input, Field, type Tone } from "../../ui/primitives";
import { Item, Stagger, useCelebrate } from "../../ui/motion";
import { useToast } from "../../ui/toast";
import { BrandMark, Points, useCurrentCreator } from "../shared/bits";
import type { QuestState } from "../../domain/types";
import { cn } from "../../ui/cn";

const TONE: Record<QuestState, Tone> = { open: "neutral", joined: "marigold", submitted: "sky", reviewed: "leaf", completed: "ink" };

export function SideQuests() {
  const t = useT();
  const L = useL();
  const { date } = useFormat();
  const s = useStore();
  const me = useCurrentCreator();
  const dispatch = useDispatch();
  const toast = useToast();
  const celebrate = useCelebrate();
  const { id } = useParams();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [filename, setFilename] = useState("");

  const submit = () => {
    if (!submitting || !filename.trim()) return;
    dispatch({ type: "submitQuest", questId: submitting, creatorId: me.id, filename: filename.trim() });
    toast(t("questSubmitted"), "success");
    setSubmitting(null);
    setFilename("");
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("sideQuests")} sub={t("questsSub")} />
      <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {s.quests.map((q) => {
          const st = q.states[me.id] ?? "open";
          const b = s.brands.find((x) => x.id === q.brandId);
          const highlight = q.id === id;
          return (
            <Item key={q.id}>
              <article id={q.id} className={cn("card flex h-full flex-col gap-4 p-5", highlight && "border-leaf ring-4 ring-leaf/15", st === "completed" && "bg-surface-2")}>
                <div className="flex items-center justify-between gap-3">
                  {b ? <BrandMark brand={b} size="sm" /> : <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-leaf"><Compass size={16} weight="fill" />{t("appName")}</span>}
                  <Chip tone={TONE[st]}>{t(`qs_${st}` as const)}</Chip>
                </div>
                <h2 className="text-xl">{L(q.title)}</h2>
                <p className="text-[14.5px] text-ink-2">{L(q.prompt)}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                  <Chip icon={<CalendarBlank size={14} />}>{t("deadline")}: {date(q.deadline)}</Chip>
                  <Points value={q.points} />
                </div>
                {st === "open" && <Button variant="secondary" onClick={() => { dispatch({ type: "joinQuest", questId: q.id, creatorId: me.id }); celebrate(); }}>{t("joinQuest")}</Button>}
                {st === "joined" && <Button onClick={() => setSubmitting(q.id)} icon={<Upload size={16} weight="bold" />}>{t("submitQuest")}</Button>}
                {st === "submitted" && <p className="text-[13px] text-ink-3">{t("questSubmitted")}</p>}
              </article>
            </Item>
          );
        })}
      </Stagger>
      <Sheet open={!!submitting} onClose={() => setSubmitting(null)} title={t("submitQuest")}>
        <Field label={t("fileMeta")} hint={t("uploadHint")}>
          <Input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="shelfie.mp4" autoFocus />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setSubmitting(null)}>{t("cancel")}</Button>
          <Button onClick={submit} disabled={!filename.trim()}>{t("submitQuest")}</Button>
        </div>
      </Sheet>
    </div>
  );
}
