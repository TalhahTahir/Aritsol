// Wording that follows the live content (so "Six practices" stays true after edits).
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

/** 6 → "Six" (or "six" with lower = true); 13 → "13". */
export const countWord = (n, lower = false) => {
  const w = WORDS[n] ?? String(n);
  return lower ? w.toLowerCase() : w;
};

/** ['A', 'B', 'C'] → "A, B and C". */
export const listNames = (names) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
