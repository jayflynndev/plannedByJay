import { writeClient, readJson, failure } from "@/lib/articles/client";
import { previewOffer } from "@/lib/offers/data";
export async function POST(request:Request){try{const client=await writeClient(request);return Response.json({offer:await previewOffer(client,await readJson(request))},{headers:{"Cache-Control":"private, no-store"}});}catch(e){return failure(e);}}
