// PrivacyPolicy.jsx
import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 text-gray-900 font-sans"> 
            <h1 className="text-4xl font-bold mb-4 text-center">Privacy Policy</h1>
            <p className="text-center text-sm text-gray-600 mb-10">
                Effective Date: June 27, 2025
            </p>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">1. Overview</h2>
                <p>
                    Investing Education Academy (“IEA”, “we”, “our”, or “us”) is committed to protecting the privacy of our students, website visitors, and community members. This Privacy Policy explains how we collect, use, and safeguard your personal information when you engage with our online and offline educational services.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">2. Scope</h2>
                <p>
                    This policy applies to all personal data collected via our website (<a href="https://www.theinvestingleague.info" className="text-blue-600 underline">www.theinvestingleague.info</a>), our learning platform, and through in-person class registrations or interactions.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">3. Information We Collect</h2>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>Identity & Contact Data:</strong> Full name, email address, phone number, and billing address.</li>
                    <li><strong>Enrollment & Learning Data:</strong> Course enrollments, learning progress, assessments, and class attendance.</li>
                    <li><strong>Payment Information:</strong> Processed securely via trusted third-party processors (we do not store card data).</li>
                    <li><strong>Technical Data:</strong> IP address, device type, browser type, and site usage analytics.</li>
                    <li><strong>Offline Class Records:</strong> Feedback forms, sign-in logs, and performance reports from in-person sessions.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">4. How We Use Your Information</h2>
                <p>We use collected data to:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Provide and manage course access and certifications.</li>
                    <li>Deliver customer service and respond to inquiries.</li>
                    <li>Send updates, learning notifications, or newsletters (you may opt out).</li>
                    <li>Analyze usage for product improvements and business insights.</li>
                    <li>Ensure compliance with applicable laws and academic standards.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">5. Data Sharing and Disclosure</h2>
                <ul className="list-disc list-inside space-y-1">
                    <li>We do not sell, rent, or trade your personal information.</li>
                    <li>We may share information with trusted service providers (e.g., payment gateways, email delivery services) under strict confidentiality agreements.</li>
                    <li>Disclosure may occur if required by law, legal proceedings, or to protect rights and safety.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">6. Cookies and Analytics</h2>
                <p>
                    Our website uses cookies and analytics tools (such as Google Analytics) to improve performance, track engagement, and personalize user experience. You may control cookie usage via your browser settings.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">7. Data Security</h2>
                <p>
                    We implement industry-standard security measures (SSL, encrypted storage, access controls) to protect your data. However, no online system is entirely immune to risks, and we recommend users take personal precautions when sharing sensitive information.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">8. Data Retention</h2>
                <p>
                    We retain your personal data for as long as necessary to fulfill the purposes outlined in this policy, including legal, regulatory, or educational compliance requirements. Upon request, we will delete or anonymize data, subject to applicable law.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">9. Your Rights</h2>
                <p>
                    You may request access to your personal data, correct inaccuracies, or request deletion. For any privacy inquiries or to exercise your rights under applicable data protection laws (GDPR, Indian IT Rules, etc.), contact us at:
                    <a href="mailto:privacy@theinvestingleague.info" className="text-blue-600 underline ml-1">privacy@theinvestingleague.info</a>.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">10. Updates to This Policy</h2>
                <p>
                    We reserve the right to update this Privacy Policy as our services evolve. Revisions will be posted with a new “Effective Date.” Continued use of our platform indicates acceptance of changes.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-2">11. Contact Information</h2>
                <p>
                    Investing Education Academy <br />
                    Registered Office: [Insert Company Address] <br />
                    Email: <a href="mailto:support@theinvestingleague.info" className="text-blue-600 underline">support@theinvestingleague.info</a>
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
