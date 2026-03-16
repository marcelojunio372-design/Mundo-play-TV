export function groupByCategory(list, key = "category") {
  const map = {};

  list.forEach((item) => {
    const cat = item[key] || "OUTROS";

    if (!map[cat]) {
      map[cat] = [];
    }

    map[cat].push(item);
  });

  return map;
}
