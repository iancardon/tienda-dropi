/**
 * Genera un ADMIN_SECRET aleatorio y largo para el panel de administracion.
 * Uso:  npm run secret:admin
 *
 * Muestra el valor una sola vez: no queda en ningun archivo ni en el historial.
 */
import { randomBytes } from "crypto";

const bytes = Number(process.argv[2] ?? 48);
if (!Number.isFinite(bytes) || bytes < 16) {
  console.error("Cantidad de bytes invalida. Usa 16 o mas.");
  process.exit(1);
}

const secret = randomBytes(bytes).toString("base64url");

console.log("");
console.log("ADMIN_SECRET generado (48 bytes en base64url):");
console.log("");
console.log(secret);
console.log("");
console.log("Copialo en el panel de Vercel (Settings > Environment Variables)");
console.log("como ADMIN_SECRET. En local, en tu archivo .env.");
console.log("");
console.log("Aviso: este valor se imprime en pantalla. Si estas sharing la");
console.log("terminal, borra el historial despues.");
console.log("");
