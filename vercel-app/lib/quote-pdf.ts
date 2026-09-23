import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import { quoteItemDetails } from "./quote-options";

type QuotePdfItem = {
  category: string;
  systemType: string;
  colour: string;
  designSelection?: string;
  hardwareColour?: string;
  doorConfiguration?: string;
  mirrorOption?: string;
  frameTrackColour?: string;
  description?: string;
  price: number;
};
type QuotePdfData = {
  quoteNumber: string;
  customerName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  customerAddress?: string;
  siteAddress?: string;
  project: string;
  validUntil: string;
  createdAt?: string;
  serviceType?: string;
  servicePrice?: number;
  salespersonName?: string;
  discountPercent?: number;
  items: QuotePdfItem[];
};

const green = rgb(0.016, 0.471, 0.341),
  navy = rgb(0.067, 0.094, 0.153),
  slate = rgb(0.392, 0.455, 0.545),
  line = rgb(0.86, 0.89, 0.93);
const money = (value: number) =>
  new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.round((value + Number.EPSILON) * 100) / 100);
const date = (value?: string) => {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }
  return new Date(value ?? Date.now()).toLocaleDateString("en-NZ");
};

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean),
    lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) current = next;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function pageFooter(page: PDFPage, regular: PDFFont, quoteNumber: string) {
  page.drawLine({
    start: { x: 42, y: 54 },
    end: { x: 553, y: 54 },
    thickness: 0.7,
    color: line,
  });
  page.drawText("RobeFlow Wardrobes | Christchurch, New Zealand", {
    x: 42,
    y: 35,
    size: 8,
    font: regular,
    color: slate,
  });
  page.drawText(quoteNumber, {
    x: 553 - regular.widthOfTextAtSize(quoteNumber, 8),
    y: 35,
    size: 8,
    font: regular,
    color: slate,
  });
}

export async function createQuotePdf(quote: QuotePdfData) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica),
    bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]),
    y = 786;
  const addHeader = () => {
    page.drawRectangle({
      x: 42,
      y: y - 4,
      width: 38,
      height: 38,
      color: green,
    });
    page.drawText("QF", {
      x: 51,
      y: y + 9,
      size: 13,
      font: bold,
      color: rgb(1, 1, 1),
    });
    page.drawText("RobeFlow Wardrobes", {
      x: 92,
      y: y + 15,
      size: 20,
      font: bold,
      color: navy,
    });
    page.drawText("Custom wardrobe solutions", {
      x: 92,
      y: y - 2,
      size: 10,
      font: regular,
      color: slate,
    });
    page.drawText("QUOTATION", {
      x: 421,
      y: y + 15,
      size: 20,
      font: regular,
      color: green,
    });
    page.drawText(quote.quoteNumber, {
      x: 553 - bold.widthOfTextAtSize(quote.quoteNumber, 10),
      y: y - 2,
      size: 10,
      font: bold,
      color: navy,
    });
    page.drawLine({
      start: { x: 42, y: y - 22 },
      end: { x: 553, y: y - 22 },
      thickness: 3,
      color: green,
    });
    y -= 55;
  };
  const addTableHeader = () => {
    page.drawRectangle({
      x: 42,
      y: y - 26,
      width: 511,
      height: 28,
      color: navy,
    });
    page.drawText("AREA / SYSTEM / COLOUR", {
      x: 54,
      y: y - 17,
      size: 9,
      font: bold,
      color: rgb(1, 1, 1),
    });
    const price = "PRICE INCL. GST";
    page.drawText(price, {
      x: 541 - bold.widthOfTextAtSize(price, 9),
      y: y - 17,
      size: 9,
      font: bold,
      color: rgb(1, 1, 1),
    });
    y -= 26;
  };
  addHeader();
  page.drawText("PREPARED FOR", {
    x: 42,
    y,
    size: 8,
    font: bold,
    color: slate,
  });
  page.drawText(quote.customerName, {
    x: 42,
    y: y - 22,
    size: 14,
    font: bold,
    color: navy,
  });
  const customerLines = [
    quote.companyName,
    quote.email,
    quote.phone,
    quote.customerAddress,
    quote.project,
  ].filter(Boolean) as string[];
  let customerY = y - 40;
  for (const value of customerLines)
    for (const text of wrap(value, regular, 9, 245)) {
      page.drawText(text, {
        x: 42,
        y: customerY,
        size: 9,
        font: regular,
        color: slate,
      });
      customerY -= 13;
    }
  page.drawText("Issued", { x: 363, y, size: 9, font: regular, color: slate });
  page.drawText(date(quote.createdAt), {
    x: 363,
    y: y - 18,
    size: 10,
    font: bold,
    color: navy,
  });
  page.drawText("Valid until", {
    x: 478,
    y,
    size: 9,
    font: regular,
    color: slate,
  });
  page.drawText(date(quote.validUntil), {
    x: 478,
    y: y - 18,
    size: 10,
    font: bold,
    color: navy,
  });
  if (quote.siteAddress) {
    page.drawText("Site address", {
      x: 363,
      y: y - 45,
      size: 9,
      font: regular,
      color: slate,
    });
    let siteY = y - 60;
    for (const text of wrap(quote.siteAddress, regular, 9, 190)) {
      page.drawText(text, {
        x: 363,
        y: siteY,
        size: 9,
        font: bold,
        color: navy,
      });
      siteY -= 12;
    }
  }
  page.drawText("Prepared by", {
    x: 363,
    y: y - 78,
    size: 9,
    font: regular,
    color: slate,
  });
  page.drawText(quote.salespersonName || "Sai Muddasani", {
    x: 363,
    y: y - 92,
    size: 9,
    font: bold,
    color: navy,
  });
  y = Math.min(customerY - 12, y - 112);
  addTableHeader();
  const printableItems = [
    ...quote.items,
    ...(Number(quote.servicePrice) > 0
      ? [
          {
            category: quote.serviceType || "Service",
            systemType: "Service",
            colour: "",
            price: Number(quote.servicePrice),
          },
        ]
      : []),
  ];
  for (const item of printableItems) {
    if (y < 145) {
      pageFooter(page, regular, quote.quoteNumber);
      page = pdf.addPage([595.28, 841.89]);
      y = 786;
      addHeader();
      addTableHeader();
    }
    page.drawText(item.category, {
      x: 54,
      y: y - 20,
      size: 11,
      font: bold,
      color: navy,
    });
    const detail =
      item.systemType === "Service" ? "Service charge" : quoteItemDetails(item);
    const detailLines = wrap(detail, regular, 8.5, 350).slice(0, 3);
    detailLines.forEach((text, index) =>
      page.drawText(text, {
        x: 54,
        y: y - 36 - index * 11,
        size: 8.5,
        font: regular,
        color: slate,
      }),
    );
    const amount = money(Number(item.price));
    page.drawText(amount, {
      x: 541 - bold.widthOfTextAtSize(amount, 11),
      y: y - 25,
      size: 11,
      font: bold,
      color: navy,
    });
    const rowHeight =
      detailLines.length > 2 ? 70 : detailLines.length > 1 ? 59 : 48;
    page.drawLine({
      start: { x: 42, y: y - rowHeight + 1 },
      end: { x: 553, y: y - rowHeight + 1 },
      thickness: 0.7,
      color: line,
    });
    y -= rowHeight;
  }
  const subtotal = printableItems.reduce(
      (sum, item) => sum + Number(item.price),
      0,
    ),
    discountPercent = Math.min(
      100,
      Math.max(0, Number(quote.discountPercent) || 0),
    ),
    total =
      Math.round(
        (subtotal * (1 - discountPercent / 100) + Number.EPSILON) * 100,
      ) / 100,
    gst = Math.round(((total * 3) / 23 + Number.EPSILON) * 100) / 100;
  y -= 18;
  if (discountPercent > 0) {
    page.drawText(`Discount (${discountPercent}%)`, {
      x: 363,
      y,
      size: 9,
      font: regular,
      color: slate,
    });
    const saved = money(subtotal - total);
    page.drawText(`-${saved}`, {
      x: 541 - regular.widthOfTextAtSize(`-${saved}`, 9),
      y,
      size: 9,
      font: regular,
      color: slate,
    });
    y -= 16;
  }
  page.drawText("Includes GST", {
    x: 363,
    y,
    size: 9,
    font: regular,
    color: slate,
  });
  page.drawText(money(gst), {
    x: 541 - regular.widthOfTextAtSize(money(gst), 9),
    y,
    size: 9,
    font: regular,
    color: slate,
  });
  page.drawLine({
    start: { x: 363, y: y - 12 },
    end: { x: 553, y: y - 12 },
    thickness: 1.5,
    color: green,
  });
  page.drawText("Total", {
    x: 363,
    y: y - 34,
    size: 15,
    font: bold,
    color: navy,
  });
  page.drawText(money(total), {
    x: 541 - bold.widthOfTextAtSize(money(total), 15),
    y: y - 34,
    size: 15,
    font: bold,
    color: navy,
  });
  const noteY = Math.max(82, y - 78);
  page.drawText(
    "Thank you for the opportunity to provide this quotation. Prices are in New Zealand dollars and include GST.",
    { x: 42, y: noteY, size: 8, font: regular, color: slate },
  );
  page.drawText("This quotation remains valid until the date shown above.", {
    x: 42,
    y: noteY - 12,
    size: 8,
    font: regular,
    color: slate,
  });
  pageFooter(page, regular, quote.quoteNumber);
  return pdf.save();
}
