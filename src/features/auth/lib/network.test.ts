import { describe, expect, it } from "vitest";
import { ipv6Prefix64 } from "./network";

describe("ipv6Prefix64", () => {
  it.each([
    ["2001:db8:1:2:3:4:5:6", "2001:db8:1:2::/64"],
    ["2001:db8:1:2:ffff::1", "2001:db8:1:2::/64"],
    ["2001:DB8::1", "2001:db8:0:0::/64"],
    ["2001:0db8:0001:0002::", "2001:db8:1:2::/64"],
  ])("%s → %s", (ip, prefix) => expect(ipv6Prefix64(ip)).toBe(prefix));

  it("two addresses in one /64 share a key", () => {
    expect(ipv6Prefix64("2001:db8:aa:bb::1")).toBe(ipv6Prefix64("2001:db8:aa:bb:dead:beef:1:2"));
  });
});
