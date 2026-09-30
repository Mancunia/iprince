import { parseArgs } from "node:util";
import { ensureAdmin } from "./lib/ensure-admin";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    password: { type: "string" },
    role: { type: "string", default: "owner" },
    name: { type: "string", default: "Owner" },
  },
});

if (!values.email || !values.password || (values.role !== "owner" && values.role !== "editor")) {
  console.error("Usage: npm run admin:create -- --email you@example.com --password '…' [--role owner|editor] [--name 'Display Name']");
  process.exit(1);
}

ensureAdmin({ email: values.email, password: values.password, role: values.role, displayName: values.name! })
  .then((id) => console.log(`Admin ready: ${values.email} (${values.role}) → ${id}`))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
