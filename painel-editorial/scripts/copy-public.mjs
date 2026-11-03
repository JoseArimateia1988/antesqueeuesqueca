import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(projectRoot, "..");
const destination = resolve(projectRoot, "public");
const allowed = /\.(html|jpe?g|png|webp|gif|avif|svg|ico)$/i;
const sourceFiles = (await readdir(repoRoot, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && allowed.test(entry.name));

if (!sourceFiles.some((entry) => entry.name === "index.html")) {
  throw new Error("A home pública não foi encontrada na raiz do repositório.");
}

await mkdir(destination, { recursive: true });
for (const file of sourceFiles) {
  const target = file.name === "index.html" ? "na-gaveta.html" : file.name;
  await copyFile(resolve(repoRoot, file.name), resolve(destination, target));
}
console.log(`Site público copiado para o deploy: ${sourceFiles.length} arquivos.`);
