import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NumberToWordsService {
  private ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  private tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  private teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

  private convertLessThanHundred(n: number): string {
    if (n === 0) return '';
    if (n < 10) return this.ones[n];
    if (n < 20) return this.teens[n - 10];
    return this.tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + this.ones[n % 10] : '');
  }

  public convert(num: number): string {
    if (num === 0) return 'zero';
    if (num < 0) return 'minus ' + this.convert(Math.abs(num));

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = '';

    if (crore > 0) {
      if (crore < 100) {
        result += this.convertLessThanHundred(crore) + ' crore ';
      } else {
        const hundreds = Math.floor(crore / 100);
        const remaining = crore % 100;
        result += this.ones[hundreds] + ' hundred' + (remaining > 0 ? ' and ' + this.convertLessThanHundred(remaining) : '') + ' crore ';
      }
    }

    if (lakh > 0) {
      result += this.convertLessThanHundred(lakh) + ' lakh ';
    }

    if (thousand > 0) {
      result += this.convertLessThanHundred(thousand) + ' thousand ';
    }

    if (remainder > 0) {
      const hundreds = Math.floor(remainder / 100);
      const remaining = remainder % 100;

      if (hundreds > 0) {
        result += this.ones[hundreds] + ' hundred';
        if (remaining > 0) {
          result += ' and ' + this.convertLessThanHundred(remaining);
        }
      } else if (remaining > 0) {
        result += this.convertLessThanHundred(remaining);
      }
    }

    return result.trim() + ' only';
  }
}