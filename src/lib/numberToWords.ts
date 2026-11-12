export function numberToIndianWords(num: number): string {
  if (!num || isNaN(num) || num === 0) return 'Zero Rupees Only';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];

  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  function convertChunk(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        str += ones[n] + ' ';
      } else {
        str += tens[Math.floor(n / 10)] + ' ';
        if (n % 10 > 0) {
          str += ones[n % 10] + ' ';
        }
      }
    }
    return str.trim();
  }

  const integerPart = Math.floor(Math.abs(num));
  let rem = integerPart;
  const parts: string[] = [];

  const crore = Math.floor(rem / 10000000);
  rem %= 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  const remainder = rem;

  if (crore > 0) parts.push(convertChunk(crore) + ' Crore');
  if (lakh > 0) parts.push(convertChunk(lakh) + ' Lakh');
  if (thousand > 0) parts.push(convertChunk(thousand) + ' Thousand');
  if (remainder > 0) parts.push(convertChunk(remainder));

  const result = parts.join(' ').trim();
  return (result || 'Zero') + ' Rupees Only';
}
