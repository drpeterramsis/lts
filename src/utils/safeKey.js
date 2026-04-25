export function sk(...args) {
  return args
    .map(a => {
      if (a === undefined || a === null) return "x";
      if (typeof a === "number" && isNaN(a)) return "x";
      return String(a).replace(/\s+/g, "_").replace(/[⏰]/g, "T");
    })
    .join("__");
}
