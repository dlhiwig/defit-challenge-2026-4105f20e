import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy Policy | DEFIT Challenge";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container px-4 py-16 max-w-4xl mx-auto">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4 uppercase tracking-wide">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mb-8">
          <strong>Effective Date:</strong> January 26, 2026
          <br />
          <strong>Last Updated:</strong> January 26, 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
              1. Introduction & Scope
            </h2>
            <p className="text-muted-foreground mb-4">
              This Privacy Policy describes how <strong>Black Eagle Project, Inc.</strong>, a United States 501(c)(3) non-profit organization (EIN: 92-0713659), collects, uses, stores, and protects your personal information when you use the DEFIT (Double Eagle Fitness Challenge) web application ("Service," "Website," or "App").
            </p>
            <p className="text-muted-foreground mb-4">
              This Privacy Policy applies to all users of DEFIT, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Participants:</strong> Soldiers, veterans, government employees, military family members, and civilians who register and log workouts</li>
              <li><strong>Administrators:</strong> Authorized USARC staff and verifiers who review and validate workout logs</li>
              <li><strong>Visitors:</strong> Anyone browsing or accessing the public portions of the Website</li>
            </ul>
            <p className="text-muted-foreground mt-4 mb-4">
              <strong>Key Definitions:</strong>
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>"Personal Data"</strong> — Information that identifies you as an individual, such as your name, email address, rank, and unit affiliation</li>
              <li><strong>"Workout Data"</strong> — Fitness activity logs you submit, including distances, weights lifted, durations, timestamps, and verification status</li>
              <li><strong>"User Data"</strong> — All data associated with your account, including Personal Data, Workout Data, preferences, and usage history</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              By registering for an account, logging workouts, or otherwise using the Service, you consent to the data practices described in this Privacy Policy. If you do not agree with these practices, please do not use the Service. Your use of the Service is also governed by our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
              2. What Data We Collect & How
            </h2>
            <p className="text-muted-foreground mb-4">
              We collect data in several categories to provide and improve the DEFIT service:
            </p>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              A. Registration & Profile Data
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Full name</li>
              <li>Email address</li>
              <li>Unit affiliation (text entry)</li>
              <li>Unit category (Veterans, Government Employees, Military Family, Civilian, Other)</li>
              <li>Account credentials (password stored securely via hashing)</li>
            </ul>
            <p className="text-muted-foreground mt-2 italic">
              <strong>Why we collect it:</strong> To create and authenticate your account, identify you for leaderboard rankings, and enable unit-based aggregation and filtering.
            </p>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              B. Workout Data
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Cardio Logs:</strong> Activity type (Run/Walk/Ruck, Bike, Swim, Row/Elliptical), distance, date, notes</li>
              <li><strong>Strength/Resistance Logs:</strong> Exercise name, weight per rep, reps per set, sets, total weight lifted, date, notes</li>
              <li><strong>HIIT Logs:</strong> Duration (minutes), description, date</li>
              <li><strong>TMAR-M Logs:</strong> Duration (minutes), description, date</li>
              <li><strong>Verification Status:</strong> Pending, Verified, or Flagged (set by authorized administrators)</li>
              <li><strong>Timestamps:</strong> When logs were created and last modified</li>
            </ul>
            <p className="text-muted-foreground mt-2 italic">
              <strong>Why we collect it:</strong> To track your progress toward challenge goals, calculate leaderboard rankings, enable admin verification, and provide you with a personal workout history.
            </p>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              C. Usage Data
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Login sessions and timestamps</li>
              <li>Pages visited and features accessed</li>
              <li>Browser type, device type, and operating system</li>
              <li>IP address (for security and fraud prevention)</li>
              <li>Error logs and diagnostic information</li>
            </ul>
            <p className="text-muted-foreground mt-2 italic">
              <strong>Why we collect it:</strong> To maintain service security, troubleshoot technical issues, prevent unauthorized access, and monitor overall service health.
            </p>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              D. Optional Uploaded Media
            </h3>
            <p className="text-muted-foreground mb-2">
              If you choose to upload proof images or screenshots (e.g., treadmill console photos, fitness watch screenshots) to support your workout logs:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Image files and associated metadata</li>
              <li>Upload timestamps</li>
            </ul>
            <p className="text-muted-foreground mt-2 italic">
              <strong>Why we collect it:</strong> To provide optional verification support for your workout logs. Uploading proof images is voluntary unless specifically requested during a verification review.
            </p>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              E. Notification Preferences
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Email notification settings (enabled/disabled)</li>
              <li>In-app notification settings (enabled/disabled)</li>
              <li>Notification delivery mode (Immediate, Daily Digest, or None)</li>
              <li>Preferences for verified/flagged log notifications</li>
            </ul>
            <p className="text-muted-foreground mt-2 italic">
              <strong>Why we collect it:</strong> To honor your communication preferences and deliver notifications only in the manner you choose.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
              3. How Data Is Used & Who Has Access
            </h2>
            <p className="text-muted-foreground mb-4">
              Your data is used internally by Black Eagle Project, Inc. solely to operate the DEFIT challenge:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Challenge Operation:</strong> Recording and displaying your workout progress, calculating completion percentages, and generating leaderboard rankings</li>
              <li><strong>Verification:</strong> Enabling authorized USARC administrators to review, verify, or flag workout logs</li>
              <li><strong>Communications:</strong> Sending notifications about log status changes, challenge updates, and important announcements (per your preferences)</li>
              <li><strong>Account Security:</strong> Authenticating your identity, preventing unauthorized access, and detecting suspicious activity</li>
              <li><strong>Service Improvement:</strong> Analyzing aggregate usage patterns to improve the user experience (no individual identification)</li>
            </ul>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              Access Controls
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>You:</strong> Full access to your own profile, workout logs, history, and settings</li>
              <li><strong>Authorized Administrators:</strong> Access to workout logs for verification purposes only, with all actions logged in an audit trail</li>
              <li><strong>Black Eagle Project, Inc. Staff:</strong> Limited technical access for maintenance, support, and security purposes</li>
            </ul>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              What We Do NOT Do
            </h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>We do <strong>NOT</strong> sell, rent, or trade your personal or workout data to any third party</li>
              <li>We do <strong>NOT</strong> share your data with advertisers or marketers</li>
              <li>We do <strong>NOT</strong> disclose your information to external parties except as required by law or with your explicit consent</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
              4. Data Retention, Deletion, and User Rights
            </h2>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              Retention Period
            </h3>
            <p className="text-muted-foreground mb-4">
              Your User Data is retained for as long as your account remains active, plus a reasonable period thereafter for legal compliance and dispute resolution (typically 2 years after account closure or final interaction).
            </p>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              Your Rights
            </h3>
            <p className="text-muted-foreground mb-2">
              You have the following rights regarding your data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information via your profile settings</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Export:</strong> Request an export of your workout data in a portable format</li>
              <li><strong>Opt-Out:</strong> Disable notifications or specific optional features at any time</li>
            </ul>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              Data Deletion Process
            </h3>
            <p className="text-muted-foreground mb-4">
              To request account deletion or data removal:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-4">
              <li>Contact us at <strong>info@blackeagleproject.org</strong> with the subject line "Data Deletion Request"</li>
              <li>Include your registered email address and full name for verification</li>
              <li>We will process your request within 30 days</li>
            </ol>
            <p className="text-muted-foreground mt-4">
              Upon deletion, your personal profile information and workout logs will be permanently removed or anonymized. Certain anonymized, aggregate data may be retained for statistical purposes.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
              5. Security & Data Protection Measures
            </h2>
            <p className="text-muted-foreground mb-4">
              We implement reasonable technical and organizational measures to protect your data. The DEFIT platform operates on private networking infrastructure with <strong>SOC 2</strong> and <strong>HIPAA</strong> compliance standards to ensure the confidentiality, integrity, and availability of your information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Private Networking:</strong> All backend services operate within a private network architecture, limiting exposure to the public internet</li>
              <li><strong>SOC 2 Compliance:</strong> Our infrastructure provider maintains SOC 2 Type II certification, ensuring rigorous controls over security, availability, and confidentiality</li>
              <li><strong>HIPAA Compliance:</strong> Given the health-related nature of fitness data, our platform adheres to HIPAA-compliant data handling and storage practices</li>
              <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using HTTPS/TLS</li>
              <li><strong>Encryption at Rest:</strong> Sensitive data stored in our database is encrypted</li>
              <li><strong>Secure Authentication:</strong> Passwords are hashed using industry-standard algorithms; we never store plaintext passwords</li>
              <li><strong>Role-Based Access Control:</strong> Only authorized personnel can access specific data based on their role</li>
              <li><strong>Audit Logging:</strong> Administrative actions (verification, flagging) are logged with timestamps and user identification</li>
              <li><strong>Regular Security Reviews:</strong> We periodically review and update our security practices</li>
            </ul>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              No Absolute Guarantee
            </h3>
            <p className="text-muted-foreground mb-4">
              While we strive to protect your data using reasonable security measures, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security of your information.
            </p>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              Data Breach Notification
            </h3>
            <p className="text-muted-foreground">
              In the event of a data breach that may affect your personal information, we will notify affected users via email and/or in-app notification within a reasonable timeframe, as required by applicable law.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
              6. Sensitive Data & Health-Related Information
            </h2>
            <p className="text-muted-foreground mb-4">
              DEFIT collects fitness and workout data, which may be considered sensitive or health-related information. Please note:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Voluntary Participation:</strong> Your participation in DEFIT is entirely voluntary. You choose what workout data to log and share.</li>
              <li><strong>Self-Reported Data:</strong> All workout data is self-reported by you, the user. You are responsible for ensuring the accuracy of your submissions.</li>
              <li><strong>Leaderboard Privacy:</strong> Public leaderboards display names and workout statistics. No other personally sensitive information (email, unit details beyond category) is displayed without your consent.</li>
              <li><strong>No Medical Advice:</strong> DEFIT does not provide medical advice. Consult a healthcare professional before beginning any fitness program.</li>
            </ul>
            <p className="text-muted-foreground mt-4 font-semibold">
              We will NEVER sell, share, or disclose your fitness data to third-party advertisers, marketers, or commercial entities under any circumstance.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
              7. Use of Uploaded Media / Proof Images
            </h2>
            <p className="text-muted-foreground mb-4">
              If you upload images or screenshots as proof for your workout logs:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Storage:</strong> Images are stored securely on our servers with access controls</li>
              <li><strong>Access:</strong> Only you and authorized administrators (for verification purposes) can view your uploaded images</li>
              <li><strong>Purpose:</strong> Images are used solely for workout verification and audit purposes</li>
              <li><strong>No Public Sharing:</strong> Your uploaded images will never be shared publicly or with third parties without your explicit consent</li>
              <li><strong>Optional:</strong> Uploading proof images is optional unless specifically requested during a verification review</li>
              <li><strong>Deletion:</strong> You may request deletion of your uploaded media at any time by contacting us</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
              8. Cookies, Tracking, and Third-Party Services
            </h2>
            <p className="text-muted-foreground mb-4">
              The DEFIT website may use the following technologies:
            </p>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              Essential Cookies
            </h3>
            <p className="text-muted-foreground mb-4">
              We use essential cookies required for the Service to function, including session management and authentication. These cookies are necessary and cannot be disabled while using the Service.
            </p>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              Analytics (If Applicable)
            </h3>
            <p className="text-muted-foreground mb-4">
              We may use privacy-respecting analytics tools to understand how the Service is used. This may include aggregate page views, feature usage, and error rates. No personally identifiable information is shared with analytics providers.
            </p>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              Third-Party Services
            </h3>
            <p className="text-muted-foreground mb-4">
              The Service may integrate with third-party services for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Email Delivery:</strong> Transactional emails (notifications, password resets) via secure email service providers</li>
              <li><strong>Hosting & Infrastructure:</strong> Cloud hosting providers that maintain our servers and databases</li>
              <li><strong>Error Monitoring:</strong> Tools to detect and diagnose technical issues</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              These third-party services are bound by their own privacy policies and our data processing agreements. We only share the minimum data necessary for them to perform their functions.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
              9. Policy for Minors & Eligibility
            </h2>
            <p className="text-muted-foreground mb-4">
              The DEFIT Service is intended for individuals who are:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>18 years of age or older</strong>, OR</li>
              <li><strong>17 years of age</strong> with parental or guardian consent (applicable to military family members)</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We do not knowingly collect personal information from children under 13 years of age. If we discover that a child under 13 has provided us with personal information, we will promptly delete such data.
            </p>
            <p className="text-muted-foreground mt-4">
              If you believe a minor has registered without proper consent, please contact us immediately at <strong>info@blackeagleproject.org</strong>.
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
              10. Changes to This Privacy Policy
            </h2>
            <p className="text-muted-foreground mb-4">
              Black Eagle Project, Inc. reserves the right to update or modify this Privacy Policy at any time. When we make changes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>The "Last Updated" date at the top of this page will be revised</li>
              <li>Material changes will be announced via email or in-app notification</li>
              <li>Continued use of the Service after changes are posted constitutes your acceptance of the revised policy</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We encourage you to review this Privacy Policy periodically to stay informed about how we protect your data.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
              11. Contact & Data Privacy Inquiries
            </h2>
            <p className="text-muted-foreground mb-4">
              For questions, concerns, or requests related to this Privacy Policy or your personal data, please contact us:
            </p>
            <div className="bg-card border border-border rounded-lg p-6 mt-4">
              <p className="text-foreground font-semibold mb-2">Black Eagle Project, Inc.</p>
              <p className="text-muted-foreground">
                Attn: Privacy Inquiries<br />
                13720 SW 271st Ln<br />
                Homestead, FL 33032
              </p>
              <p className="text-muted-foreground mt-4">
                <strong>Email:</strong> info@blackeagleproject.org<br />
                <strong>Subject Line:</strong> "DEFIT Privacy Inquiry"
              </p>
            </div>
            <p className="text-muted-foreground mt-4">
              We will respond to all privacy-related inquiries within 30 days.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
              12. Nonprofit & Ownership Disclosure
            </h2>
            <p className="text-muted-foreground mb-4">
              The DEFIT Service is operated by <strong>Black Eagle Project, Inc.</strong>, a registered 501(c)(3) non-profit organization under the laws of the State of Florida.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>EIN:</strong> 92-0713659</li>
              <li><strong>Headquarters:</strong> Homestead, FL</li>
            </ul>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              Data Ownership
            </h3>
            <p className="text-muted-foreground mb-4">
              All data, logs, workout history, user profiles, and site infrastructure are owned and maintained by Black Eagle Project, Inc. This includes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Database records and backups</li>
              <li>Server infrastructure and configurations</li>
              <li>Application code and documentation</li>
              <li>All user-submitted content and uploads</li>
            </ul>

            <h3 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
              Our Commitment
            </h3>
            <p className="text-muted-foreground">
              As a non-profit organization, our mission is to support the fitness and readiness of Army Reserve service members and their communities. We are committed to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-2">
              <li><strong>Never selling</strong> your personal or workout data</li>
              <li><strong>Never sharing</strong> your information with advertisers or marketers</li>
              <li><strong>Only using</strong> your data to operate and improve the DEFIT challenge</li>
              <li><strong>Protecting</strong> your privacy with reasonable security measures</li>
              <li><strong>Honoring</strong> your data rights and preferences</li>
            </ul>
          </section>

          {/* Acknowledgment */}
          <section className="mt-12 pt-8 border-t border-border">
            <p className="text-muted-foreground text-center italic">
              By using the DEFIT Service, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and protection of your data as described herein.
            </p>
          </section>
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Privacy;
