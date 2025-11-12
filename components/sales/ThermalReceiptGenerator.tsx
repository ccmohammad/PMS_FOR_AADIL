'use client';

import { formatCurrency, formatDateTime } from '@/lib/formatters';

interface ThermalReceiptProps {
  sale: {
    _id: string;
    customer?: {
      name: string;
      phone?: string;
      email?: string;
    };
    items: Array<{
      product: {
        name: string;
        sku: string;
      };
      quantity: number;
      unitPrice: number;
      discount: number;
    }>;
    totalAmount: number;
    paymentMethod: string;
    createdAt: string;
    processedBy: {
      name: string;
    };
  };
  settings: {
    business: {
      pharmacyName: string;
      address: string;
      phone: string;
      email: string;
      registrationNumber?: string;
      taxId?: string;
    };
    invoice: {
      prefix?: string;
      footer?: string;
      terms?: string;
    };
  };
}

export class ThermalReceiptGenerator {
  private sale: ThermalReceiptProps['sale'];
  private settings: ThermalReceiptProps['settings'];
  private paperWidth: number = 48; // Characters per line for 80mm paper

  constructor({ sale, settings }: ThermalReceiptProps) {
    this.sale = sale;
    this.settings = settings;
  }

  generateESCPOSCommands(): string {
    let receipt = '';

    // Header
    receipt += this.centerText(this.settings.business.pharmacyName, true);
    receipt += this.centerText(this.settings.business.address);
    receipt += this.centerText(`Phone: ${this.settings.business.phone}`);
    receipt += this.centerText(`Email: ${this.settings.business.email}`);
    
    if (this.settings.business.registrationNumber) {
      receipt += this.centerText(`Reg: ${this.settings.business.registrationNumber}`);
    }
    
    receipt += this.printLine();
    
    // Invoice details
    receipt += this.centerText('SALES RECEIPT', true);
    receipt += this.printLine();
    
    receipt += `Invoice #: ${this.settings.invoice.prefix || ''}${this.sale._id.slice(-8)}\n`;
    receipt += `Date: ${formatDateTime(this.sale.createdAt, this.settings)}\n`;
    receipt += `Customer: ${this.sale.customer?.name || 'Walk-in Customer'}\n`;
    
    if (this.sale.customer?.phone) {
      receipt += `Phone: ${this.sale.customer.phone}\n`;
    }
    
    receipt += `Cashier: ${this.sale.processedBy?.name || 'Unknown'}\n`;
    receipt += this.printLine();
    
    // Items header
    receipt += this.formatRow('Item', 'Qty', 'Price', 'Total');
    receipt += this.printLine();
    
    // Items
    this.sale.items.forEach((item) => {
      const itemName = this.truncateText(item.product.name, 20);
      const qty = item.quantity.toString();
      const price = formatCurrency(item.unitPrice, this.settings);
      const total = formatCurrency((item.unitPrice - item.discount) * item.quantity, this.settings);
      
      receipt += this.formatRow(itemName, qty, price, total);
      
      if (item.discount > 0) {
        receipt += `  Discount: -${formatCurrency(item.discount * item.quantity, this.settings)}\n`;
      }
    });
    
    receipt += this.printLine();
    
    // Total
    receipt += this.formatRow('TOTAL', '', '', formatCurrency(this.sale.totalAmount, this.settings), true);
    receipt += `Payment: ${this.sale.paymentMethod}\n`;
    receipt += this.printLine();
    
    // Footer
    if (this.settings.invoice.footer) {
      receipt += this.centerText(this.settings.invoice.footer);
    } else {
      receipt += this.centerText('Thank you for your business!');
    }
    
    if (this.settings.invoice.terms) {
      receipt += this.centerText(this.settings.invoice.terms);
    }
    
    receipt += '\n\n\n'; // Feed lines
    
    return receipt;
  }

  private centerText(text: string, bold: boolean = false): string {
    const padding = Math.max(0, Math.floor((this.paperWidth - text.length) / 2));
    const centeredText = ' '.repeat(padding) + text;
    return bold ? `<span class="bold">${centeredText}</span>\n` : `${centeredText}\n`;
  }

  private printLine(): string {
    return '<div class="line"></div>\n';
  }

  private formatRow(col1: string, col2: string, col3: string, col4: string, bold: boolean = false): string {
    const col1Width = 20;
    const col2Width = 4;
    const col3Width = 8;
    const col4Width = 12;
    
    const formattedCol1 = this.padText(col1, col1Width, 'left');
    const formattedCol2 = this.padText(col2, col2Width, 'right');
    const formattedCol3 = this.padText(col3, col3Width, 'right');
    const formattedCol4 = this.padText(col4, col4Width, 'right');
    
    const row = `${formattedCol1}${formattedCol2}${formattedCol3}${formattedCol4}`;
    return bold ? `<span class="bold">${row}</span>\n` : `${row}\n`;
  }

  private padText(text: string, width: number, align: 'left' | 'right' | 'center' = 'left'): string {
    if (text.length >= width) {
      return text.substring(0, width);
    }
    
    const padding = width - text.length;
    
    switch (align) {
      case 'right':
        return ' '.repeat(padding) + text;
      case 'center':
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
      default:
        return text + ' '.repeat(padding);
    }
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }
}
