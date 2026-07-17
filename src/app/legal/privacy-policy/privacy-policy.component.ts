import { Component, OnInit } from '@angular/core';
import { LegalPageComponent } from '../legal-page.component';
import { LegalSection } from '../legal-section.model';
import { SeoService } from '../../services/seo';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [LegalPageComponent],
  template: `
    <app-legal-page
      pageTitle="Privacy Policy"
      lastUpdated="17 July 2026"
      [intro]="intro"
      [sections]="sections"
    />
  `,
})
export class PrivacyPolicyComponent implements OnInit {
  intro =
    'My Home Bazar ("we", "us", "our") operates the online marketplace at myhomebazar.com. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website, mobile experience, and related services in Pakistan.';

  sections: LegalSection[] = [
    {
      title: '1. Information We Collect',
      paragraphs: [
        'We collect information that you provide directly and information generated when you use My Home Bazar.',
      ],
      bullets: [
        'Account details: name, email address, phone number, password (stored securely), country, city, and state.',
        'Order & delivery information: shipping address, city, payment method, order history, and delivery preferences.',
        'Seller information (for store accounts): business details, product listings, and payout-related data where applicable.',
        'Communications: messages sent through our contact form, support requests, reviews, ratings, and claims.',
        'Payment data: we do not store full card or wallet credentials. Online payments are processed through secure third-party gateways (e.g. JazzCash, EasyPaisa). We may receive transaction references and payment status.',
        'Technical data: device type, browser, IP address, cookies, and usage logs to keep the platform secure and improve performance.',
      ],
    },
    {
      title: '2. How We Use Your Information',
      paragraphs: ['We use your information to operate and improve My Home Bazar, including to:'],
      bullets: [
        'Create and manage your buyer or seller account.',
        'Process orders, payments (including COD and online gateways), shipping, and delivery tracking.',
        'Send order confirmations, shipping updates, email verification, and password reset OTPs.',
        'Display product listings, personalized recommendations, and seller storefronts.',
        'Handle customer support, disputes, returns, and claims within our published claim window.',
        'Prevent fraud, enforce our Terms & Conditions, and comply with applicable laws in Pakistan.',
        'Send promotional updates only where you have agreed or where permitted by law (you may opt out anytime).',
      ],
    },
    {
      title: '3. Sharing of Information',
      paragraphs: [
        'We do not sell your personal data. We may share limited information with trusted parties only when necessary:',
      ],
      bullets: [
        'Sellers: when you place an order, relevant buyer contact and delivery details are shared with the seller fulfilling your order.',
        'Payment partners: JazzCash, EasyPaisa, or other licensed payment providers to complete transactions.',
        'Courier partners: TCS, PostEx, Leopards, or other logistics providers for shipment booking and tracking.',
        'Service providers: hosting, email (SMTP), cloud storage (e.g. AWS S3 for product images), and analytics under confidentiality obligations.',
        'Legal authorities: when required by law, court order, or to protect the rights and safety of users and My Home Bazar.',
      ],
    },
    {
      title: '4. Cookies & Similar Technologies',
      paragraphs: [
        'We use cookies and local storage to keep you signed in, remember theme preferences (light/dark mode), maintain your cart and wishlist, and understand how the site is used. You can control cookies through your browser settings, but some features may not work correctly if cookies are disabled.',
      ],
    },
    {
      title: '5. Data Retention',
      paragraphs: [
        'We retain account and order records for as long as your account is active and as needed for legal, tax, and dispute-resolution purposes. Unverified accounts that do not complete email verification may be automatically deleted after 24 hours. You may request account deletion by contacting support, subject to retention required for completed orders and legal compliance.',
      ],
    },
    {
      title: '6. Data Security',
      paragraphs: [
        'We use industry-standard measures including encrypted connections (HTTPS), secure password hashing, JWT-based authentication, and access controls for admin and seller panels. No method of transmission over the internet is 100% secure; please use a strong, unique password and keep your login credentials confidential.',
      ],
    },
    {
      title: '7. Your Rights',
      paragraphs: ['Depending on applicable law, you may have the right to:'],
      bullets: [
        'Access and update your profile information from My Account.',
        'Request correction or deletion of personal data (subject to legal exceptions).',
        'Withdraw marketing consent.',
        'File a complaint with us if you believe your data has been misused.',
      ],
    },
    {
      title: '8. Children\'s Privacy',
      paragraphs: [
        'My Home Bazar is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us data, please contact us so we can remove it.',
      ],
    },
    {
      title: '9. Third-Party Links',
      paragraphs: [
        'Our website may link to seller pages, payment gateways, or courier tracking sites. We are not responsible for the privacy practices of those third parties. Please review their policies before sharing information.',
      ],
    },
    {
      title: '10. Changes to This Policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. The "Last updated" date at the top will reflect changes. Continued use of My Home Bazar after updates means you accept the revised policy.',
      ],
    },
    {
      title: '11. Contact Us',
      paragraphs: [
        'For privacy-related questions or requests, contact My Home Bazar:',
      ],
      bullets: [
        'Email: myhomebazar.shop@gmail.com',
        'Phone: +92 348 6663576',
        'Address: Lahore DHA Phase 5, Pakistan',
        'Website: https://www.myhomebazar.com',
      ],
    },
  ];

  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.setPrivacyPolicySeo();
  }
}
