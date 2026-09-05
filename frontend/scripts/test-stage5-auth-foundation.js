// Pure Node.js script to run test-stage5-auth-foundation via ts-node execution
const { spawnSync } = require("child_process");
const path = require("path");

const tsScript = path.join(__dirname, "test-stage5-auth-foundation.ts");
const result = spawnSync("npx", ["ts-node", tsScript], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, "..")
});

process.exit(result.status || 0);
