import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));
const referenceRoot = "C:/Users/ADMIN/AppData/Local/Temp";

export default {
  root: projectRoot,
  server: {
    allowedHosts: ["terminal.local", "localhost", "127.0.0.1"],
    fs: { allow: [projectRoot, referenceRoot] },
  },
};
