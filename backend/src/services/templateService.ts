import fs from 'fs';
import path from 'path';

/**
 * Renders an inline-styled HTML email template with {{placeholder}} variable substitution.
 */
export const renderEmailTemplate = (
  templateName: string,
  variables: Record<string, string | number> = {}
): string => {
  const currentYear = new Date().getFullYear().toString();
  const mergedVariables: Record<string, string | number> = {
    year: currentYear,
    ...variables,
  };

  // Resolve template file path
  // Supports both src/ and dist/ runtime environments
  const possiblePaths = [
    path.join(__dirname, '..', 'templates', 'email', `${templateName}.html`),
    path.join(__dirname, '..', '..', 'src', 'templates', 'email', `${templateName}.html`),
  ];

  let rawHtml = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      rawHtml = fs.readFileSync(p, 'utf-8');
      break;
    }
  }

  // Fallback if template file is missing
  if (!rawHtml) {
    return `
      <div style="font-family: sans-serif; padding: 20px; line-height: 1.5;">
        <h2>${mergedVariables.subject || mergedVariables.title || 'AcademiaSync Notification'}</h2>
        <p>Dear ${mergedVariables.recipientName || 'Faculty Member'},</p>
        <p>${mergedVariables.message || mergedVariables.courseTitle || ''}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <small style="color: #888;">AcademiaSync Institutional Portal &copy; ${currentYear}</small>
      </div>
    `;
  }

  // Replace all provided {{placeholder}} tokens
  let rendered = rawHtml;
  for (const [key, val] of Object.entries(mergedVariables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, String(val ?? ''));
  }

  // Strip any remaining unreplaced {{...}} placeholders so raw syntax never leaks to recipients
  rendered = rendered.replace(/{{[a-zA-Z0-9_]+}}/g, '');

  return rendered;
};
