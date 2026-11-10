/** "2001:db8:1:2:3:4:5:6" → "2001:db8:1:2::/64". One subscriber usually owns a whole /64,
 * so rate limits keyed on single IPv6 addresses would be trivial to dodge. */
export function ipv6Prefix64(ip: string): string {
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const full = ip.includes("::") ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right] : left;
  return (
    full
      .slice(0, 4)
      .map((g) => g.replace(/^0+(?=.)/, ""))
      .join(":") + "::/64"
  );
}
