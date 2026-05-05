import { serveDir } from "https://deno.land/std/http/file_server.ts";

Deno.serve((req: Request) => {
  return serveDir(req, {
    fsRoot: ".",
    urlRoot: "",
    showDirListing: true,
    showDotfiles: false,
  });
});
