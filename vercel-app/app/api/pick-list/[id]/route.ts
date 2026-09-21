import { camel,requireStaff } from "@/lib/api-auth";

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const auth=await requireStaff();if(auth.error)return auth.error;
 const id=Number((await params).id);
 const[{data:quote},{data:lines},{data:schedule}]=await Promise.all([
  auth.supabase.from("quotes").select("*").eq("id",id).single(),
  auth.supabase.from("quote_items").select("*").eq("quote_id",id).order("sort_order"),
  auth.supabase.from("job_schedule_events").select("*").eq("quote_id",id).eq("event_type","Installation").neq("status","Cancelled").order("scheduled_date").limit(1)
 ]);
 if(!quote)return Response.json({error:"Quote or job not found."},{status:404});
 return Response.json({job:camel(quote),lines:(lines??[]).map(camel),installation:schedule?.[0]?camel(schedule[0]):null});
}
