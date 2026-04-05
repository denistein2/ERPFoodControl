/**
 * Utilitário para geração de Payload PIX (BRCode) Estático
 */

export function generatePIXPayload(pixKey: string, merchantName: string, city: string, amount?: number): string {
  // Normalização e limpeza de campos (obrigatório no padrão BACEN)
  const name = merchantName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25).trim();
  const cityName = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15).trim();
  
  // Identificador da transação (Additional Data)
  const txid = 'ERP' + Date.now().toString().slice(-7);
  
  // Montagem do bloco 26 (Merchant Account Information)
  const gui = '0014BR.GOV.BCB.PIX';
  const key = '01' + pad(pixKey.length) + pixKey;
  const merchantInfo = gui + key;
  
  const parts = [
    '000201', // Payload Format Indicator
    '26' + pad(merchantInfo.length) + merchantInfo,
    '52040000', // Merchant Category Code
    '5303986', // Transaction Currency (986 = BRL)
  ];

  if (amount && amount > 0) {
    const amountStr = amount.toFixed(2);
    parts.push('54' + pad(amountStr.length) + amountStr);
  }

  parts.push('5802BR'); // Country Code
  parts.push('59' + pad(name.length) + name); // Merchant Name
  parts.push('60' + pad(cityName.length) + cityName); // Merchant City
  
  // Bloco 62 (Additional Data Field Template) - Usando Tag 05 (Reference Label)
  const refTag = '05' + pad(txid.length) + txid;
  parts.push('62' + pad(refTag.length) + refTag);
  
  parts.push('6304'); // CRC16 indicator

  const payload = parts.join('');
  return payload + calculateCRC16(payload);
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Cálculo de CRC16 CCITT (0xFFFF)
 */
function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    crc ^= (charCode << 8);

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}
