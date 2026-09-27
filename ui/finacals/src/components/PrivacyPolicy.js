import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <h1>Privacy Policy</h1>
      <p>Last updated: September 27, 2026</p>
      
      <p>ExpenseManager ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.</p>
      
      <h2>1. Information We Collect</h2>
      <p><strong>Google OAuth Data:</strong> When you log in via Google OAuth, we access your public profile information (such as your name and email address) to authenticate your account and personalize your profile.</p>
      <p><strong>Financial Data:</strong> We store the expenses, products, and supplier details that you explicitly input into the application to provide tracking features.</p>
      
      <h2>2. How We Use Your Information</h2>
      <p>We use your information solely to maintain, secure, and operate the ExpenseManager platform, including running local AI analysis or external LLM classifications based on your backend settings.</p>
      
      <h2>3. Data Sharing & Security</h2>
      <p>We do not sell, trade, or share your personal data with third parties. All operational data is stored locally in your database instance as configured in your application environment.</p>
      
      <h2>4. Changes to This Policy</h2>
      <p>We will inform you upfront if any change in policy is made. Later, changes will be posted directly on this page.</p>
    </div>
  );
};

export default PrivacyPolicy;
