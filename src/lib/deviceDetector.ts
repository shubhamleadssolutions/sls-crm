export interface DeviceInfo {
  platform: 'Computer' | 'Mobile' | 'Tablet';
  device: string;
  os: string;
  browser: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Extracts comprehensive platform, device, OS, browser, and IP address
 * from incoming HTTP Request headers.
 */
export function detectDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers.get('user-agent') || 'Unknown User-Agent';
  const secChUaPlatform = req.headers.get('sec-ch-ua-platform')?.replace(/"/g, '') || '';
  const secChUaMobile = req.headers.get('sec-ch-ua-mobile') === '?1';

  // 1. IP Address extraction (handles standard proxies, Cloudflare, and local development)
  let ipAddress =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  if (ipAddress === '::1' || ipAddress === '::ffff:127.0.0.1') {
    ipAddress = '127.0.0.1 (Localhost)';
  }

  // 2. Platform Category (Computer, Mobile, Tablet)
  let platform: 'Computer' | 'Mobile' | 'Tablet' = 'Computer';
  const uaLower = userAgent.toLowerCase();

  const isTablet =
    /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(userAgent);
  const isMobile =
    /(android.*mobile|iphone|ipod|blackberry|iemobile|opera mini|mobile|phone)/i.test(userAgent) || secChUaMobile;

  if (isTablet) {
    platform = 'Tablet';
  } else if (isMobile) {
    platform = 'Mobile';
  } else {
    platform = 'Computer';
  }

  // 3. Operating System (OS) Detection
  let os = 'Unknown OS';
  if (/windows nt 10\.0/i.test(userAgent)) {
    os = 'Windows 11 / 10';
  } else if (/windows nt 6\.3/i.test(userAgent)) {
    os = 'Windows 8.1';
  } else if (/windows nt 6\.1/i.test(userAgent)) {
    os = 'Windows 7';
  } else if (/windows/i.test(userAgent) || secChUaPlatform.toLowerCase() === 'windows') {
    os = 'Windows';
  } else if (/iphone/i.test(userAgent)) {
    const match = userAgent.match(/os (\d+_\d+)/i);
    os = match ? `iOS ${match[1].replace('_', '.')}` : 'iOS (iPhone)';
  } else if (/ipad/i.test(userAgent)) {
    const match = userAgent.match(/os (\d+_\d+)/i);
    os = match ? `iPadOS ${match[1].replace('_', '.')}` : 'iPadOS';
  } else if (/mac os x/i.test(userAgent) || secChUaPlatform.toLowerCase() === 'macos') {
    const match = userAgent.match(/mac os x (\d+[._]\d+)/i);
    os = match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
  } else if (/android/i.test(userAgent) || secChUaPlatform.toLowerCase() === 'android') {
    const match = userAgent.match(/android (\d+(\.\d+)?)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/cros/i.test(userAgent)) {
    os = 'ChromeOS';
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux';
  }

  // 4. Device Identification
  let device = 'Desktop / Laptop';
  if (platform === 'Mobile') {
    if (/iphone/i.test(userAgent)) {
      device = 'Apple iPhone';
    } else if (/samsung/i.test(userAgent)) {
      device = 'Samsung Galaxy Phone';
    } else if (/pixel/i.test(userAgent)) {
      device = 'Google Pixel Phone';
    } else if (/oneplus/i.test(userAgent)) {
      device = 'OnePlus Mobile';
    } else if (/xiaomi|mi |redmi|poco/i.test(userAgent)) {
      device = 'Xiaomi / Redmi Mobile';
    } else if (/oppo/i.test(userAgent)) {
      device = 'OPPO Mobile';
    } else if (/vivo/i.test(userAgent)) {
      device = 'Vivo Mobile';
    } else {
      device = 'Mobile Smartphone';
    }
  } else if (platform === 'Tablet') {
    if (/ipad/i.test(userAgent)) {
      device = 'Apple iPad';
    } else {
      device = 'Android / Windows Tablet';
    }
  } else {
    // Computer
    if (/macintosh|mac os x/i.test(userAgent)) {
      device = 'Apple Mac / MacBook';
    } else if (/windows/i.test(userAgent)) {
      device = 'Windows PC / Laptop';
    } else if (/linux/i.test(userAgent)) {
      device = 'Linux Computer';
    } else {
      device = 'Personal Computer';
    }
  }

  // 5. Browser Detection
  let browser = 'Web Browser';
  if (/edg\//i.test(userAgent)) {
    const match = userAgent.match(/edg\/(\d+)/i);
    browser = match ? `Microsoft Edge ${match[1]}` : 'Microsoft Edge';
  } else if (/opr\/|opera/i.test(userAgent)) {
    const match = userAgent.match(/(?:opr|opera)\/(\d+)/i);
    browser = match ? `Opera ${match[1]}` : 'Opera';
  } else if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) {
    const match = userAgent.match(/chrome\/(\d+)/i);
    browser = match ? `Google Chrome ${match[1]}` : 'Google Chrome';
  } else if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) {
    const match = userAgent.match(/version\/(\d+)/i);
    browser = match ? `Apple Safari ${match[1]}` : 'Apple Safari';
  } else if (/firefox\//i.test(userAgent)) {
    const match = userAgent.match(/firefox\/(\d+)/i);
    browser = match ? `Mozilla Firefox ${match[1]}` : 'Mozilla Firefox';
  }

  return {
    platform,
    device,
    os,
    browser,
    ipAddress,
    userAgent,
  };
}
