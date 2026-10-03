/**
 * Business-email check shared by the form (instant feedback) and the API
 * (authoritative). Blocks free/personal webmail, ISP mailboxes, and
 * disposable inboxes. Anything not listed is treated as a business domain.
 */

export const BUSINESS_EMAIL_MESSAGE =
  "Please use your work email. Personal addresses like Gmail, Yahoo or Outlook aren’t accepted.";

/**
 * Consumer brands blocked on any country TLD,
 * e.g. yahoo.co.uk, hotmail.es, outlook.com.ar, gmail.com.
 */
const PERSONAL_BRANDS = [
  "gmail",
  "googlemail",
  "yahoo",
  "ymail",
  "rocketmail",
  "hotmail",
  "outlook",
  "live",
  "msn",
  "windowslive",
  "aol",
  "icloud",
  "gmx",
  "yandex",
  "protonmail",
  "proton",
  "rediffmail",
];

const PERSONAL_BRAND_RE = new RegExp(`^(?:${PERSONAL_BRANDS.join("|")})\\.[a-z]{2,3}(?:\\.[a-z]{2})?$`);

/** Exact personal / ISP / disposable domains (subdomains are blocked too). */
const PERSONAL_DOMAINS = new Set([
  // Webmail
  "me.com", "mac.com", "mail.com", "email.com", "usa.com", "inbox.com", "zoho.com", "zohomail.com",
  "fastmail.com", "fastmail.fm", "hey.com", "pm.me", "tutanota.com", "tutanota.de", "tuta.io", "tuta.com",
  "duck.com", "hushmail.com", "mailfence.com", "posteo.de", "posteo.net", "runbox.com", "lycos.com",
  "excite.com", "mail.ru", "inbox.ru", "list.ru", "bk.ru", "rambler.ru", "ya.ru", "web.de", "freenet.de",
  "t-online.de", "libero.it", "virgilio.it", "tiscali.it", "alice.it", "tin.it", "orange.fr", "wanadoo.fr",
  "free.fr", "sfr.fr", "laposte.net", "seznam.cz", "wp.pl", "o2.pl", "interia.pl", "onet.pl", "abv.bg",
  "qq.com", "163.com", "126.com", "yeah.net", "sina.com", "sohu.com", "naver.com", "hanmail.net",
  "daum.net", "uol.com.br", "bol.com.br", "terra.com.br", "ig.com.br",
  // ISP mailboxes
  "comcast.net", "verizon.net", "att.net", "sbcglobal.net", "bellsouth.net", "cox.net", "charter.net",
  "earthlink.net", "juno.com", "optonline.net", "frontier.com", "windstream.net", "btinternet.com",
  "sky.com", "virginmedia.com", "ntlworld.com", "talktalk.net", "blueyonder.co.uk", "shaw.ca",
  "rogers.com", "sympatico.ca", "telus.net", "bigpond.com", "optusnet.com.au", "xtra.co.nz",
  // Disposable inboxes
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "sharklasers.com", "10minutemail.com",
  "tempmail.com", "temp-mail.org", "yopmail.com", "trashmail.com", "getnada.com", "dispostable.com",
  "maildrop.cc", "throwawaymail.com", "mintemail.com", "fakeinbox.com", "mailnesia.com", "emailondeck.com",
]);

/** Returns true if the address uses a personal, ISP, or disposable email domain. */
export function isPersonalEmail(email: string): boolean {
  const domain = email.split("@").pop()?.trim().toLowerCase().replace(/\.$/, "") ?? "";
  if (!domain) return false;
  if (PERSONAL_BRAND_RE.test(domain)) return true;

  // Check the domain and each parent domain, e.g. eu.mailinator.com → mailinator.com.
  const labels = domain.split(".");
  for (let i = 0; i < labels.length - 1; i++) {
    if (PERSONAL_DOMAINS.has(labels.slice(i).join("."))) return true;
  }
  return false;
}
