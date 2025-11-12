'use client';

export interface ThermalPrintOptions {
  printerName?: string;
  paperWidth?: number;
  autocut?: boolean;
  feedLines?: number;
}

export class ThermalPrinter {
  private static instance: ThermalPrinter;

  public static getInstance(): ThermalPrinter {
    if (!ThermalPrinter.instance) {
      ThermalPrinter.instance = new ThermalPrinter();
    }
    return ThermalPrinter.instance;
  }

  async printESCPOS(commands: string, options: ThermalPrintOptions = {}): Promise<boolean> {
    try {
      // Create a new window for thermal printing
      const printWindow = window.open('', '', 'width=400,height=600');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }

      // Convert ESC/POS commands to HTML for browser printing
      const htmlContent = this.convertESCPOSToHTML(commands, options);
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => {
            printWindow.close();
          };
        }, 500);
      };

      return true;
    } catch (error) {
      console.error('Thermal printing error:', error);
      return false;
    }
  }

  private convertESCPOSToHTML(commands: string, options: ThermalPrintOptions): string {
    const paperWidth = options.paperWidth || 80; // Default 80mm
    const charWidth = paperWidth === 80 ? 48 : 32; // Characters per line

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Thermal Receipt</title>
          <style>
            @page {
              size: ${paperWidth}mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 5mm;
              width: ${paperWidth}mm;
              background: white;
              color: black;
            }
            .receipt-content {
              white-space: pre-wrap;
              word-break: break-word;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 16px; }
            .small { font-size: 10px; }
            .line { border-bottom: 1px dashed #000; margin: 2px 0; }
            @media print {
              body { margin: 0; padding: 2mm; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-content">${commands}</div>
          <script>
            window.onload = function() { 
              setTimeout(() => {
                window.print(); 
                window.onafterprint = function() { window.close(); }
              }, 100);
            }
          </script>
        </body>
      </html>
    `;
  }

  async printText(text: string, options: ThermalPrintOptions = {}): Promise<boolean> {
    return this.printESCPOS(text, options);
  }
}

export const thermalPrinter = ThermalPrinter.getInstance();
