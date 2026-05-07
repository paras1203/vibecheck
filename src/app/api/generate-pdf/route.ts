import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import { resolveChromiumExecutablePath } from "@/lib/chromium-executable";
import { getPuppeteerWithStealth } from "@/lib/screenshot";
import { generateFreeRoastCertificateHTML, generatePaidAgencyReportHTML } from "@/lib/pdf-templates";
import { shouldUseBundledChromium } from "@/lib/should-use-bundled-chromium";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const body = await request.json();
    const {
      roastData,
      isPaid = false,
      url = "https://siteroast.ai",
      calculator,
    } = body;

    if (!roastData) {
      return NextResponse.json(
        { error: "Roast data is required" },
        { status: 400 }
      );
    }

    // Generate HTML based on tier
    const html = isPaid
      ? await generatePaidAgencyReportHTML(roastData, url, calculator)
      : await generateFreeRoastCertificateHTML(roastData, url, calculator);

    const puppeteer = await getPuppeteerWithStealth();

    const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
      defaultViewport: { width: 1200, height: 1600 },
    };

    if (shouldUseBundledChromium()) {
      launchOptions.args = [
        ...chromium.args,
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
      ];
      launchOptions.executablePath = await resolveChromiumExecutablePath();
    }

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    await page
      .evaluate(() =>
        Promise.all(
          [...document.images].map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                })
          )
        )
      )
      .catch(() => undefined);

    await page
      .evaluate(() => document.fonts?.ready ?? Promise.resolve())
      .catch(() => undefined);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
    });

    await browser.close();
    browser = null;

    const filename = isPaid 
      ? 'roast-report-full.pdf' 
      : 'roast-report-teaser.pdf';

    const bytes = new Uint8Array(pdfBuffer);
    const ab = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    );
    return new NextResponse(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    
    if (browser) {
      await browser.close();
    }

    return NextResponse.json(
      { 
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

