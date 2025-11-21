import type { Inspector, InspectorNode } from "chrome-inspector";

// generate and record uids for node.
export class NodeUidManager {
  private _nodeCounters: Map<string, number>;
  private _idToRef: Map<string, WeakRef<InspectorNode>>;
  private _nodeToId: WeakMap<InspectorNode, string>;

  constructor() {
    this._nodeCounters = new Map(); // nodeName -> counter
    this._idToRef = new Map(); // id -> WeakRef(node)
    this._nodeToId = new WeakMap(); // node -> id
  }

  generateId(node: InspectorNode): string {
    const nodeName = node.nodeName.toLowerCase();
    const counter = this._nodeCounters.get(nodeName) || 0;
    this._nodeCounters.set(nodeName, counter + 1);
    return `${nodeName}_${counter}`;
  }

  setNode(node: InspectorNode): string {
    if (!node.tracked) {
      throw new Error("Cannot record untracked node");
    }
    if (this._nodeToId.has(node)) {
      return this._nodeToId.get(node)!;
    }
    const id = this.generateId(node);
    this._idToRef.set(id, new WeakRef(node));
    this._nodeToId.set(node, id);
    return id;
  }

  getNode(uid: string, inspector: Inspector): InspectorNode | undefined {
    // predefined
    if (uid === "document") return inspector.document;
    if (uid === "$0") return inspector.$0;

    // from map
    const ref = this._idToRef.get(uid);
    if (!ref) return undefined;
    const node = ref.deref();
    if (!node) {
      // Node GC'd, clean up stale entry
      this._idToRef.delete(uid);
    }
    return node.tracked ? node : undefined;
  }

  cleanUp(): void {
    // FIXME: didn't really cleanup deleted inspector's nodes
    for (const [id, ref] of this._idToRef.entries()) {
      if (ref.deref() === undefined) {
        this._idToRef.delete(id);
      }
    }
  }
}
