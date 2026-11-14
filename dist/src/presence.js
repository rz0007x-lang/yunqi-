const ROOM_CHANNEL = "yunqi-temple-node-07";
const STALE_AFTER = 15_000;

export class PresenceRoom {
  constructor(profile) {
    this.profile = { ...profile, id: crypto.randomUUID(), seat: null, action: null };
    this.peers = new Map();
    this.listeners = new Set();
    this.channel = "BroadcastChannel" in window ? new BroadcastChannel(ROOM_CHANNEL) : null;

    this.channel?.addEventListener("message", (event) => this.#receive(event.data));
    this.heartbeat = window.setInterval(() => {
      this.#broadcast("state");
      this.#prune();
    }, 4_000);

    window.addEventListener("pagehide", () => this.destroy(), { once: true });
    this.#broadcast("hello");
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  update(patch) {
    Object.assign(this.profile, patch);
    this.#broadcast("state");
    this.#emit();
  }

  snapshot() {
    return {
      self: { ...this.profile },
      peers: [...this.peers.values()].map((peer) => ({ ...peer })),
    };
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.#broadcast("leave");
    window.clearInterval(this.heartbeat);
    this.channel?.close();
  }

  #broadcast(type) {
    this.channel?.postMessage({ type, profile: this.profile, sentAt: Date.now() });
  }

  #receive(message) {
    if (!message?.profile || message.profile.id === this.profile.id) return;
    if (message.type === "leave") {
      this.peers.delete(message.profile.id);
      this.#emit();
      return;
    }

    this.peers.set(message.profile.id, { ...message.profile, seenAt: Date.now() });
    if (message.type === "hello") this.#broadcast("state");
    this.#emit();
  }

  #prune() {
    const now = Date.now();
    for (const [id, peer] of this.peers) {
      if (now - peer.seenAt > STALE_AFTER) this.peers.delete(id);
    }
    this.#emit();
  }

  #emit() {
    const state = this.snapshot();
    this.listeners.forEach((listener) => listener(state));
  }
}
