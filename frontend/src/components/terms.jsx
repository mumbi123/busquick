import React, { useEffect, useRef, useState } from "react";
import "../resources/terms.css";

export default function TermsAndConditions() {
  const scrollRef = useRef(null);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const reachedEnd =
        Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight - 10;
      if (reachedEnd && !hasScrolledToEnd) setHasScrolledToEnd(true);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => el.removeEventListener("scroll", handleScroll);
  }, [hasScrolledToEnd]);

  return (
    <main className="tc-page" role="main" aria-labelledby="tc-doc-title">
      <section className="tc-card" aria-labelledby="tc-doc-title">
        <div className="tc-card-header">
          <div className="tc-title-container">
            <h1 className="tc-title">Terms & Conditions</h1>
          </div>
          <p>Last updated: 15 September 2025</p>
        </div>

        <div
          className="tc-content"
          ref={scrollRef}
          tabIndex={0}
          aria-label="Scrollable terms content"
        >
          <h3>1. Acceptance of Terms</h3>
          <p>
            By downloading, registering, or using the BusQuick mobile application (“App”) or services, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, do not use the App.
          </p>

          <h3>2. Services Provided</h3>
          <ul>
            <li>BusQuick provides an online booking and ticketing platform for intercity bus transportation and related services.</li>
            <li>We facilitate reservations, digital payments, luggage declarations, and premium travel services (BusQuick Plus).</li>
            <li>BusQuick acts as a technology platform and payment facilitator; buses remain independently operated by our partner companies.</li>
          </ul>

          <h3>3. User Responsibilities</h3>
          <ul>
            <li>Provide accurate, up-to-date information during registration and booking.</li>
            <li>Ensure payment details are correct and authorized.</li>
            <li>Present valid identification (e.g., NRC, passport) when required.</li>
            <li>Comply with luggage policies, including weight and restricted items.</li>
          </ul>

          <h3>4. Ticketing, Pricing & Fees</h3>
          <ul>
            <li>All fares are set by bus operators; BusQuick applies a service fee (clearly shown at checkout).</li>
            <li>Service fees are non-refundable unless BusQuick is directly responsible for a system error.</li>
            <li>Tickets are valid only for the selected date, time, and route.</li>
            <li>BusQuick reserves the right to adjust fees and pricing structures.</li>
          </ul>

          <h3>5. Cancellations & Refunds</h3>
          <ul>
            <li>Refund eligibility depends on the bus operator’s policy.</li>
            <li>BusQuick will process eligible refunds within 7–14 business days.</li>
            <li>Premium users (BusQuick Plus) may receive additional flexibility, such as free reschedules.</li>
            <li>In case of bus cancellation or overbooking, BusQuick ensures 100% ticket refund or rebooking at no extra cost.</li>
          </ul>

          <h3>6. Premium Services (BusQuick Plus)</h3>
          <ul>
            <li>Premium users enjoy added benefits such as priority boarding, flexible cancellations/reschedules, loyalty rewards, and exclusive offers.</li>
            <li>Subscription fees for BusQuick Plus are non-refundable.</li>
            <li>BusQuick reserves the right to change or discontinue premium features with prior notice.</li>
          </ul>

          <h3>7. Payments & Wallet</h3>
          <ul>
            <li>Payments can be made through mobile money, debit/credit card, or BusQuick Wallet.</li>
            <li>BusQuick Wallet balances are non-transferable and non-interest bearing.</li>
            <li>Fraudulent transactions will lead to account suspension and possible legal action.</li>
          </ul>

          <h3>8. Data Privacy & Security</h3>
          <ul>
            <li>BusQuick collects and processes personal data in compliance with the Zambia Data Protection Act and applicable laws.</li>
            <li>Data may be shared with partner operators and payment providers for service delivery.</li>
            <li>We employ encryption, secure servers, and biometric login for data protection.</li>
          </ul>

          <h3>9. Liability Disclaimer</h3>
          <ul>
            <li>BusQuick is not the bus operator and is not liable for delays, accidents, cancellations, or loss of property caused by bus operators.</li>
            <li>BusQuick is liable only for system-related issues (e.g., payment failures due to app error).</li>
          </ul>

          <h3>10. Luggage Policy</h3>
          <ul>
            <li>Users must declare luggage accurately during booking.</li>
            <li>BusQuick may provide QR-coded luggage tags for tracking.</li>
            <li>Restricted items (flammables, illegal substances, hazardous goods) are strictly prohibited.</li>
          </ul>

          <h3>11. Travel Insurance (Optional)</h3>
          <p>
            Users may purchase insurance add-ons via the app. Coverage, claims, and limits are subject to the insurance provider’s terms.
          </p>

          <h3>12. Intellectual Property</h3>
          <p>
            All rights to the BusQuick App, branding, and content belong to BusQuick Zambia Limited. Unauthorized use, copying, or distribution is prohibited.
          </p>

          <h3>13. Account Suspension/Termination</h3>
          <ul>
            <li>BusQuick may suspend or terminate accounts for fraudulent activity, violation of terms, or misuse/abuse of the platform.</li>
          </ul>

          <h3>14. Dispute Resolution</h3>
          <p>
            Disputes will first be resolved amicably. If unresolved, they may be referred to arbitration in Lusaka, Zambia, under the Arbitration Act of Zambia.
          </p>

          <h3>15. Governing Law</h3>
          <p>
            These Terms are governed by the laws of the Republic of Zambia.
          </p>

          <h3>16. Updates to Terms</h3>
          <p>
            BusQuick reserves the right to update or amend these Terms at any time. Updates will be communicated via the App and will take effect upon posting.
          </p>

          <h3>17. Accessibility & Inclusivity</h3>
          <p>
            BusQuick is committed to making its services accessible to all users, including those with disabilities. We continuously improve app features, support multiple languages, and ensure fair access.
          </p>

          <h3>18. Force Majeure</h3>
          <p>
            BusQuick and its partner operators are not liable for failure or delay in service caused by circumstances beyond reasonable control, such as natural disasters, strikes, or government actions.
          </p>

          <h3>19. Third-Party Services Disclaimer</h3>
          <p>
            BusQuick integrates with third-party providers (e.g., payment gateways, insurance companies). BusQuick is not responsible for failures or errors caused by these providers.
          </p>

          <h3>20. Loyalty & Rewards Program</h3>
          <ul>
            <li>BusQuick may offer a loyalty program (“BusQuick Points”).</li>
            <li>Points have no monetary value, are non-transferable, and may expire.</li>
            <li>BusQuick reserves the right to modify or discontinue the program.</li>
          </ul>

          <h3>21. Prohibited Conduct</h3>
          <ul>
            <li>Users must not engage in fraudulent activity, abuse staff, or interfere with the App’s systems.</li>
            <li>Violations may result in account suspension, booking cancellation, or legal action.</li>
          </ul>

          <h3>22. Children & Underage Users</h3>
          <p>
            Users below 18 must use the platform under parental supervision. BusQuick may request proof of age.
          </p>

          <h3>23. Ratings & Reviews</h3>
          <p>
            Reviews must be truthful and respectful. BusQuick may remove false or offensive content.
          </p>

          <h3>24. Customer Support & Complaint Handling</h3>
          <p>
            Inquiries and complaints will be acknowledged within 48 hours and resolved promptly.
          </p>

          <h3>25. Security & Data Protection Disclaimer</h3>
          <p>
            BusQuick uses industry-standard security measures, but no system is entirely immune to cyber threats. Users accept this risk.
          </p>

          <h3>26. Account Termination by User</h3>
          <p>
            Users may terminate their account via the App or support channels, resulting in loss of tickets, points, and wallet balances.
          </p>

          <h3>27. Sustainability Commitment</h3>
          <p>
            Booking through BusQuick supports sustainable mobility. Eco-impact data may be displayed to encourage greener choices.
          </p>
        </div>

        <div className="tc-consent" aria-live="polite">
          <p className="tc-statement">
            Please follow and respect these Terms & Conditions to ensure a smooth and compliant experience with BusQuick.
          </p>
          <p id="tc-consent-hint" className="tc-hint">
            {hasScrolledToEnd
              ? "Thank you for reviewing the document."
              : "Please scroll to the bottom to review all terms."}
          </p>
        </div>
      </section>
    </main>
  );
}