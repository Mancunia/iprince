#!/bin/sh
# Writes .env.local from the running local Supabase stack.
set -e
if [ -f .env.local ]; then cp .env.local .env.local.bak; fi
npx supabase status -o env | tr -d '"' | awk '
  /^API_URL=/          { sub(/^API_URL=/, "");          print "NEXT_PUBLIC_SUPABASE_URL=" $0 }
  /^ANON_KEY=/         { sub(/^ANON_KEY=/, "");         print "NEXT_PUBLIC_SUPABASE_ANON_KEY=" $0 }
  /^SERVICE_ROLE_KEY=/ { sub(/^SERVICE_ROLE_KEY=/, ""); print "SUPABASE_SERVICE_ROLE_KEY=" $0 }
' > .env.local
echo "Wrote .env.local (previous copy saved as .env.local.bak if it existed)"
