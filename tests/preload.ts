// The routers under test are imported for their middleware stack, but importing
// them runs their modules' top-level credential checks. Placeholders keep those
// from throwing; nothing here makes a network call.
const PLACEHOLDERS: Record<string, string> = {
  IMAGEKIT_PUBLIC_KEY: 'test',
  IMAGEKIT_PRIVATE_KEY: 'test',
  IMAGEKIT_URL_ENDPOINT: 'https://ik.imagekit.io/test',
};

for (const [key, value] of Object.entries(PLACEHOLDERS)) {
  process.env[key] ??= value;
}
