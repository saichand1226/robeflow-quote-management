import { camel } from "@/lib/api-auth";

export async function loadQuote(supabase:any,id:number):Promise<any|null>{
 const [{data:quote,error},{data:items},{data:payments},{data:attachments},{data:activities}]=await Promise.all([
  supabase.from("quotes").select("*").eq("id",id).single(),supabase.from("quote_items").select("*").eq("quote_id",id).order("sort_order"),
  supabase.from("payment_transactions").select("*").eq("quote_id",id).order("payment_date",{ascending:false}),supabase.from("quote_attachments").select("*").eq("quote_id",id).order("created_at"),
  supabase.from("quote_activities").select("*").eq("quote_id",id).order("created_at",{ascending:false})]);
 if(error)return null;return {...camel(quote),items:(items??[]).map(camel),payments:(payments??[]).map(camel),attachments:(attachments??[]).filter((row:any)=>row.object_key?.startsWith("quotes/")).map(camel),activities:(activities??[]).map(camel)};
}
export const safe=(value:string)=>value.replace(/[<>&"']/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&#39;"}[c]!));
