type Mail={to:string;subject:string;html:string;text:string;idempotencyKey:string;attachments?:{filename:string;content:string}[]};
export async function sendEmail(mail:Mail){
 const key=process.env.RESEND_API_KEY;if(!key)throw new Error("Email service is not configured in Vercel.");
 let response:Response|null=null;
 for(let attempt=0;attempt<3;attempt++){
  response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json","Idempotency-Key":mail.idempotencyKey},body:JSON.stringify({from:process.env.QUOTE_EMAIL_FROM||"RobeFlow <onboarding@resend.dev>",to:[mail.to],reply_to:process.env.QUOTE_EMAIL_REPLY_TO||undefined,subject:mail.subject,html:mail.html,text:mail.text,attachments:mail.attachments})});
  if(response.ok)break;if(response.status!==429&&response.status<500)break;await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));
 }
 if(!response)throw new Error("Email provider did not return a response.");if(!response.ok){let detail="";try{const body=await response.json() as {message?:string;error?:string};detail=body.message||body.error||""}catch{}const sender=process.env.QUOTE_EMAIL_FROM;if(response.status===403)throw new Error(sender?`Resend rejected the sender ${sender}. Verify its domain in Resend, then redeploy. ${detail}`:`Resend only allows the test sender to email the account owner. Verify a sending domain and set QUOTE_EMAIL_FROM in Vercel. ${detail}`);throw new Error(`Email provider rejected the message (${response.status}).${detail?` ${detail}`:""}`)}return response.json() as Promise<{id:string}>;
}
export const appUrl=()=>process.env.PUBLIC_APP_URL||process.env.NEXT_PUBLIC_APP_URL||"https://robeflow-quote-management.vercel.app";
