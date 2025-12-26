import nodemailer from "nodemailer";

const emailTransporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_PASSWORD,
  },
});

const recipientEmail = "yousif.hamid@gmail.com";

const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Arabaty App Summary</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1E3A5F, #2563eb); color: white; padding: 30px; text-align: center; border-radius: 10px; }
    .section { margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .arabic { direction: rtl; text-align: right; }
    .english { direction: ltr; text-align: left; }
    h2 { color: #1E3A5F; border-bottom: 2px solid #E8A54B; padding-bottom: 10px; }
    .feature { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #E8A54B; }
    .arabic .feature { border-left: none; border-right: 4px solid #E8A54B; }
    .highlight { color: #E8A54B; font-weight: bold; }
    .divider { height: 3px; background: linear-gradient(90deg, #1E3A5F, #E8A54B, #1E3A5F); margin: 40px 0; border-radius: 2px; }
    .stats { display: flex; justify-content: space-around; text-align: center; flex-wrap: wrap; }
    .stat { padding: 15px; }
    .stat-number { font-size: 28px; color: #1E3A5F; font-weight: bold; }
    .ad-box { background: linear-gradient(135deg, #1E3A5F, #0f2744); color: white; padding: 25px; border-radius: 10px; margin: 20px 0; }
    .tagline { font-size: 20px; color: #E8A54B; font-weight: bold; }
  </style>
</head>
<body>

<div class="header">
  <h1>عربتي - ARABATY</h1>
  <p>سوق السيارات الأول في السودان | Sudan's Premier Car Marketplace</p>
</div>

<!-- ARABIC SECTION -->
<div class="section arabic">
  <h2>ملخص التطبيق - للعروض التقديمية والإعلانات</h2>
  
  <div class="ad-box" style="text-align: center;">
    <p class="tagline">عربتي - سوقك الموثوق للسيارات</p>
    <p>اشترِ، بِع، وتواصل مع خبراء السيارات في مكان واحد</p>
  </div>

  <h3>🚗 ما هو عربتي؟</h3>
  <p>عربتي هو تطبيق سوق السيارات الشامل المصمم خصيصاً للسوق السوداني. يربط التطبيق بين مشتري وبائعي السيارات ومقدمي خدمات السيارات (الميكانيكيين، الكهربائيين، والمحامين) في منصة واحدة متكاملة.</p>

  <h3>✨ المميزات الرئيسية</h3>
  <div class="feature">
    <strong>تسجيل سهل:</strong> تسجيل دخول برقم الهاتف مع رابط سحري عبر البريد الإلكتروني - بدون كلمات مرور معقدة
  </div>
  <div class="feature">
    <strong>عرض وبحث السيارات:</strong> تصفح الإعلانات مع فلاتر متقدمة حسب الماركة، السعر، المدينة، والحالة
  </div>
  <div class="feature">
    <strong>نشر إعلانات مجانية:</strong> أول 1000 إعلان مجاني! بعدها 10,000 جنيه سوداني فقط عبر Bankak أو كود خصم
  </div>
  <div class="feature">
    <strong>دليل مقدمي الخدمات:</strong> ابحث عن ميكانيكيين، كهربائيين، ومحامين سيارات موثوقين
  </div>
  <div class="feature">
    <strong>نظام العروض:</strong> أرسل عروض أسعار للبائعين وتفاوض مباشرة
  </div>
  <div class="feature">
    <strong>تحديد الموقع:</strong> كشف تلقائي للموقع أو اختيار يدوي للمدينة
  </div>
  <div class="feature">
    <strong>دعم ثنائي اللغة:</strong> عربي وإنجليزي مع دعم كامل للاتجاه من اليمين لليسار
  </div>

  <h3>🏙️ المدن المدعومة</h3>
  <p>الخرطوم | أم درمان | بحري | بورتسودان | كسلا</p>

  <h3>👥 فئات المستخدمين</h3>
  <ul>
    <li><strong>المشترون:</strong> تصفح السيارات، إرسال العروض، حفظ المفضلة</li>
    <li><strong>البائعون:</strong> نشر الإعلانات، استلام العروض، إدارة القوائم</li>
    <li><strong>مقدمو الخدمات:</strong> الميكانيكيون، الكهربائيون، المحامون</li>
  </ul>

  <h3>💰 نموذج التسعير</h3>
  <div class="feature">
    <span class="highlight">مجاني:</span> أول 1000 إعلان سيارة<br>
    <span class="highlight">مدفوع:</span> 10,000 جنيه سوداني للإعلان (بعد الـ1000)<br>
    <span class="highlight">أكواد الخصم:</span> استخدم ARA1000 للحصول على إعلان مجاني
  </div>

  <h3>📱 نصوص إعلانية جاهزة</h3>
  <div class="ad-box">
    <p><strong>إعلان قصير:</strong></p>
    <p>"عربتي - سوق السيارات الأول في السودان! اشترِ وبِع سيارتك بسهولة. أول 1000 إعلان مجاناً!"</p>
  </div>
  <div class="ad-box">
    <p><strong>إعلان متوسط:</strong></p>
    <p>"هل تبحث عن سيارة جديدة أو تريد بيع سيارتك؟ عربتي يربطك بآلاف المشترين والبائعين في السودان. تصفح، قارن، وتفاوض - كل ذلك في تطبيق واحد. حمّل الآن!"</p>
  </div>
  <div class="ad-box">
    <p><strong>إعلان تفصيلي:</strong></p>
    <p>"عربتي - سوقك الموثوق للسيارات في السودان. ✓ آلاف السيارات للبيع ✓ فلاتر بحث متقدمة ✓ تواصل مباشر مع البائعين ✓ دليل ميكانيكيين وكهربائيين ✓ أول 1000 إعلان مجاناً! انضم لمجتمع عربتي اليوم."</p>
  </div>
</div>

<div class="divider"></div>

<!-- ENGLISH SECTION -->
<div class="section english">
  <h2>App Summary - For Presentations and Advertisements</h2>
  
  <div class="ad-box" style="text-align: center;">
    <p class="tagline">Arabaty - Your Trusted Car Marketplace</p>
    <p>Buy, Sell, and Connect with Car Experts in One Place</p>
  </div>

  <h3>🚗 What is Arabaty?</h3>
  <p>Arabaty is a comprehensive car marketplace app designed specifically for the Sudanese market. The app connects car buyers, sellers, and automotive service providers (mechanics, electricians, and lawyers) in one unified platform.</p>

  <h3>✨ Key Features</h3>
  <div class="feature">
    <strong>Easy Registration:</strong> Phone login with email magic link - no complex passwords needed
  </div>
  <div class="feature">
    <strong>Car Browsing & Search:</strong> Browse listings with advanced filters by make, price, city, and condition
  </div>
  <div class="feature">
    <strong>Free Listings:</strong> First 1,000 listings are FREE! After that, only 10,000 SDG via Bankak or coupon code
  </div>
  <div class="feature">
    <strong>Service Provider Directory:</strong> Find trusted mechanics, electricians, and car lawyers
  </div>
  <div class="feature">
    <strong>Offer System:</strong> Send price offers to sellers and negotiate directly
  </div>
  <div class="feature">
    <strong>Location Detection:</strong> Auto-detect location or manually select your city
  </div>
  <div class="feature">
    <strong>Bilingual Support:</strong> Arabic and English with full RTL layout support
  </div>

  <h3>🏙️ Supported Cities</h3>
  <p>Khartoum | Omdurman | Bahri | Port Sudan | Kassala</p>

  <h3>👥 User Categories</h3>
  <ul>
    <li><strong>Buyers:</strong> Browse cars, send offers, save favorites</li>
    <li><strong>Sellers:</strong> Post listings, receive offers, manage listings</li>
    <li><strong>Service Providers:</strong> Mechanics, Electricians, Lawyers</li>
  </ul>

  <h3>💰 Pricing Model</h3>
  <div class="feature">
    <span class="highlight">Free:</span> First 1,000 car listings<br>
    <span class="highlight">Paid:</span> 10,000 SDG per listing (after 1,000)<br>
    <span class="highlight">Coupon Codes:</span> Use ARA1000 for a free listing
  </div>

  <h3>📱 Ready-to-Use Ad Copy</h3>
  <div class="ad-box">
    <p><strong>Short Ad:</strong></p>
    <p>"Arabaty - Sudan's #1 Car Marketplace! Buy and sell your car easily. First 1,000 listings FREE!"</p>
  </div>
  <div class="ad-box">
    <p><strong>Medium Ad:</strong></p>
    <p>"Looking for a new car or want to sell yours? Arabaty connects you with thousands of buyers and sellers in Sudan. Browse, compare, and negotiate - all in one app. Download now!"</p>
  </div>
  <div class="ad-box">
    <p><strong>Detailed Ad:</strong></p>
    <p>"Arabaty - Your trusted car marketplace in Sudan. ✓ Thousands of cars for sale ✓ Advanced search filters ✓ Direct contact with sellers ✓ Mechanics & electricians directory ✓ First 1,000 listings FREE! Join the Arabaty community today."</p>
  </div>

  <h3>📊 App Statistics & Technical Info</h3>
  <div class="stats">
    <div class="stat">
      <div class="stat-number">5</div>
      <div>Main Screens</div>
    </div>
    <div class="stat">
      <div class="stat-number">1000</div>
      <div>Free Listings</div>
    </div>
    <div class="stat">
      <div class="stat-number">5</div>
      <div>Sudanese Cities</div>
    </div>
    <div class="stat">
      <div class="stat-number">2</div>
      <div>Languages</div>
    </div>
  </div>

  <h3>🔗 Technical Stack</h3>
  <p>Built with React Native & Expo for iOS and Android compatibility, Express.js backend with PostgreSQL database. Features iOS 26 Liquid Glass-inspired design.</p>

  <h3>📧 Contact & Payment</h3>
  <ul>
    <li><strong>Payment Method:</strong> Bankak QR Code or Coupon Codes</li>
    <li><strong>Currency:</strong> Sudanese Pounds (SDG / جنيه)</li>
  </ul>
</div>

<div class="divider"></div>

<div style="text-align: center; padding: 30px; background: #f8f9fa; border-radius: 10px;">
  <h2 style="color: #1E3A5F;">عربتي - ARABATY</h2>
  <p style="color: #666;">سوق السيارات الأول في السودان</p>
  <p style="color: #666;">Sudan's Premier Car Marketplace</p>
  <p style="margin-top: 20px; color: #E8A54B; font-weight: bold;">www.arabaty.app</p>
</div>

</body>
</html>
`;

async function sendEmail() {
  if (!process.env.BREVO_SMTP_LOGIN || !process.env.BREVO_SMTP_PASSWORD) {
    console.error("SMTP credentials not found");
    process.exit(1);
  }

  try {
    await emailTransporter.sendMail({
      from: `"Arabaty" <${process.env.BREVO_SMTP_LOGIN}>`,
      to: recipientEmail,
      subject: "عربتي - ملخص التطبيق للعروض والإعلانات | Arabaty App Summary for Presentations",
      html: emailContent,
    });
    console.log(`Email sent successfully to ${recipientEmail}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to send email:", error);
    process.exit(1);
  }
}

sendEmail();
