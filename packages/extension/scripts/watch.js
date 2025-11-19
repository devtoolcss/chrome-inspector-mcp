import chokidar from "chokidar";
import { exec } from "child_process";

const copyIgnoreMatcher = (path) => {
  if (path.startsWith("src/ws-server.js") || path.startsWith("src/."))
    return true;

  return false;
};

chokidar.watch("./src").on("change", (path) => {
  if (copyIgnoreMatcher(path)) {
    return;
  }

  if (path.endsWith(".ts")) {
    console.log(`Rebuilding due to change in ${path}`);
    exec(
      "NODE_ENV=development node scripts/esbuild.config.js",
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error during build: ${stderr}`);
        }
      },
    );
  } else {
    console.log(`Copying due to change in ${path}`);
    exec(`cp ${path} dist/`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during copy: ${stderr}`);
      }
    });
  }
});

console.log("Watching for changes...");
