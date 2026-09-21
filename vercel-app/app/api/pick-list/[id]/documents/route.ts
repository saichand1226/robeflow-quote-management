import fs from "node:fs/promises";
import path from "node:path";
import { camel,requireStaff } from "@/lib/api-auth";
import { fillPickListWorkbook } from "@/lib/pick-list-workbook";

const MIME="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const safeName=(value:string)=>value.replace(/[^a-zA-Z0-9._-]/g,"_");
const versionOf=(name:string)=>Number(name.match(/^\[Pick List v(\d+)/i)?.[1]||0);
const documentOf=(row:any,currentId?:number)=>({id:row.id,version:versionOf(row.file_name),fileName:row.file_name.replace(/^\[Pick List v\d+ (?:Generated|Uploaded)\]\s*/i,""),size:Number(row.size)||0,source:/^\[Pick List v\d+ Generated\]/i.test(row.file_name)?"Generated":"Uploaded",uploadedBy:"RobeFlow staff",isCurrent:row.id===(currentId??row.id),createdAt:row.created_at});
async function list(auth:any,id:number){const{data,error}=await auth.supabase.from("quote_attachments").select("*").eq("quote_id",id).like("object_key",`pick-lists/${id}/%`).order("created_at",{ascending:false});if(error)return Response.json({error:error.message},{status:400});const rows=(data??[]).sort((a:any,b:any)=>versionOf(b.file_name)-versionOf(a.file_name));return Response.json({documents:rows.map((row:any)=>documentOf(row,rows[0]?.id))});}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const auth=await requireStaff();if(auth.error)return auth.error;return list(auth,Number((await params).id));}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const auth=await requireStaff(["Admin","Sales","Operations","Staff"]);if(auth.error)return auth.error;
 const id=Number((await params).id),contentType=request.headers.get("content-type")||"";
 const[{data:quote},{data:lines},{data:schedule},{data:last}]=await Promise.all([
  auth.supabase.from("quotes").select("*").eq("id",id).single(),
  auth.supabase.from("quote_items").select("*").eq("quote_id",id).order("sort_order"),
  auth.supabase.from("job_schedule_events").select("*").eq("quote_id",id).eq("event_type","Installation").neq("status","Cancelled").order("scheduled_date").limit(1),
  auth.supabase.from("quote_attachments").select("file_name").eq("quote_id",id).like("object_key",`pick-lists/${id}/%`)
 ]);
 if(!quote)return Response.json({error:"Quote or job not found."},{status:404});
 const version=Math.max(0,...(last??[]).map((row:any)=>versionOf(row.file_name)))+1;
 let bytes:Uint8Array,fileName:string,source:"Generated"|"Uploaded",type=MIME;
 if(contentType.includes("multipart/form-data")){
  const form=await request.formData(),file=form.get("file");
  if(!(file instanceof File)||!file.size)return Response.json({error:"Choose the completed Excel pick list."},{status:400});
  if(file.size>15*1024*1024)return Response.json({error:"The workbook must be 15 MB or smaller."},{status:413});
  if(!/\.(xlsm|xlsx|xls)$/i.test(file.name))return Response.json({error:"Upload an Excel workbook (.xlsm, .xlsx or .xls)."},{status:400});
  bytes=new Uint8Array(await file.arrayBuffer());fileName=file.name;source="Uploaded";
 }else{
  const template=await fs.readFile(path.join(process.cwd(),"public","templates","robeflow-pick-list-template.xlsm"));
  bytes=fillPickListWorkbook(template,quote,lines??[],schedule?.[0]??null);
  fileName=`${safeName(quote.quote_number)}-${safeName(quote.customer_name)}-Pick-List-v${version}.xlsm`;source="Generated";
 }
 const storedName=`[Pick List v${version} ${source}] ${fileName}`,objectKey=`pick-lists/${id}/${crypto.randomUUID()}-${safeName(fileName)}`;
 const upload=await auth.supabase.storage.from("robeflow-files").upload(objectKey,bytes,{contentType:type});
 if(upload.error)return Response.json({error:upload.error.message},{status:400});
 const{data,error}=await auth.supabase.from("quote_attachments").insert({quote_id:id,file_name:storedName,content_type:type,size:bytes.byteLength,object_key:objectKey}).select().single();
 if(error){await auth.supabase.storage.from("robeflow-files").remove([objectKey]);return Response.json({error:error.message},{status:400});}
 await auth.supabase.from("quotes").update({pick_list_status:source==="Uploaded"?"Completed workbook uploaded":"Workbook created"}).eq("id",id);
 await auth.supabase.from("quote_activities").insert({quote_id:id,action:source==="Uploaded"?"Pick list uploaded":"Pick list created",detail:`${fileName} (version ${version})`,actor:auth.profile.full_name||"RobeFlow"});
 return Response.json({document:documentOf(data,data.id)},{status:201});
}
