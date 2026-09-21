import { unzipSync,zipSync,strFromU8,strToU8 } from "fflate";

type Quote=Record<string,unknown>;
type QuoteLine=Record<string,unknown>;
type Schedule=Record<string,unknown>|null;

const xmlEscape=(value:unknown)=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&apos;");
const normal=(value:unknown)=>String(value??"").toLowerCase().replace(/[^a-z0-9]+/g,"");
const nzDate=(value:unknown)=>{if(!value)return "";const date=new Date(`${String(value).slice(0,10)}T00:00:00`);return Number.isNaN(date.valueOf())?String(value):date.toLocaleDateString("en-NZ",{day:"2-digit",month:"2-digit",year:"numeric"})};

function setCell(xml:string,cell:string,value:unknown,type:"string"|"number"="string"){
 const matcher=new RegExp(`<c\\b([^>]*?\\br=\"${cell}\"[^>]*?)\\s*(?:\\/>|>([\\s\\S]*?)<\\/c>)`);
 const found=xml.match(matcher);
 const body=type==="number"?`<v>${Number(value)||0}</v>`:`<is><t xml:space="preserve">${xmlEscape(value)}</t></is>`;
 if(!found){const row=cell.match(/\d+$/)?.[0];if(!row)throw new Error(`Invalid workbook cell ${cell}.`);const rowMatcher=new RegExp(`(<row\\b[^>]*\\br=\"${row}\"[^>]*>[\\s\\S]*?)(<\\/row>)`);if(!rowMatcher.test(xml))throw new Error(`Workbook template row ${row} was not found.`);return xml.replace(rowMatcher,`$1<c r="${cell}"${type==="string"?' t="inlineStr"':""}>${body}</c>$2`)}
 const attrs=found[1].replace(/\s+t=\"[^\"]*\"/g,"").replace(/\/$/,"");
 return xml.replace(matcher,`<c${attrs}${type==="string"?' t="inlineStr"':""}>${body}</c>`);
}

const comboRows:Record<string,number>={
 "irobe1":3,"irobe1a":4,"irobe2":5,"irobe2a":6,"irobe3":7,"irobe3a":8,"irobe3b":9,
 "irobe3b6drw":10,"irobe3b6drawer":10,"irobe3c":11,"irobe3c6drw":12,"irobe3c6drawer":12,
 "irobe4":13,"irobe4a":14,"irobe4b":15,"irobe4c":16,"irobe5":17,"irobe56drw":18,"irobe56drawer":18,
 "irobe5a":19,"irobe5a6drw":20,"irobe5a6drawer":20,"irobe5b":21,"irobe5b6drw":22,"irobe5b6drawer":22,
 "irobe5c":23,"irobe5c6drw":24,"irobe5c6drawer":24,"irobe6":25,"irobe6a":26,"irobe6b":27,"irobe6c":28,
 "irobe6d":29,"irobe7":30,"irobe7a":31,"irobe7a6drw":32,"irobe7a6drawer":32,"irobe7b":33,
 "irobe8":34,"irobe8a6drws":35,"irobe8a6drawer":35,"irobe8b":36,"irobe8c":37,
 "irobeflexi450mm6shelf":39,"irobeflexi600mm6shelf":40,"irobeflexi450mm3drawer":41,
 "irobeflexi600mm3drawer":42,"irobeflexi450mm6drawer":43,"irobeflexi600mm6drawer":44
};

export function fillPickListWorkbook(template:Uint8Array,quote:Quote,lines:QuoteLine[],installation:Schedule){
 const files=unzipSync(template),sheet1="xl/worksheets/sheet1.xml",comboSheet="xl/worksheets/sheet5.xml";
 let details=strFromU8(files[sheet1]);
 const installDate=installation?.scheduled_date||"";
 const serviceName=String(quote.service_type||"Pick Up").toUpperCase();
 const service=serviceName==="INSTALLATION"?"INSTALL":serviceName==="PICK UP"?"PICKUP":serviceName==="FREIGHT"||serviceName==="DELIVERY"?"SHIP":serviceName;
 const fields:Record<string,unknown>={
  B5:nzDate(new Date().toISOString()),C6:nzDate(installDate),F5:quote.quote_number,B6:quote.salesperson_name,
  B7:quote.invoice_status,B9:quote.customer_name,B10:quote.site_address,B11:quote.customer_address,
  B12:quote.phone,B13:quote.email,B15:quote.company_name,F16:quote.purchase_order_number,
  F17:nzDate(installDate),F18:nzDate(installDate),F19:installation?.start_time||"",F1:service
 };
 for(const[cell,value]of Object.entries(fields))details=setCell(details,cell,value);
 const counts={irobe:0,premium:0,freestanding:0,cabinet:0,linen:0,accessories:0,doors:0};
 for(const line of lines){const system=normal(line.system_type),qty=Math.max(1,Number(line.quantity)||1);if(system==="irobe")counts.irobe+=qty;else if(system.includes("premium"))counts.premium+=qty;else if(system.includes("free"))counts.freestanding+=qty;else if(system.includes("cabinet"))counts.cabinet+=qty;else if(system.includes("linen"))counts.linen+=qty;else if(system.includes("accessor"))counts.accessories+=qty;else if(system.includes("door"))counts.doors+=qty}
 for(const[cell,value]of Object.entries({B26:counts.irobe,B27:counts.premium,B28:counts.freestanding,B29:counts.cabinet,B30:counts.linen,B31:counts.accessories,B32:counts.doors}))details=setCell(details,cell,value,"number");
 files[sheet1]=strToU8(details);
 let combos=strFromU8(files[comboSheet]);
 const quantities=new Map<number,number>();
 for(const line of lines){if(normal(line.system_type)!=="irobe")continue;const row=comboRows[normal(line.design_selection)];if(row)quantities.set(row,(quantities.get(row)||0)+Math.max(1,Number(line.quantity)||1))}
 for(let row=3;row<=55;row++)combos=setCell(combos,`E${row}`,quantities.get(row)||0,"number");
 files[comboSheet]=strToU8(combos);
 return zipSync(files,{level:6});
}
