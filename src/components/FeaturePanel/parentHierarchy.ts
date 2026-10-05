type HierarchyNode = {
  osmMeta: { type: string; id: number };
  members?: { type: string; ref: number }[];
};

const featureKey = (feature: HierarchyNode) =>
  `${feature.osmMeta.type}/${feature.osmMeta.id}`;

// Breadcrumb levels from the largest area down to the direct parents.
// Features at the same distance from the current one share a level, so
// A ⊃ B ⊃ C ⊃ D and E ⊃ D renders as A > B > C E.
export const groupParentFeatures = <T extends HierarchyNode>(
  feature: HierarchyNode,
  parents: T[] | undefined,
): T[][] => {
  if (!parents?.length) return [];

  const currentKey = featureKey(feature);
  const parentKeys = new Set(parents.map(featureKey));
  const parentsOf = new Map<string, T[]>();

  const addParent = (childKey: string, parent: T) => {
    const list = parentsOf.get(childKey);
    if (!list) {
      parentsOf.set(childKey, [parent]);
      return;
    }
    if (!list.some((item) => featureKey(item) === featureKey(parent))) {
      list.push(parent);
    }
  };

  for (const parent of parents) {
    for (const member of parent.members ?? []) {
      if (!member?.type || typeof member.ref !== 'number') continue;
      const childKey = `${member.type}/${member.ref}`;
      if (childKey === currentKey || parentKeys.has(childKey)) {
        addParent(childKey, parent);
      }
    }
  }

  // Tiles and OSM both hand us ancestors nearest-first. Without member links
  // that order is the only hierarchy we have.
  if (!parentsOf.get(currentKey)?.length) {
    return [...parents].reverse().map((parent) => [parent]);
  }

  const distances = new Map<string, number>([[currentKey, 0]]);
  for (let pass = 0; pass < parents.length; pass++) {
    let changed = false;
    for (const [childKey, childParents] of parentsOf) {
      const childDistance = distances.get(childKey);
      if (childDistance === undefined) continue;
      for (const parent of childParents) {
        const next = childDistance + 1;
        if (next > parents.length) continue;
        const parentKey = featureKey(parent);
        if (next > (distances.get(parentKey) ?? 0)) {
          distances.set(parentKey, next);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  for (const parent of parents) {
    const key = featureKey(parent);
    if (!distances.has(key)) distances.set(key, 1);
  }

  const indexOf = new Map(
    parents.map((parent, index) => [featureKey(parent), index]),
  );
  const reachMemo = new Map<string, number>();
  const reach = (nodeKey: string, stack: Set<string>): number => {
    const memo = reachMemo.get(nodeKey);
    if (memo !== undefined) return memo;
    if (stack.has(nodeKey)) return distances.get(nodeKey) ?? 0;

    stack.add(nodeKey);
    let max = distances.get(nodeKey) ?? 0;
    for (const parent of parentsOf.get(nodeKey) ?? []) {
      max = Math.max(max, reach(featureKey(parent), stack));
    }
    stack.delete(nodeKey);
    reachMemo.set(nodeKey, max);
    return max;
  };

  let maxDistance = 1;
  for (const parent of parents) {
    maxDistance = Math.max(maxDistance, distances.get(featureKey(parent)) ?? 1);
  }

  const levels: T[][] = [];
  for (let distance = maxDistance; distance >= 1; distance--) {
    const level = parents.filter(
      (parent) => distances.get(featureKey(parent)) === distance,
    );
    level.sort((a, b) => {
      const byReach =
        reach(featureKey(b), new Set()) - reach(featureKey(a), new Set());
      if (byReach !== 0) return byReach;
      return (
        (indexOf.get(featureKey(a)) ?? 0) - (indexOf.get(featureKey(b)) ?? 0)
      );
    });
    if (level.length) levels.push(level);
  }

  return levels;
};
