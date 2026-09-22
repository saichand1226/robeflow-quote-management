import { requireStaff } from "@/lib/api-auth";
import { appUrl,sendEmail } from "@/lib/email";
import { loadQuote,safe } from "@/lib/operational";
import { createInvoicePdf } from "@/lib/invoice-pdf";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const auth=await requireStaff(["Admin","Accounts","Staff"]);if(auth.error)return auth.error;
 const id=Number((await params).id),body=await request.json().catch(()=>({})),quote=await loadQuote(auth.supabase,id);
 if(!quote||quote.status!=="Accepted")return Response.json({error:"Accepted job not found."},{status:404});
 if(!quote.email)return Response.json({error:"Add the customer's email address first."},{status:400});
 const installation=quote.serviceType==="Installation",phase=installation?(body.phase||"deposit"):"full";
 if(!["deposit","balance","full"].includes(phase))return Response.json({error:"Choose a valid invoice type."},{status:400});
 if(phase==="balance"&&quote.jobStage!=="Completed")return Response.json({error:"The installation must be completed before sending the remaining balance invoice."},{status:400});
 const paid=quote.payments.reduce((sum:number,p:{amount:number})=>sum+Number(p.amount),0),half=Math.round(Number(quote.amount)*50)/100,invoiceAmount=phase==="deposit"?half:phase==="balance"?Math.max(0,Math.min(half,Math.round((Number(quote.amount)-paid)*100)/100)):Number(quote.amount),supplied=String(body.invoiceNumber||"").trim();
 if(invoiceAmount<=0)return Response.json({error:"There is no remaining balance to invoice."},{status:400});
 if(!supplied)return Response.json({error:"Enter the Xero invoice number first."},{status:400});
 const label=phase==="deposit"?"50% deposit":phase==="balance"?"remaining balance":"full",invoiceQuote={...quote,amount:invoiceAmount,items:[{category:`${label[0].toUpperCase()+label.slice(1)} for ${quote.project}`,systemType:"Accepted order",colour:"",price:invoiceAmount}],payments:[]};
 const{data:s}=await auth.supabase.from("company_settings").select("*").eq("id",1).single();
 try{
  const pdf=await createInvoicePdf({...invoiceQuote,invoiceNumber:supplied,bankDetails:s?.bank_details||"XYZ Bank\nAccount: 00-0000-0000000-00",companyNameSetting:s?.company_name||"RobeFlow Wardrobes",companyAddress:s?.address||"Christchurch, New Zealand",gstNumber:s?.gst_number||""} as never),url=`${appUrl()}/invoice/${quote.acceptanceToken}`,mail=await sendEmail({to:quote.email,subject:`${label[0].toUpperCase()+label.slice(1)} invoice ${supplied} for ${quote.project}`,idempotencyKey:`invoice-${id}-${phase}-${supplied}`,attachments:[{filename:`${supplied}.pdf`,content:Buffer.from(pdf).toString("base64")}],html:`<!doctype html><html lang="en"><body><div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6"><h1 style="color:#047857">${safe(label[0].toUpperCase()+label.slice(1))} invoice</h1><p>Hi ${safe(quote.customerName)},</p><p>Your ${safe(label)} invoice for <strong>${safe(quote.project)}</strong> is attached. The amount due is <strong>$${invoiceAmount.toFixed(2)}</strong>.</p><p><a href="${url}" style="display:inline-block;background:#047857;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">View order and bank details</a></p><p>Kind regards,<br><strong>RobeFlow Wardrobes</strong></p></div></body></html>`,text:`Hi ${quote.customerName},\n\nYour ${label} invoice ${supplied} for ${quote.project} is attached. Amount due: $${invoiceAmount.toFixed(2)}.\n\nKind regards,\nRobeFlow Wardrobes`});
  const now=new Date().toISOString(),paymentStatus=paid<=0?"Awaiting Deposit":paid>=Number(quote.amount)?"Paid in Full":paid+0.01>=half?"50% Paid":"Part Paid",changes:any={invoice_number:supplied,invoice_status:paymentStatus,invoice_sent_at:quote.invoiceSentAt||now};
  if(phase==="deposit"){changes.deposit_invoice_number=supplied;changes.deposit_invoice_sent_at=now}else if(phase==="balance"){changes.balance_invoice_number=supplied;changes.balance_invoice_sent_at=now}else changes.invoice_sent_at=now;
  const{data}=await auth.supabase.from("quotes").update(changes).eq("id",id).select().single();
  await Promise.all([auth.supabase.from("email_deliveries").insert({quote_id:id,kind:`${label} invoice`,recipient:quote.email,provider_id:mail.id}),auth.supabase.from("quote_activities").insert({quote_id:id,action:phase==="balance"?"Balance invoice sent":"Deposit invoice sent",detail:`${supplied} · $${invoiceAmount.toFixed(2)}`,actor:auth.profile.full_name})]);
  return Response.json({invoice:data,phase});
 }catch(error){return Response.json({error:error instanceof Error?error.message:"Invoice email could not be sent."},{status:502})}
}
