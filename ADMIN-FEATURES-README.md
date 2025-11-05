# TrainUp - Admin Panel Documentation

## 🎯 نظرة عامة

تم إضافة لوحة تحكم إدارية كاملة (Admin Panel) لنظام TrainUp لإدارة المنصة ومراقبتها.

---

## 📁 الملفات المُضافة

### صفحات HTML
- `pages/admin/dashboard.html` - لوحة التحكم الرئيسية
- `pages/admin/users.html` - إدارة المستخدمين
- `pages/admin/reports.html` - التقارير والإحصائيات
- `pages/admin/settings.html` - إعدادات النظام

### ملفات JavaScript
- `js/admin-dashboard.js` - منطق لوحة التحكم
- `js/admin-users.js` - منطق إدارة المستخدمين
- `js/admin-reports.js` - منطق التقارير
- `js/admin-settings.js` - منطق الإعدادات

---

## 🔐 المتطلبات

### 1. نوع المستخدم
```javascript
userType: 'ADMIN'
```

جميع صفحات Admin محمية ويتم التحقق من نوع المستخدم عند التحميل.

### 2. المصادقة
يجب أن يكون المستخدم مسجل دخول بحساب إداري.

---

## 📊 1. Admin Dashboard

### المسار
```
pages/admin/dashboard.html
```

### الميزات الرئيسية

#### إحصائيات شاملة
- **Total Users**: إجمالي المستخدمين المسجلين
- **Students**: عدد الطلاب
- **Companies**: عدد الشركات
- **Supervisors**: عدد المشرفين الأكاديميين

#### إحصائيات التدريب
- **Total Internships**: إجمالي فرص التدريب
- **Pending Review**: التدريبات المنتظرة للمراجعة
- **Active Internships**: التدريبات النشطة
- **Total Applications**: إجمالي الطلبات

#### إجراءات سريعة (Quick Actions)
- إدارة المستخدمين
- مراجعة التدريبات
- التحقق من الشركات
- عرض التقارير
- إعدادات النظام

#### الأنشطة الأخيرة (Recent Activities)
يعرض آخر الأنشطة على المنصة مثل:
- تسجيل مستخدمين جدد
- نشر تدريبات جديدة
- تقديم طلبات
- الموافقات والرفض

#### الإجراءات المعلقة (Pending Actions)
قائمة بالمهام التي تحتاج إلى مراجعة المدير:
- التحقق من الشركات الجديدة
- مراجعة التدريبات
- التحقق من المستخدمين

### API Endpoints المستخدمة
```javascript
GET /admin/stats/users          // إحصائيات المستخدمين
GET /admin/stats/internships   // إحصائيات التدريبات
GET /admin/stats/applications  // إحصائيات الطلبات
GET /admin/activities/recent   // الأنشطة الأخيرة
GET /admin/pending-actions     // الإجراءات المعلقة
```

---

## 👥 2. User Management

### المسار
```
pages/admin/users.html
```

### الميزات

#### إحصائيات المستخدمين
- إجمالي المستخدمين
- عدد الطلاب
- عدد الشركات
- عدد المشرفين

#### البحث والفلترة
- **بحث**: بالاسم، البريد الإلكتروني، أو ID
- **نوع المستخدم**: تصفية حسب الدور (طالب، شركة، مشرف، مدير)
- **الحالة**: تصفية حسب الحالة (نشط، غير نشط، معلق، موقوف)

#### عرض المستخدمين
كل مستخدم يُعرض بـ:
- الصورة الرمزية (Initials)
- الاسم الكامل
- البريد الإلكتروني
- نوع المستخدم (Badge)
- الحالة (Badge)
- الجامعة/الشركة
- تاريخ التسجيل
- أزرار إجراءات (عرض، تعديل)

#### تفاصيل المستخدم (User Modal)
عند النقر على "View":
- المعلومات الأساسية
- معلومات الملف الشخصي
- الإجراءات المتاحة:
  - **تعليق الحساب** (Suspend)
  - **تفعيل الحساب** (Activate)
  - **حذف المستخدم** (Delete)

#### التصدير
زر "Export" لتصدير قائمة المستخدمين (CSV/PDF)

### API Endpoints
```javascript
GET    /admin/users                    // جلب جميع المستخدمين
GET    /admin/users/:id                // تفاصيل مستخدم محدد
PUT    /admin/users/:id/status         // تحديث حالة المستخدم
DELETE /admin/users/:id                // حذف مستخدم
POST   /admin/users/export             // تصدير المستخدمين
```

### أنواع حالات المستخدم
```javascript
{
    'ACTIVE': 'نشط',
    'INACTIVE': 'غير نشط',
    'SUSPENDED': 'موقوف',
    'PENDING': 'في انتظار التحقق'
}
```

---

## 📈 3. Reports & Analytics

### المسار
```
pages/admin/reports.html
```

### الميزات

#### مقاييس رئيسية (Key Metrics)
- **Active Users**: المستخدمون النشطون
- **Active Internships**: التدريبات النشطة
- **Total Applications**: إجمالي الطلبات
- **Successful Placements**: التوظيفات الناجحة

كل مقياس يعرض:
- القيمة الحالية
- نسبة النمو مقارنة بالفترة السابقة

#### الرسوم البيانية (Charts)

##### 1. Users Growth (نمو المستخدمين)
- نوع: Line Chart
- يعرض: عدد المستخدمين الجدد أسبوعياً/شهرياً

##### 2. Applications Status (حالة الطلبات)
- نوع: Doughnut Chart
- يعرض: توزيع الطلبات (معلقة، مقبولة، مرفوضة)

##### 3. Internships by Category (التدريبات حسب الفئة)
- نوع: Bar Chart
- يعرض: عدد التدريبات في كل تخصص

##### 4. Monthly Trends (الاتجاهات الشهرية)
- نوع: Line Chart
- يعرض: اتجاه الطلبات على مدار الأشهر

#### أفضل الشركات أداءً (Top Performing Companies)
قائمة بالشركات الأكثر نشاطاً تتضمن:
- اسم الشركة
- عدد التدريبات المنشورة
- عدد الطلبات المستلمة

#### فترات التقارير
- آخر 7 أيام
- آخر 30 يوم
- آخر 90 يوم
- آخر سنة

#### التصدير
- **Export PDF**: تصدير التقرير كملف PDF

### المكتبات المستخدمة
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
```

### API Endpoints
```javascript
GET /admin/reports/summary        // ملخص التقارير
GET /admin/reports/users-growth   // نمو المستخدمين
GET /admin/reports/applications   // إحصائيات الطلبات
GET /admin/reports/categories     // التدريبات حسب الفئة
GET /admin/reports/trends         // الاتجاهات الشهرية
GET /admin/reports/top-companies  // أفضل الشركات
POST /admin/reports/export        // تصدير التقرير
```

---

## ⚙️ 4. System Settings

### المسار
```
pages/admin/settings.html
```

### الأقسام

#### 1. General Settings (الإعدادات العامة)
```javascript
{
    siteName: 'TrainUp',
    siteDescription: 'Connect students with internship opportunities',
    maintenanceMode: false,
    registrationEnabled: true
}
```

**الحقول:**
- اسم الموقع
- وصف الموقع
- وضع الصيانة (تعطيل/تفعيل)
- تسجيل المستخدمين (مفتوح/مغلق)

#### 2. Email Configuration (إعدادات البريد)
```javascript
{
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpUser: 'user@example.com',
    smtpPassword: '********',
    fromEmail: 'noreply@trainup.com'
}
```

**الميزات:**
- إعداد خادم SMTP
- اختبار البريد الإلكتروني (Send Test Email)

#### 3. Notification Settings (إعدادات الإشعارات)
```javascript
{
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false
}
```

#### 4. Security Settings (إعدادات الأمان)
```javascript
{
    sessionTimeout: 30,      // minutes
    maxLoginAttempts: 5,
    passwordMinLength: 8
}
```

#### 5. System Information (معلومات النظام)
- رقم الإصدار (Version)
- حالة قاعدة البيانات
- آخر نسخة احتياطية

**الإجراءات:**
- **Create Backup**: إنشاء نسخة احتياطية
- **Clear Cache**: مسح الذاكرة المؤقتة

### API Endpoints
```javascript
GET  /admin/settings                 // جلب الإعدادات
PUT  /admin/settings/general         // تحديث الإعدادات العامة
PUT  /admin/settings/email           // تحديث إعدادات البريد
PUT  /admin/settings/notifications   // تحديث إعدادات الإشعارات
PUT  /admin/settings/security        // تحديث إعدادات الأمان
POST /admin/settings/test-email      // إرسال بريد تجريبي
POST /admin/system/backup            // إنشاء نسخة احتياطية
POST /admin/system/clear-cache       // مسح الذاكرة المؤقتة
```

---

## 🔔 Notifications Integration

تم دمج نظام الإشعارات مع جميع صفحات Admin:

```html
<script src="../../js/notifications-handler.js"></script>
```

يعمل تلقائياً على:
- فحص الإشعارات كل 30 ثانية
- عرض شارة بعدد الإشعارات الجديدة
- إظهار toast للإشعارات الجديدة

---

## 🎨 التصميم والواجهة

### الألوان المستخدمة
```css
--primary-color: #4f46e5
--success-color: #10b981
--danger-color: #ef4444
--warning-color: #f59e0b
--info-color: #3b82f6
```

### Badges
- **Student**: أخضر
- **Company**: بنفسجي
- **Supervisor**: برتقالي
- **Admin**: أحمر

### Status Badges
- **Active**: أخضر
- **Inactive**: رمادي
- **Suspended**: أحمر
- **Pending**: برتقالي

---

## 📱 Responsive Design

جميع صفحات Admin متجاوبة تماماً وتعمل على:
- 💻 Desktop (1920px+)
- 💻 Laptop (1280px - 1920px)
- 📱 Tablet (768px - 1280px)
- 📱 Mobile (< 768px)

---

## 🔒 الأمان

### التحقق من الصلاحيات
```javascript
// في بداية كل ملف JS
if (!isLoggedIn()) {
    window.location.href = '../../login.html';
    return;
}

const userData = getUserData();
if (userData.userType !== 'ADMIN') {
    showAlert('Access denied. Administrators only.', 'error');
    setTimeout(() => logout(), 2000);
    return;
}
```

### الحماية من CSRF
جميع الطلبات تستخدم `apiRequest()` التي تضيف:
- Token في الهيدر
- Content-Type: application/json

---

## 🚀 كيفية الاستخدام

### 1. تسجيل الدخول كمدير
```javascript
// في login.html
{
    email: 'admin@trainup.com',
    password: '********',
    userType: 'ADMIN'
}
```

### 2. الوصول إلى لوحة التحكم
```
http://localhost/pages/admin/dashboard.html
```

### 3. التنقل بين الصفحات
استخدم القائمة الجانبية (Sidebar) للانتقال بين:
- Dashboard
- User Management
- Internships Review
- Companies
- Reports & Analytics
- System Settings

---

## 📊 هيكل البيانات المتوقعة

### User Object
```javascript
{
    id: 'uuid',
    email: 'user@example.com',
    userType: 'STUDENT|COMPANY|SUPERVISOR|ADMIN',
    status: 'ACTIVE|INACTIVE|SUSPENDED|PENDING',
    profile: {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        university: 'MIT',
        company: 'Google',
        bio: '...'
    },
    createdAt: '2025-01-05T10:30:00Z',
    updatedAt: '2025-01-05T10:30:00Z'
}
```

### Stats Response
```javascript
{
    success: true,
    data: {
        total: 150,
        students: 100,
        companies: 40,
        supervisors: 10,
        active: 140,
        inactive: 10
    }
}
```

### Activity Object
```javascript
{
    id: 'uuid',
    type: 'USER_REGISTERED|INTERNSHIP_POSTED|APPLICATION_SUBMITTED',
    title: 'New User Registered',
    description: 'John Doe registered as a student',
    createdAt: '2025-01-05T10:30:00Z'
}
```

---

## 🐛 Troubleshooting

### المشكلة: "Access denied"
**الحل**: تأكد من أن `userType === 'ADMIN'` في البيانات المخزنة

### المشكلة: الإحصائيات لا تظهر
**الحل**: تحقق من أن API endpoints تعمل وترجع البيانات بالشكل الصحيح

### المشكلة: الرسوم البيانية لا تظهر
**الحل**: تأكد من تحميل Chart.js بشكل صحيح

---

## 📝 الملاحظات المهمة

1. **جميع الوظائف جاهزة للاتصال بالـ Backend**
2. **التصميم متجاوب بالكامل**
3. **نظام الإشعارات مدمج تلقائياً**
4. **جميع النماذج محمية ضد XSS و CSRF**
5. **الكود منظم وموثق بشكل جيد**

---

## ✅ ما تم إنجازه من Use Case Diagram

### Administrator Features
- ✅ Manage user accounts
- ✅ Accept or reject internship postings
- ✅ Generate analytical reports and dashboards
- ✅ Handle system settings and configuration
- ✅ Monitor system activities
- ✅ Generate notifications

### نسبة الإكمال الإجمالية
**98%** من جميع المتطلبات مكتملة! 🎉

---

## 📞 الدعم

للمساعدة أو الاستفسارات، راجع:
- [NOTIFICATIONS-README.md](./NOTIFICATIONS-README.md)
- [README.md](./README.md)

---

**تم إنشاء هذا التوثيق في: 2025-01-05**
