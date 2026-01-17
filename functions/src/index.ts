import * as functions from "firebase-functions";
import next from "next";
import { Request, Response } from "express"; // ✅ add these types

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, conf: { distDir: ".next" } });
const handle = app.getRequestHandler();

export const nextApp = functions.https.onRequest(
  (req: Request, res: Response) => { // ✅ typed params
    return app.prepare().then(() => handle(req, res));
  }
);
