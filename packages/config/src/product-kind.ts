import type { Prisma } from '@biashara-mall/prisma';

// Prisma's Mongo connector *omits* `startingDate` when it writes null, but a
// `startingDate: null` filter compiles to a BSON-null match that never sees an
// absent field: so plain products would be invisible. Match "not set" too.
export const IS_PRODUCT: Prisma.ProductWhereInput = {
  OR: [{ startingDate: null }, { startingDate: { isSet: false } }],
};

export const IS_EVENT: Prisma.ProductWhereInput = {
  startingDate: { isSet: true, not: null },
};
