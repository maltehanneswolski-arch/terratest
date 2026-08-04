export const IMPORTED_COUNTRY_LISTS_NOTE = `
Imported country lists are stored as split TypeScript modules to stay below file-size limits.

Main entrypoint:
- src/lib/imported-country-lists.ts

Raw data parts:
- src/lib/imported-country-lists-data/types.ts
- src/lib/imported-country-lists-data/part-1.ts
- src/lib/imported-country-lists-data/part-2.ts
- src/lib/imported-country-lists-data/part-3.ts
- src/lib/imported-country-lists-data/part-4.ts
- src/lib/imported-country-lists-data/part-5.ts
- src/lib/imported-country-lists-data/part-6.ts
- src/lib/imported-country-lists-data/part-7.ts
- src/lib/imported-country-lists-data/part-8.ts

List metadata:
- src/lib/imported-country-lists-manifest.ts
`;
