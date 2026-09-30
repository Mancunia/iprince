#!/bin/sh
# Writes .env.local from the running local Supabase stack.
# Generates into a temp file first so a failure never clobbers .env.local or its backup.
set -e
tmp=.env.local.tmp
trap 'rm -f "$tmp"' EXIT

raw=$(npx supabase status -o env) || { echo "supabase status failed; is the stack running? (npx supabase start)" >&2; exit 1; }
printf '%s\n' "$raw" | tr -d '"' | awk '
  /^API_URL=/          { sub(/^API_URL=/, "");          print "NEXT_PUBLIC_SUPABASE_URL=" $0 }
  /^ANON_KEY=/         { sub(/^ANON_KEY=/, "");         print "NEXT_PUBLIC_SUPABASE_ANON_KEY=" $0 }
  /^SERVICE_ROLE_KEY=/ { sub(/^SERVICE_ROLE_KEY=/, ""); print "SUPABASE_SERVICE_ROLE_KEY=" $0 }
' > "$tmp"

for v in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
  grep -q "^$v=." "$tmp" || { echo "missing or empty $v in supabase status output; .env.local left untouched" >&2; exit 1; }
done

if [ -s .env.local ]; then cp .env.local .env.local.bak; fi
mv "$tmp" .env.local
trap - EXIT
echo "Wrote .env.local (previous copy saved as .env.local.bak if it existed)"
