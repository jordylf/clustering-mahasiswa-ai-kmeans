const num = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const int = new Intl.NumberFormat("id-ID");
const date = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export const formatNumber = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined
    ? "—"
    : digits === 2
      ? num.format(v)
      : v.toLocaleString("id-ID", { maximumFractionDigits: digits, minimumFractionDigits: digits });
export const formatInt = (v: number) => int.format(v);
export const formatDate = (d: Date | string) => date.format(new Date(d));
export const formatDateTime = (d: Date | string) => dateTime.format(new Date(d));
export const shortLabel = (label: string) => label.replace("Ketergantungan ", "");
