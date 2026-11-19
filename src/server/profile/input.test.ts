import { describe, expect, it } from "vitest";
import { isProfileComplete, parseProfile } from "./input";

function form(name: string, birth: string, market: string) {
  const value = new FormData();
  for (const [key, field] of Object.entries({ csrf: "test", intent: "later", preferredName: name, dateOfBirth: birth, market })) value.set(key, field);
  return value;
}
describe("profile validation", () => {
  it("accepts partial saves but requires all fields to continue", () => {
    const partial = parseProfile(form("Ada", "", ""), false);
    expect(partial).toEqual({ preferredName: "Ada", dateOfBirth: null, market: null });
    expect(isProfileComplete(partial)).toBe(false);
    expect(parseProfile(form("Ada", "", ""), true)).toBeNull();
    expect(isProfileComplete(parseProfile(form("Ada", "2000-02-29", "NG"), true))).toBe(true);
  });
  it("rejects invalid dates, markets, duplicate and unexpected fields", () => {
    expect(parseProfile(form("Ada", "2001-02-29", "NG"), true)).toBeNull();
    expect(parseProfile(form("Ada", "2000-01-01", "US"), true)).toBeNull();
    const duplicate = form("Ada", "", ""); duplicate.append("market", "NG");
    expect(parseProfile(duplicate, false)).toBeNull();
  });
});
