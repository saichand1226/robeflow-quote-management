import { requireStaff } from "@/lib/api-auth";

export async function GET(_:Request,{params}:{params:Promise<{documentId:string}>}){
 const auth=await requireStaff();if(auth.error)return auth.error;
 const{data}=await auth.supabase.from("quote_attachments").select("*").eq("id",Number((await params).documentId)).like("object_key","pick-lists/%").single();
 if(!data)return new Response("Pick list workbook not found.",{status:404});
 const file=await auth.supabase.storage.from("robeflow-files").download(data.object_key);
 if(file.error)return new Response(file.error.message,{status:404});
 const cleanName=data.file_name.replace(/^\[Pick List v\d+ (?:Generated|Uploaded)\]\s*/i,"").replace(/\"/g,"");
 const type=/\.xlsm$/i.test(cleanName)?"application/vnd.ms-excel.sheet.macroEnabled.12":data.content_type;
 return new Response(file.data,{headers:{"Content-Type":type,"Content-Disposition":`attachment; filename="${cleanName}"`}});
}
