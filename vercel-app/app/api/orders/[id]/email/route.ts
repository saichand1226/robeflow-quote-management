import { requireStaff } from "@/lib/api-auth";
import { sendEmail } from "@/lib/email";
import { loadQuote,safe } from "@/lib/operational";
import { createQuotePdf } from "@/lib/quote-pdf";

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
 const auth=await requireStaff(["Admin","Accounts","Sales","Staff"]);if(auth.error)return auth.error;
 const id=Number((await params).id),quote=await loadQuote(auth.supabase,id);
 if(!quote||quote.status!=="Accepted")return Response.json({error:"Accepted order not found."},{status:404});
 if(!quote.email)return Response.json({error:"Add the customer's email address first."},{status:400});
 try{
  const pdf=await createQuotePdf(quote),mail=await sendEmail({to:quote.email,subject:`Order confirmation ${quote.quoteNumber} – ${quote.project}`,idempotencyKey:`order-confirmation-${id}`,attachments:[{filename:`Order-${quote.quoteNumber}.pdf`,content:Buffer.from(pdf).toString("base64")}],html:`<!doctype html><html lang="en"><body><div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6"><h1 style="color:#047857">Order confirmed</h1><p>Hi ${safe(quote.customerName)},</p><p>Thank you for approving your order for <strong>${safe(quote.project)}</strong>.</p><p>The full accepted order value is <strong>$${Number(quote.amount).toFixed(2)}</strong>. Your order confirmation is attached separately from your deposit invoice.</p><p>Kind regards,<br><strong>RobeFlow Wardrobes</strong></p></div></body></html>`,text:`Hi ${quote.customerName},\n\nYour order ${quote.quoteNumber} for ${quote.project} is confirmed. Full accepted order value: $${Number(quote.amount).toFixed(2)}.\n\nKind regards,\nRobeFlow Wardrobes`}),now=new Date().toISOString();
  await Promise.all([auth.supabase.from("quotes").update({order_confirmation_sent_at:now}).eq("id",id),auth.supabase.from("email_deliveries").insert({quote_id:id,kind:"Order confirmation",recipient:quote.email,provider_id:mail.id}),auth.supabase.from("quote_activities").insert({quote_id:id,action:"Order confirmation sent",detail:`Full order value $${Number(quote.amount).toFixed(2)}`,actor:auth.profile.full_name})]);
  return Response.json({success:true,sentAt:now});
 }catch(error){return Response.json({error:error instanceof Error?error.message:"Order confirmation could not be sent."},{status:502})}
}
