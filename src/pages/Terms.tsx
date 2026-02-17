import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

const Terms = () => {
  useEffect(() => {
    document.title = "Terms of Service | DEFIT Challenge";
  }, []);

  return (
    <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container px-4 py-16 max-w-4xl mx-auto">
          <article className="prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground max-w-none">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground uppercase tracking-wide mb-2">
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-sm mb-8">
              <strong>Effective Date:</strong> January 26, 2026<br />
              <strong>Last Updated:</strong> January 26, 2026
            </p>

            <section className="mb-10">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
                1. Definitions & Scope
              </h2>
              <p>
                Welcome to DEFIT (the "Double Eagle Fitness Challenge"). These Terms of Service ("Terms" or "ToS") govern your access to and use of the DEFIT website and web application (the "Service" or "Website"), operated by <strong>Black Eagle Project, Inc.</strong>, a U.S. registered 501(c)(3) nonprofit organization ("we," "us," "our," or the "Organization").
              </p>
              <p>For purposes of these Terms:</p>
              <ul>
                <li><strong>"Service"</strong> refers to the DEFIT website, web application, and all related features, tools, and functionality.</li>
                <li><strong>"Website"</strong> refers to the web pages and digital platform accessible at [INSERT WEBSITE URL].</li>
                <li><strong>"User"</strong> refers to any individual who accesses, browses, registers for, or uses the Service.</li>
                <li><strong>"Participant"</strong> refers to a User who has registered for and is actively participating in the DEFIT Challenge.</li>
                <li><strong>"Administrator"</strong> refers to authorized USARC staff or Organization personnel with elevated privileges to review, verify, or manage User data and challenge operations.</li>
                <li><strong>"Content"</strong> refers to all text, images, data, graphics, logos, and other materials displayed on or through the Service.</li>
                <li><strong>"Workout Log"</strong> refers to User-submitted records of physical activity including distances, weights, durations, and related notes.</li>
                <li><strong>"Verification Status"</strong> refers to the administrative designation of a Workout Log as "Pending," "Verified," or "Flagged."</li>
              </ul>
              <p>
                By registering for an account, submitting Workout Logs, or otherwise using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these Terms, you must not use the Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
                2. User Registration & Self-Disclosure
              </h2>
              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">2.1 Account Registration</h3>
              <p>
                To participate in the DEFIT Challenge, you must create an account by providing accurate and complete information, including but not limited to your name, email address, military unit (if applicable), and unit category. You agree to:
              </p>
              <ul>
                <li>Provide truthful, accurate, and current information during registration.</li>
                <li>Maintain and promptly update your account information to keep it accurate and current.</li>
                <li>Maintain the security and confidentiality of your login credentials.</li>
                <li>Accept responsibility for all activities that occur under your account.</li>
              </ul>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">2.2 Self-Reported Data</h3>
              <p>
                You acknowledge and agree that all Workout Logs and fitness data you submit through the Service are <strong>self-reported</strong>. You are solely responsible for the accuracy and truthfulness of the information you provide. Self-reported data remains unverified unless and until reviewed and approved by authorized USARC/Administrator staff.
              </p>
              <p>
                Submitting false, misleading, or fraudulent workout data is a violation of these Terms and may result in account suspension, disqualification from the challenge, and/or permanent removal from the Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
                3. Data Ownership, Use, and Privacy
              </h2>
              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">3.1 Data Ownership</h3>
              <p>
                All Workout Logs, user profiles, account information, and related data submitted to or generated through the Service are stored, managed, and retained by Black Eagle Project, Inc. The Organization maintains ownership of all aggregated, anonymized, and operational data derived from Service usage.
              </p>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">3.2 Privacy and Data Protection</h3>
              <p>
                We are committed to protecting your privacy. For complete details on how we collect, use, store, and protect your personal information, please review our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. We will not sell, share, rent, or disclose your personally identifying information or individual workout data to third parties without your explicit consent, except:
              </p>
              <ul>
                <li>As required by law, regulation, legal process, or governmental request.</li>
                <li>To protect the rights, property, or safety of the Organization, our Users, or the public.</li>
                <li>In connection with a merger, acquisition, or sale of assets (with appropriate confidentiality protections).</li>
              </ul>
              <p>
                Aggregated, anonymized data that cannot reasonably be used to identify you may be used for research, reporting, program improvement, or promotional purposes.
              </p>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">3.3 Data Retention and Deletion</h3>
              <p>
                We retain your data for as long as your account is active or as needed to provide you with the Service. You may request deletion of your account and associated personal data by contacting us at info@defit.work. Upon receiving a valid deletion request, we will:
              </p>
              <ul>
                <li>Remove or anonymize your personal information from our active systems within a reasonable timeframe.</li>
                <li>Retain anonymized or aggregated data as permitted for operational and analytical purposes.</li>
                <li>Comply with any legal obligations that require us to retain certain records.</li>
              </ul>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">3.4 Security</h3>
              <p>
                We implement reasonable administrative, technical, and physical security measures to protect your data from unauthorized access, disclosure, alteration, or destruction. The DEFIT platform operates on <strong>private networking infrastructure</strong> with <strong>SOC 2</strong> and <strong>HIPAA</strong> compliance standards to safeguard the confidentiality, integrity, and availability of your data. However, no method of transmission over the Internet or electronic storage is completely secure. <strong>We cannot guarantee absolute security of your data</strong>, and you acknowledge and accept this inherent risk.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
                4. Use of the Service & User Conduct
              </h2>
              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">4.1 Permitted Use</h3>
              <p>You may use the Service to:</p>
              <ul>
                <li>Create and manage your user account.</li>
                <li>Log and track your workout activities (cardio, strength, HIIT, TMAR-M).</li>
                <li>View your personal workout history and progress.</li>
                <li>Participate in the DEFIT Challenge and view leaderboards.</li>
                <li>Receive notifications regarding your workout verification status.</li>
                <li>Access resources and information related to the challenge.</li>
              </ul>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">4.2 Prohibited Conduct</h3>
              <p>You agree NOT to:</p>
              <ul>
                <li>Submit false, fabricated, or misleading workout data.</li>
                <li>Forge, manipulate, or tamper with Workout Logs or Verification Status.</li>
                <li>Attempt to gain unauthorized access to the Service, other user accounts, or our systems.</li>
                <li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations.</li>
                <li>Harass, threaten, defame, or abuse other Users or Administrators.</li>
                <li>Upload or transmit viruses, malware, or other harmful code.</li>
                <li>Spam, solicit, or send unsolicited communications through the Service.</li>
                <li>Interfere with or disrupt the integrity or performance of the Service.</li>
                <li>Circumvent, disable, or otherwise interfere with security features of the Service.</li>
                <li>Use automated scripts, bots, or other means to access or interact with the Service without authorization.</li>
              </ul>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">4.3 Enforcement</h3>
              <p>
                We reserve the right, at our sole discretion, to investigate, suspend, or terminate any User account that we believe has violated these Terms, compromised data integrity, or engaged in conduct detrimental to the fairness or operation of the challenge. Such actions may be taken without prior notice.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
                5. Verification & Challenge Results Disclaimer
              </h2>
              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">5.1 Verification Process</h3>
              <p>
                Workout Logs submitted through the Service are subject to review by USARC-authorized Administrators. The Verification Status displayed on the Website (Pending, Verified, or Flagged) is for <strong>preliminary tracking purposes only</strong> and does not constitute final validation of your workout data.
              </p>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">5.2 Provisional Standings</h3>
              <p>
                All leaderboards, rankings, and challenge standings displayed on the Service are <strong>provisional</strong> until officially validated by USARC leadership. Final challenge standings, awards, medals, certificates, and recognition are determined at the <strong>sole discretion of USARC command staff</strong> and may differ from the provisional data shown on the Website.
              </p>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">5.3 No Guarantee of Results</h3>
              <p>
                <strong>DEFIT does not guarantee that participation in the challenge will result in any specific fitness outcomes, prevent injuries, or ensure physical readiness.</strong> Fitness training carries inherent risks, including but not limited to physical injury, illness, or death. You participate in the DEFIT Challenge and any related physical activities entirely at your own risk.
              </p>
              <p>
                You are solely responsible for:
              </p>
              <ul>
                <li>Assessing your own physical condition and fitness level.</li>
                <li>Obtaining appropriate medical clearance before beginning any exercise program.</li>
                <li>Using proper form, technique, and equipment during training.</li>
                <li>Listening to your body and avoiding overexertion or injury.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
                6. Intellectual Property and Content Ownership
              </h2>
              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">6.1 Organization Property</h3>
              <p>
                All content, features, and functionality of the Service — including but not limited to the website design, user interface, logos (including the Double Eagle emblem and kettlebell badge), graphics, text, software, code, and documentation — are the exclusive property of Black Eagle Project, Inc. or its licensors and are protected by U.S. and international copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">6.2 Limited License</h3>
              <p>
                Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal, non-commercial participation in the DEFIT Challenge. This license does not include the right to:
              </p>
              <ul>
                <li>Copy, reproduce, distribute, or publicly display any Content from the Service.</li>
                <li>Modify, create derivative works from, or reverse engineer any part of the Service.</li>
                <li>Use the Service or any Content for commercial purposes without express written permission.</li>
                <li>Remove, alter, or obscure any copyright, trademark, or other proprietary notices.</li>
              </ul>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">6.3 User Content</h3>
              <p>
                By submitting Workout Logs and other content to the Service, you grant Black Eagle Project, Inc. a non-exclusive, royalty-free, perpetual, irrevocable, and fully sublicensable right to use, reproduce, modify, adapt, publish, and display such content for purposes of operating, improving, and promoting the Service and the DEFIT Challenge.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
                7. Liability Waiver & Disclaimers
              </h2>
              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">7.1 "As-Is" Service</h3>
              <p>
                THE SERVICE IS PROVIDED ON AN <strong>"AS-IS" AND "AS-AVAILABLE"</strong> BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, BLACK EAGLE PROJECT, INC. DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p>
                We do not warrant that:
              </p>
              <ul>
                <li>The Service will be uninterrupted, timely, secure, or error-free.</li>
                <li>The results obtained from using the Service will be accurate or reliable.</li>
                <li>Any errors or defects in the Service will be corrected.</li>
              </ul>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">7.2 Limitation of Liability</h3>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BLACK EAGLE PROJECT, INC., ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, VOLUNTEERS, AFFILIATES, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH:
              </p>
              <ul>
                <li>Your access to or use of (or inability to access or use) the Service.</li>
                <li>Any conduct or content of any third party on the Service.</li>
                <li>Any content obtained from the Service.</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
                <li>Any physical injury, illness, death, or property damage resulting from your participation in the DEFIT Challenge or any related physical activities.</li>
              </ul>
              <p>
                IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE SERVICE EXCEED ONE HUNDRED DOLLARS ($100.00).
              </p>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">7.3 Assumption of Risk</h3>
              <p>
                You expressly acknowledge and agree that your participation in the DEFIT Challenge and any physical training activities is <strong>voluntary and at your own risk</strong>. You assume full responsibility for any injuries, damages, or losses that may result from your participation.
              </p>
              <p>
                <strong>BY USING THE SERVICE AND PARTICIPATING IN THE CHALLENGE, YOU HEREBY RELEASE, WAIVE, DISCHARGE, AND COVENANT NOT TO SUE BLACK EAGLE PROJECT, INC., ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, VOLUNTEERS, AND AFFILIATES FROM ANY AND ALL LIABILITY, CLAIMS, DEMANDS, OR CAUSES OF ACTION ARISING OUT OF OR RELATED TO YOUR PARTICIPATION IN THE DEFIT CHALLENGE.</strong>
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
                8. Termination, Suspension & Account Deletion
              </h2>
              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">8.1 Voluntary Termination</h3>
              <p>
                You may terminate your account at any time by contacting us at info@defit.work or using the account deletion feature (if available) within the Service. Upon voluntary termination, your account will be deactivated and your personal data will be handled in accordance with Section 3.3 (Data Retention and Deletion).
              </p>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">8.2 Termination by Organization</h3>
              <p>
                We reserve the right to suspend or terminate your account, with or without notice, for any reason, including but not limited to:
              </p>
              <ul>
                <li>Violation of these Terms of Service.</li>
                <li>Submission of fraudulent or falsified workout data.</li>
                <li>Conduct that compromises the integrity or fairness of the challenge.</li>
                <li>Harassment or abuse of other Users or Administrators.</li>
                <li>Extended inactivity or abandonment of the account.</li>
              </ul>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">8.3 Effects of Termination</h3>
              <p>
                Upon termination of your account:
              </p>
              <ul>
                <li>Your right to access and use the Service will immediately cease.</li>
                <li>Your Workout Logs may be retained in anonymized form for aggregate reporting purposes.</li>
                <li>You will not be eligible for any challenge awards, recognition, or standings.</li>
                <li>Provisions of these Terms that by their nature should survive termination (including Sections 6, 7, 10, and 11) shall survive.</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
                9. Amendments & Modifications
              </h2>
              <p>
                We reserve the right to modify, amend, or update these Terms of Service at any time, at our sole discretion. When we make material changes, we will:
              </p>
              <ul>
                <li>Update the "Last Updated" date at the top of this document.</li>
                <li>Provide notice through the Service (such as a banner or notification) or via email to registered Users.</li>
              </ul>
              <p>
                Your continued use of the Service after the effective date of any modifications constitutes your acceptance of the revised Terms. If you do not agree to the updated Terms, you must stop using the Service and may request deletion of your account.
              </p>
              <p>
                We encourage you to review these Terms periodically to stay informed of any changes.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
                10. Governing Law & Dispute Resolution
              </h2>
              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">10.1 Governing Law</h3>
              <p>
                These Terms of Service and any disputes arising out of or relating to these Terms or the Service shall be governed by and construed in accordance with the laws of the State of Florida, United States, without regard to its conflict of law principles.
              </p>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">10.2 Dispute Resolution</h3>
              <p>
                Any dispute, controversy, or claim arising out of or relating to these Terms or the Service shall first be resolved through good-faith negotiation between the parties. If the dispute cannot be resolved through negotiation within thirty (30) days, either party may pursue resolution through the appropriate courts located in Florida, and you consent to the personal jurisdiction of such courts.
              </p>

              <h3 className="text-lg font-heading font-medium text-foreground mt-4 mb-2">10.3 Contact for Notices</h3>
              <p>
                All legal notices, requests, or communications regarding these Terms should be directed to:
              </p>
              <address className="not-italic text-muted-foreground bg-card border border-border rounded-md p-4 mt-2">
                <strong className="text-foreground">Black Eagle Project, Inc.</strong><br />
                13720 SW 271st Ln, Homestead, FL 33032<br />
                Email: info@defit.work<br />
                EIN: 92-0713659
              </address>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
                11. Acceptance and Agreement
              </h2>
              <p>
                BY CREATING AN ACCOUNT, SUBMITTING WORKOUT LOGS, OR OTHERWISE USING THE DEFIT SERVICE, YOU ACKNOWLEDGE THAT:
              </p>
              <ul>
                <li>You have read and understand these Terms of Service in their entirety.</li>
                <li>You voluntarily agree to be bound by these Terms.</li>
                <li>You are at least 18 years of age or have obtained parental/guardian consent to use the Service.</li>
                <li>You have the legal capacity to enter into this agreement.</li>
                <li>You accept full responsibility for your participation in the DEFIT Challenge and any associated physical activities.</li>
              </ul>
              <p>
                If you do not agree to these Terms, you must not register for or use the Service.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4">
                12. Nonprofit Disclosure
              </h2>
              <p>
                The DEFIT Challenge and associated Service are operated by <strong>Black Eagle Project, Inc.</strong>, a registered 501(c)(3) nonprofit organization under the Internal Revenue Code of the United States.
              </p>
              <ul>
                <li><strong>Organization Name:</strong> Black Eagle Project, Inc.</li>
                <li><strong>Tax Status:</strong> 501(c)(3) Nonprofit</li>
                <li><strong>EIN:</strong> 92-0713659</li>
              </ul>
              <p>
                All data, Workout Logs, user profiles, workout history, and site infrastructure are the property of Black Eagle Project, Inc. As stated in Section 3.2, your personal data will not be sold, shared, or disclosed to third parties without your consent, except as required by law.
              </p>
              <p>
                The Organization's mission is to support the health, fitness, and readiness of Army Reserve service members and affiliated participants through holistic wellness programs like the DEFIT Challenge.
              </p>
            </section>

            <section className="mb-10 bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-heading font-semibold text-foreground uppercase tracking-wide mb-4">
                Questions or Concerns?
              </h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service or the DEFIT Challenge, please contact us at:
              </p>
              <p className="text-foreground font-medium mt-2">
                info@defit.work
              </p>
            </section>

            <div className="text-center text-muted-foreground text-sm mt-12 pt-8 border-t border-border">
              <p>
                © 2026 Black Eagle Project, Inc. All rights reserved.
              </p>
              <p className="mt-2">
                DEFIT™ and the Double Eagle emblem are trademarks of Black Eagle Project, Inc.
              </p>
              <p className="mt-4 text-xs">
                Synced from Privacy Policy on {new Date().toISOString().split('T')[0]}.
              </p>
            </div>
          </article>
        </main>
        
        <Footer />
        <BackToTop />
      </div>
  );
};

export default Terms;
