import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Mail, Lock, Eye, FileText, Globe, Bell } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 md:p-12 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
          <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Privacy Policy</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Last Updated: March 8, 2026</p>
        </div>
      </div>

      <div className="space-y-8 text-zinc-700 dark:text-zinc-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-500" />
            1. Introduction
          </h2>
          <p>
            Welcome to <strong>VidiGenius AI</strong>. We are committed to protecting your personal information and your right to privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website 
            <a href="https://ais-pre-hjoybopmpv7nuo3mljvliv-416429539549.asia-east1.run.app" className="text-emerald-500 hover:underline mx-1">
              VidiGenius AI
            </a> 
            and use our AI-powered tools, including Text-to-Video, Text-to-Animation, Text-to-Speech, and Voice conversion services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-500" />
            2. Information We Collect
          </h2>
          <div className="space-y-4">
            <p>We collect information that you provide directly to us, as well as information collected automatically when you use our services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> When you register, we collect your name, email address, and mobile number.</li>
              <li><strong>User Content:</strong> We collect the text inputs, scripts, images, and audio files you upload or provide for AI processing.</li>
              <li><strong>Usage Data:</strong> We automatically collect information about how you interact with our tools, including IP addresses, browser types, device information, and pages viewed.</li>
              <li><strong>Analytics:</strong> We use internal and third-party analytics tools to understand platform performance and user behavior.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            3. Data Storage and Security
          </h2>
          <p>
            Your data is stored and processed using <strong>Google Cloud Platform (GCP)</strong> infrastructure, ensuring high availability and robust security. 
            We implement industry-standard technical and organizational measures to protect your personal data against unauthorized access, 
            alteration, disclosure, or destruction. However, please note that no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-500" />
            4. Third-Party Services and Advertisements
          </h2>
          <p className="mb-4">
            VidiGenius AI is a free platform monetized through advertisements. We partner with third-party service providers, such as <strong>Google AdSense</strong>, 
            to display ads.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Third-party vendors use cookies to serve ads based on your prior visits to our website or other websites.</li>
            <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our Site and/or other sites on the Internet.</li>
            <li>You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-emerald-500 hover:underline">Ads Settings</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            5. Your Rights (GDPR & Global Compliance)
          </h2>
          <p className="mb-4">Depending on your location, you may have the following rights regarding your personal data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> The right to request copies of your personal data.</li>
            <li><strong>Rectification:</strong> The right to request that we correct any information you believe is inaccurate.</li>
            <li><strong>Erasure:</strong> The right to request that we erase your personal data, under certain conditions.</li>
            <li><strong>Data Portability:</strong> The right to request that we transfer the data that we have collected to another organization.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            6. Cookie Policy
          </h2>
          <p>
            We use cookies and similar tracking technologies to track the activity on our service and hold certain information. 
            Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your 
            browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
        </section>

        <section className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-500" />
            7. Contact Us
          </h2>
          <p className="mb-4">
            If you have any questions or concerns about this Privacy Policy or our data practices, please do not hesitate to contact us:
          </p>
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-2">
              <span className="font-semibold">Email:</span>
              <a href="mailto:rahulsurya8866@gmail.com" className="text-emerald-500 hover:underline">rahulsurya8866@gmail.com</a>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold">Website:</span>
              <a href="https://ais-pre-hjoybopmpv7nuo3mljvliv-416429539549.asia-east1.run.app" className="text-emerald-500 hover:underline">VidiGenius AI</a>
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
};
