export function v4() {
  return Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
}
