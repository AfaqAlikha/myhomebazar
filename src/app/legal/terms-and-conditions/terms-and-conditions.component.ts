import { Component, OnInit } from '@angular/core';
import { LegalPageComponent } from '../legal-page.component';
import { LegalSection } from '../legal-section.model';
import { SeoService } from '../../services/seo';

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [LegalPageComponent],
  template: `
    <app-legal-page
      pageTitle="Terms & Conditions"
      lastUpdated="17 July 2026"
      [intro]="intro"
      [sections]="sections"
    />
  `,
})
export class TermsAndConditionsComponent implements OnInit {
  intro =
    'Welcome to My Home Bazar. By accessing or using our website, creating an account, or placing an order, you agree to these Terms & Conditions. Please read them carefully. If you do not agree, do not use our services.';

  sections: LegalSection[] = [
    {
      title: '1. About My Home Bazar',
      paragraphs: [
        'My Home Bazar is an online marketplace based in Pakistan that connects buyers with independent sellers offering home products, furniture, electronics, kitchen items, and related goods. We facilitate listings, orders, payments, and delivery coordination but individual sellers are responsible for the products they list unless otherwise stated.',
      ],
    },
    {
      title: '2. Eligibility & Accounts',
      paragraphs: ['To use My Home Bazar you must:'],
      bullets: [
        'Be at least 18 years old and capable of entering a binding contract.',
        'Provide accurate registration information and keep your account details up to date.',
        'Verify your email address within the time limit stated at signup. Unverified accounts may be deleted after 24 hours.',
        'Maintain the confidentiality of your password and notify us of unauthorized access.',
        'Sellers must register as a store account and comply with additional seller obligations.',
      ],
    },
    {
      title: '3. Orders & Pricing',
      paragraphs: [
        'Product prices, availability, and descriptions are set by sellers and may change without notice until an order is confirmed. All prices are displayed in Pakistani Rupees (PKR) unless stated otherwise.',
        'An order is placed when you complete checkout (cart or direct buy). Order confirmation depends on payment method: Cash on Delivery (COD) orders are submitted immediately; online payments require successful completion through our payment gateway.',
        'We reserve the right to cancel orders affected by pricing errors, stock unavailability, suspected fraud, or violation of these terms.',
      ],
    },
    {
      title: '4. Payments',
      paragraphs: [
        'My Home Bazar supports Cash on Delivery (COD), JazzCash, EasyPaisa, and card payments via licensed Pakistani payment gateways where available. Promotional subscriptions for sellers may require separate online payment.',
        'You agree to provide valid payment information and authorize charges for orders you place. Failed or reversed payments may result in order cancellation.',
      ],
      bullets: [
        'Cash on Delivery (COD) — pay when your order is delivered, subject to seller and area availability.',
        'Online wallets and cards — processed through secure third-party gateways; we do not store full payment credentials.',
      ],
    },
    {
      title: '5. Shipping & Delivery',
      paragraphs: [
        'Delivery fees are calculated based on order subtotal, destination city, and product weight. Free delivery may apply on orders above the threshold shown at checkout (currently Rs 5,000 unless updated in admin settings).',
        'Estimated delivery times are indicative and may vary due to courier (TCS, PostEx, Leopards), weather, or remote locations. Tracking numbers are provided when the seller books shipment.',
        'Risk of loss passes to you upon delivery to the address provided. Please inspect packages on delivery and report issues promptly.',
      ],
    },
    {
      title: '6. Returns, Cancellations & Claims',
      paragraphs: [
        'Buyers may cancel orders while status is pending or confirmed, subject to seller acceptance and platform rules.',
        'After delivery, you may complete the order, leave a review (including half-star ratings), or file a claim within the claim window shown in your order history (typically 14 days) for issues such as wrong product, damage, missing items, or defects.',
        'Claims are reviewed by My Home Bazar administrators. Outcomes may include refund, replacement, or rejection based on evidence provided. Abuse of the claims system may lead to account suspension.',
      ],
    },
    {
      title: '7. Seller Responsibilities',
      paragraphs: ['Sellers on My Home Bazar agree to:'],
      bullets: [
        'List only lawful, accurate, and non-infringing products with correct images, weight, and stock levels.',
        'Fulfill confirmed orders promptly and book courier shipments when applicable.',
        'Respond to buyer inquiries and cooperate with dispute resolution.',
        'Comply with applicable tax, consumer protection, and e-commerce regulations in Pakistan.',
        'Pay applicable platform fees, commissions, or promotion plan charges as published.',
      ],
    },
    {
      title: '8. Reviews & User Content',
      paragraphs: [
        'Reviews, ratings, and comments must be honest and relevant. We may remove content that is abusive, fraudulent, or violates others\' rights. By submitting content you grant My Home Bazar a non-exclusive license to display it on the platform.',
      ],
    },
    {
      title: '9. Promotions & Subscriptions',
      paragraphs: [
        'Sellers may purchase promotion plans to boost product visibility. Promotion fees, duration, and product limits are defined in the admin promotion plans. Promotions expire automatically at the end of the subscription period. Misuse of promotions may result in removal without refund.',
      ],
    },
    {
      title: '10. Prohibited Conduct',
      paragraphs: ['You may not:'],
      bullets: [
        'Use the platform for illegal goods, fraud, or harassment.',
        'Attempt to bypass payments, manipulate reviews, or scrape data without permission.',
        'Interfere with site security or other users\' accounts.',
        'Upload malware, offensive material, or misleading product information.',
      ],
    },
    {
      title: '11. Intellectual Property',
      paragraphs: [
        'My Home Bazar branding, logo, website design, and software are owned by us or our licensors. Seller product images and descriptions remain the responsibility of sellers who warrant they have rights to use them.',
      ],
    },
    {
      title: '12. Limitation of Liability',
      paragraphs: [
        'To the fullest extent permitted by law, My Home Bazar is not liable for indirect, incidental, or consequential damages arising from use of the marketplace. Our total liability for any claim related to a specific order is limited to the amount you paid for that order. We do not guarantee uninterrupted or error-free service.',
      ],
    },
    {
      title: '13. Governing Law',
      paragraphs: [
        'These Terms are governed by the laws of the Islamic Republic of Pakistan. Disputes shall first be attempted to resolve through customer support; failing that, courts in Lahore, Pakistan shall have jurisdiction unless mandatory consumer law provides otherwise.',
      ],
    },
    {
      title: '14. Changes to Terms',
      paragraphs: [
        'We may update these Terms & Conditions at any time. Material changes will be reflected by updating the "Last updated" date. Your continued use after changes constitutes acceptance.',
      ],
    },
    {
      title: '15. Contact',
      paragraphs: ['For questions about these Terms, contact us:'],
      bullets: [
        'Email: myhomebazar.shop@gmail.com',
        'Phone: +92 348 6663576',
        'Address: Lahore DHA Phase 5, Pakistan',
      ],
    },
  ];

  constructor(private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.setTermsSeo();
  }
}
