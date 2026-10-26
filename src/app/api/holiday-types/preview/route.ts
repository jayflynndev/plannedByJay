import { writeClient, readJson, failure } from "@/lib/articles/client";
import { prepareHoliday } from "@/lib/holiday-types/save";
export async function POST(request: Request) {
  try {
    await writeClient(request);
    const holiday = prepareHoliday(await readJson(request));
    return Response.json({holiday}, {headers: {"Cache-Control": "private, no-store"}});
  } catch (e) { return failure(e); }
}
