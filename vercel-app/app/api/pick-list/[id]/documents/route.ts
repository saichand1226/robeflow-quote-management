import { camel,requireStaff } from "@/lib/api-auth";

const MIME="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const safeName=(value:string)=>value.replace(/[^a-zA-Z0-9._-]/g,"_");
const versionOf=(name:string)=>Number(name.match(/^\[Pick List v(\d+)/i)?.[1]||0);
const documentOf=(row:any,currentId?:number,uploadedBy="RobeFlow staff")=>({id:row.id,version:versionOf(row.file_name),fileName:row.file_name.replace(/^\[Pick List v\d+ Uploaded\]\s*/i,""),size:Number(row.size)||0,source:"Uploaded",uploadedBy,isCurrent:row.id===(currentId??row.id),createdAt:row.created_at});
async function list(auth:any,id:number){const[{data,error},{data:activities}]=await Promise.all([auth.supabase.from("quote_attachments").select("*").eq("quote_id",id).like("object_key",`pick-lists/${id}/%`).order("created_at",{ascending:false}),auth.supabase.from("quote_activities").select("detail,actor").eq("quote_id",id).eq("action","Pick list uploaded").order("created_at",{ascending:false})]);if(error)return Response.json({error:error.message},{status:400});const rows=(data??[]).sort((a:any,b:any)=>versionOf(b.file_name)-versionOf(a.file_name)),actorByVersion=new Map<number,string>((activities??[]).map((activity:any)=>[Number(activity.detail?.match(/\(version (\d+)\)/i)?.[1]||0),String(activity.actor||"RobeFlow staff")]));return Response.json({documents:rows.map((row:any)=>documentOf(row,rows[0]?.id,actorByVersion.get(versionOf(row.file_name))||"RobeFlow staff"))});}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const auth=await requireStaff();if(auth.error)return auth.error;return list(auth,Number((await params).id));}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const auth=await requireStaff(["Admin","Sales","Operations","Staff"]);if(auth.error)return auth.error;
 const id=Number((await params).id);
 const[{data:quote},{data:last}]=await Promise.all([
  auth.supabase.from("quotes").select("*").eq("id",id).single(),
  auth.supabase.from("quote_attachments").select("file_name").eq("quote_id",id).like("object_key",`pick-lists/${id}/%`)
 ]);
 if(!quote)return Response.json({error:"Quote or job not found."},{status:404});
 const version=Math.max(0,...(last??[]).map((row:any)=>versionOf(row.file_name)))+1;
 const form=await request.formData(),file=form.get("file");
 if(!(file instanceof File)||!file.size)return Response.json({error:"Choose the completed Excel pick list."},{status:400});
 if(file.size>15*1024*1024)return Response.json({error:"The workbook must be 15 MB or smaller."},{status:413});
 if(!/\.(xlsm|xlsx|xls)$/i.test(file.name))return Response.json({error:"Upload an Excel workbook (.xlsm, .xlsx or .xls)."},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer()),fileName=file.name,type=MIME;
 const storedName=`[Pick List v${version} Uploaded] ${fileName}`,objectKey=`pick-lists/${id}/${crypto.randomUUID()}-${safeName(fileName)}`;
 const upload=await auth.supabase.storage.from("robeflow-files").upload(objectKey,bytes,{contentType:type});
 if(upload.error)return Response.json({error:upload.error.message},{status:400});
 const{data,error}=await auth.supabase.from("quote_attachments").insert({quote_id:id,file_name:storedName,content_type:type,size:bytes.byteLength,object_key:objectKey}).select().single();
 if(error){await auth.supabase.storage.from("robeflow-files").remove([objectKey]);return Response.json({error:error.message},{status:400});}
 await auth.supabase.from("quotes").update({pick_list_status:"Excel pick list uploaded"}).eq("id",id);
 await auth.supabase.from("quote_activities").insert({quote_id:id,action:"Pick list uploaded",detail:`${fileName} (version ${version})`,actor:auth.profile.full_name||"RobeFlow"});
 return Response.json({document:documentOf(data,data.id)},{status:201});
}
