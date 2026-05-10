export function getBaseTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/第?\d+[期巻章]/g, '')
    .replace(/シーズン\s*\d+/g, '')
    .replace(/Season\s*\d+/ig, '')
    .replace(/\s+\d+$/, '') // " 2"
    .replace(/[\s\-]+(?:II|III|IV|V|VI|VII|VIII|IX|X)$/, '') // " II"
    .replace(/（[^）]*）$/, '') // "（再放送）" etc.
    .replace(/\([^)]*\)$/, '')  // "(TVアニメ)" etc.
    .trim();
}
