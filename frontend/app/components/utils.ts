export const makeCRCTable = () => {
  var c;
  var crcTable = [];
  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
};

export const crc32 = (str: string) => {
  var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
  var crc = 0 ^ -1;

  for (var i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xff];
  }

  return (crc ^ -1) >>> 0;
};

export const parsePrice = (p: string) =>
  parseInt(p.replace(".", "")).toString();

export const roundPrice = (value: number, price_decimals: number) => {
  if (price_decimals > 0) {
    const precision = Math.pow(10, price_decimals);

    if (precision) {
      return Math.round(value * precision) / precision;
    }
  }
  return value;
};

export const isObject = (value: any) => {
  return typeof value === "object" && !Array.isArray(value) && value !== null;
};

export const startOfTheDay = () => {
  const now = new Date().getTime();
  return now - (now % 86400000);
};
