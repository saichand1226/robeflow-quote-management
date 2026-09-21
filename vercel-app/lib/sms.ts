export async function sendSms(to:string,body:string){
 const accountSid=process.env.TWILIO_ACCOUNT_SID,authToken=process.env.TWILIO_AUTH_TOKEN,from=process.env.TWILIO_PHONE_NUMBER;
 if(!accountSid||!authToken||!from)throw new Error("SMS is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER in Vercel.");
 const phone=to.replace(/[\s()-]/g,"").replace(/^0/,"+64");
 const form=new URLSearchParams({To:phone,From:from,Body:body}),response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,{method:"POST",headers:{Authorization:`Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,"Content-Type":"application/x-www-form-urlencoded"},body:form});
 if(!response.ok){const detail=await response.text();throw new Error(`SMS provider rejected the message (${response.status}). ${detail.slice(0,240)}`)}
 return response.json() as Promise<{sid:string}>;
}
