export type ProfileInput = Readonly<{ preferredName: string | null; dateOfBirth: string | null; market: "NG" | null }>;

export function parseProfile(form: FormData, complete: boolean): ProfileInput | null {
  const names = ["csrf", "preferredName", "dateOfBirth", "market", "intent"];
  if ([...form.keys()].some((key) => !names.includes(key)) || names.some((key) => form.getAll(key).length !== 1)) return null;
  const raw = [form.get("preferredName"), form.get("dateOfBirth"), form.get("market")];
  if (raw.some((value) => typeof value !== "string")) return null;
  const [name, birth, market] = (raw as string[]).map((value) => value.trim());
  if (name.length > 100 || /[\u0000-\u001f\u007f]/.test(name) || (market && market !== "NG")) return null;
  if (birth) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return null;
    const parsed = new Date(`${birth}T00:00:00.000Z`);
    if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== birth || birth.slice(0, 4) === "0000") return null;
  }
  if (complete && (!name || !birth || !market)) return null;
  return { preferredName: name || null, dateOfBirth: birth || null, market: market ? "NG" : null };
}

export function isProfileComplete(profile: ProfileInput | null | undefined): boolean {
  return Boolean(profile?.preferredName && profile.dateOfBirth && profile.market);
}
