export const databaseSettings = () => {
  const endpoint = process.env.KLETTERGLUECK_SUPABASE_URL?.trim();
  const key = process.env.KLETTERGLUECK_SUPABASE_SECRET_KEY?.trim();
  const issues: string[] = [];
  if (process.env.KLETTERGLUECK_TOURS_ENABLED !== 'true') {
    issues.push('KLETTERGLUECK_TOURS_ENABLED muss true sein.');
  }
  if (!endpoint || !/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(endpoint)) {
    issues.push(
      'KLETTERGLUECK_SUPABASE_URL muss die Supabase-Projekt-URL sein.',
    );
  }
  if (!key?.startsWith('sb_secret_')) {
    issues.push(
      'KLETTERGLUECK_SUPABASE_SECRET_KEY muss ein Supabase Secret Key sein.',
    );
  }
  return issues.length
    ? { issues, database: null }
    : {
        issues,
        database: {
          endpoint: new URL('/rest/v1/kletterglueck_tours', endpoint),
          key,
        },
      };
};
