import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowSquareOut, MagnifyingGlass } from "@phosphor-icons/react";
import catalogue from "../../data/catalogue.json";
import { useStore } from "../../app/store";
import { useFormat, useL, useT } from "../../i18n";
import { Button, Chip, ChipButton, Input, PageHeader, Sheet } from "../../ui/primitives";
import { Item, Stagger } from "../../ui/motion";
import { ProductArt } from "../../ui/ProductArt";
import { BrandMark } from "../shared/bits";

export function AdminProducts() {
  const t = useT();
  const L = useL();
  const { date } = useFormat();
  const s = useStore();
  const nav = useNavigate();
  const { id } = useParams();
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState<string>("all");
  const list = useMemo(() => s.products.filter((p) => (brand === "all" || p.brandId === brand) && `${p.names.en} ${p.names.ar} ${p.type}`.toLowerCase().includes(q.toLowerCase())), [s.products, q, brand]);
  const open = s.products.find((p) => p.id === id);
  const pending = s.products.filter((p) => p.pendingSync).length;
  const usedIn = (pid: string) => s.campaigns.filter((c) => c.kit.some((k) => k.productId === pid));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("products")}
        sub={t("productsSub")}
        eyebrow={pending > 0 ? <Chip tone="marigold" className="cursor-help" >{t("pendingSync")}: {pending}/{s.products.length}</Chip> : <Chip tone="leaf">{t("source")}: {catalogue.syncedAt ? date(catalogue.syncedAt) : ""}</Chip>}
        actions={<a href={catalogue.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-leaf hover:underline">{catalogue.source.replace("https://", "")}<ArrowSquareOut size={14} /></a>}
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative me-2 w-full max-w-xs">
          <MagnifyingGlass size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="ps-10 py-2" />
        </div>
        <ChipButton selected={brand === "all"} onClick={() => setBrand("all")}>{t("all")}</ChipButton>
        {s.brands.map((b) => <ChipButton key={b.id} selected={brand === b.id} onClick={() => setBrand(b.id)}>{L(b.localisedName)}</ChipButton>)}
      </div>
      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" gap={0.02}>
        {list.map((p) => (
          <Item key={p.id}>
            <button onClick={() => nav(`/admin/products/${p.id}`)} className="label-card lift flex w-full flex-col gap-3 p-3 text-start ">
              <ProductArt product={p} brand={s.brands.find((b) => b.id === p.brandId)} className="aspect-square w-full" />
              <div className="min-w-0">
                <div className="line-clamp-2 text-[13.5px] font-medium leading-snug">{L(p.names)}</div>
                <div className="mt-1 text-[12px] text-ink-3">{p.type}</div>
              </div>
            </button>
          </Item>
        ))}
      </Stagger>

      <Sheet open={!!open} onClose={() => nav("/admin/products")} wide title={open ? L(open.names) : ""}>
        {open && (
          <div className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-2">
              <ProductArt product={open} brand={s.brands.find((b) => b.id === open.brandId)} size="lg" />
              {!open.image && <p className="mt-2 text-[12px] text-ink-3">{t("imagePending")}</p>}
            </div>
            <div className="grid content-start gap-4 md:col-span-3">
              <div className="flex flex-wrap items-center gap-2">
                <BrandMark brand={s.brands.find((b) => b.id === open.brandId)!} />
                <Chip>{open.type}</Chip>
                <Chip>{t("packType")}: {open.packType}</Chip>
                {open.pendingSync && <Chip tone="marigold" className="cursor-help" >{t("pendingSync")}</Chip>}
              </div>
              <p className="text-[14.5px] text-ink-2">{L(open.description)}</p>
              {open.pendingSync && <p className="rounded-[8px] bg-marigold-soft p-3 text-[12.5px] text-marigold-ink">{t("pendingSyncHint")}</p>}
              <div>
                <h3 className="text-[13px] font-semibold text-ink-2">{t("ingredients")}</h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">{open.ingredients.map((i) => <Chip key={i}>{i}</Chip>)}</div>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-ink-2">{t("benefits")}</h3>
                <ul className="mt-1.5 grid gap-1 text-[14px]">{open.benefits.map((b, i) => <li key={i}>{L(b)}</li>)}</ul>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-ink-2">{t("howToUse")}</h3>
                <ol className="mt-1.5 grid gap-1 text-[14px]">{open.usageSteps.map((b, i) => <li key={i} className="flex gap-2"><span className="w-4 shrink-0 font-semibold text-ink-3">{i + 1}</span>{L(b)}</li>)}</ol>
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-ink-2">{t("usedIn")}</h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">{usedIn(open.id).length === 0 ? <span className="text-[13px] text-ink-3">{t("nothingHere")}</span> : usedIn(open.id).map((c) => <Button key={c.id} size="sm" variant="secondary" to={`/admin/campaigns/${c.id}`}>{L(c.title)}</Button>)}</div>
              </div>
              <a href={open.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-leaf hover:underline">{t("source")}<ArrowSquareOut size={14} /></a>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
