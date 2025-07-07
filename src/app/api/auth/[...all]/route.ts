import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "~/lib/auth";

const handler = toNextJsHandler(auth);

export { handler as GET, handler as POST };
