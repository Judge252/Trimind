/** In-memory ownership boundary. Never caches account data on disk. */
export class AccountBoundary {
  private owner: string | null = null;
  private revision = 0;
  get scope() {
    return `${this.revision}:${this.owner || "guest"}`;
  }
  switchTo(owner: string | null) {
    if (owner !== this.owner) {
      this.owner = owner;
      this.revision++;
    }
    return this.scope;
  }
  assertCurrent(scope: string) {
    if (scope !== this.scope) throw Error("account-changed");
  }
}
