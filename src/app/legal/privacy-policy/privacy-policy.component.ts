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
      lastUpdated="27 September 2026"
      [intro]="intro"
      [sections]="sections"
    />
  `,
})
export class PrivacyPolicyComponent implements OnInit {
  intro =
    'My Home Bazar ("we", "us", "our") operates the online marketplace at myhomebazar.com and the seller/admin portal at admin.myhomebazar.com. This Privacy Policy explains how we collect, use, store, and protect your personal information when you browse, buy, sell, sign in (including Google or Facebook), or otherwise use our services in Pakistan.';

  sections: LegalSection[] = [
    {
      title: '1. Information We Collect',
      paragraphs: [
        'We collect information that you provide directly and information generated when you use My Home Bazar.',
      ],
      bullets: [
        'Account details: name, email address, phone number, password (for email sign-up only; stored using secure hashing), country, state, and city.',
        'Social sign-in (optional): if you choose "Continue with Google" or "Continue with Facebook", we receive information from that provider (typically your name, email address, and a unique provider user ID). We do not receive your Google or Facebook password. We store provider identifiers to recognize your account on future sign-ins.',
        'Order & delivery information: shipping address, city, payment method, order history, and delivery preferences.',
        'Seller information (for store accounts): business details, product listings, and payout-related data where applicable.',
        'Communications: in-app messages between buyers and sellers, contact form submissions, support requests, reviews, ratings, and order claims.',
        'Payment data: we do not store full card or wallet credentials. Online payments are processed through secure third-party gateways (e.g. JazzCash, EasyPaisa). We may receive transaction references and payment status.',
        'Technical data: device type, browser, IP address, cookies, local storage, and usage logs to keep the platform secure and improve performance.',
      ],
    },
    {
      title: '2. Sign-In with Google or Facebook',
      paragraphs: [
        'You may create or access a My Home Bazar account using Google or Facebook instead of email and password. When you do:',
      ],
      bullets: [
        'Google Sign-In: we verify an identity token with Google using your browser session. Google\'s privacy policy applies to their processing: https://policies.google.com/privacy',
        'Facebook Login: we verify an access token with Meta (Facebook). Meta\'s policy applies to their processing: https://www.facebook.com/privacy/policy/',
        'We use the email and profile data returned by the provider to create or match your My Home Bazar account. If the email is already registered with a password, you must sign in with email or contact support — we do not automatically merge accounts without your control.',
        'New social users must complete the same registration steps as manual sign-up (including country, state, city, and acceptance of these Terms and this Privacy Policy) before full access is granted.',
        'Seller/admin access via admin.myhomebazar.com uses the same social providers with a separate portal flag; only eligible seller or admin roles may use that site.',
      ],
    },
    {
      title: '3. How We Use Your Information',
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
      title: '4. Sharing of Information',
      paragraphs: [
        'We do not sell your personal data. We may share limited information with trusted parties only when necessary:',
      ],
      bullets: [
        'Sellers: when you place an order, relevant buyer contact and delivery details are shared with the seller fulfilling your order.',
        'Payment partners: JazzCash, EasyPaisa, or other licensed payment providers to complete transactions.',
        'Courier partners: TCS, PostEx, Leopards, or other logistics providers for shipment booking and tracking.',
        'Authentication providers: Google and Meta when you use social login, strictly to validate tokens and obtain the profile fields you authorize (such as email and public profile).',
        'Service providers: hosting, email (SMTP), cloud storage (e.g. AWS S3 for product images), and analytics under confidentiality obligations.',
        'Advertising: Google AdSense may show ads on our storefront and use cookies or similar technologies as described in Google\'s advertising policies: https://policies.google.com/technologies/ads',
        'Legal authorities: when required by law, court order, or to protect the rights and safety of users and My Home Bazar.',
      ],
    },
    {
      title: '5. Cookies & Similar Technologies',
      paragraphs: [
        'We use cookies and local storage to keep you signed in, remember theme preferences (light/dark mode), maintain your cart and wishlist, and understand how the site is used. Third parties such as Google (sign-in, AdSense) and Meta (Facebook Login) may set their own cookies when you use those features. You can control cookies through your browser settings, but some features may not work correctly if cookies are disabled.',
      ],
    },
    {
      title: '6. Data Retention',
      paragraphs: [
        'We retain account and order records for as long as your account is active and as needed for legal, tax, and dispute-resolution purposes. Unverified accounts that do not complete email verification may be automatically deleted after 24 hours. You may request account deletion by contacting support, subject to retention required for completed orders and legal compliance.',
      ],
    },
    {
      title: '7. Data Security',
      paragraphs: [
        'We use industry-standard measures including encrypted connections (HTTPS), secure password hashing, JWT-based authentication, and access controls for admin and seller panels. No method of transmission over the internet is 100% secure; please use a strong, unique password and keep your login credentials confidential.',
      ],
    },
    {
      title: '8. Your Rights & Data Deletion',
      paragraphs: ['Depending on applicable law, you may have the right to:'],
      bullets: [
        'Access and update your profile information from My Account where available.',
        'Request correction or deletion of personal data (subject to legal exceptions).',
        'Withdraw marketing consent.',
        'File a complaint with us if you believe your data has been misused.',
      ],
      paragraphsAfter: [
        'To delete your My Home Bazar account and associated personal data, email myhomebazar.shop@gmail.com from the address on your account with the subject "Account deletion request". Include your full name and whether you signed up with email, Google, or Facebook. We will verify ownership and delete or anonymize data within a reasonable period, except records we must keep for completed orders, tax, fraud prevention, or legal compliance. If you used Facebook Login, you may also remove the app from your Facebook Settings → Apps and Websites; that stops future Facebook sign-in but does not by itself delete data already stored on My Home Bazar — please email us for full deletion.',
      ],
    },
    {
      title: '9. Children\'s Privacy',
      paragraphs: [
        'My Home Bazar is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us data, please contact us so we can remove it.',
      ],
    },
    {
      title: '10. Third-Party Links',
      paragraphs: [
        'Our website may link to seller pages, payment gateways, or courier tracking sites. We are not responsible for the privacy practices of those third parties. Please review their policies before sharing information.',
      ],
    },
    {
      title: '11. Changes to This Policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. The "Last updated" date at the top will reflect changes. Continued use of My Home Bazar after updates means you accept the revised policy.',
      ],
    },
    {
      title: '12. Contact Us',
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
