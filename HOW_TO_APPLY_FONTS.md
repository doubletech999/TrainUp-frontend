# 📝 كيفية تطبيق الخط الجديد على جميع الصفحات

## 🎯 الهدف

إضافة خط **Inter** الاحترافي لجميع صفحات TrainUp.

---

## ⚡ الطريقة السريعة

### الخطوة 1: افتح أي صفحة HTML

مثال: `pages/student/dashboard.html`

### الخطوة 2: ابحث عن هذا السطر في `<head>`:

```html
<link rel="stylesheet" href="../../css/style.css">
```

### الخطوة 3: أضف هذا السطر **قبله**:

```html
<link rel="stylesheet" href="../../css/fonts.css">
<link rel="stylesheet" href="../../css/style.css">
```

### الخطوة 4: احفظ وشاهد النتيجة! 🎉

---

## 📋 مثال كامل

### قبل التعديل:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - TrainUp</title>

    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="../../css/dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
```

### بعد التعديل:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - TrainUp</title>

    <!-- ✅ أضف هذا السطر -->
    <link rel="stylesheet" href="../../css/fonts.css">

    <link rel="stylesheet" href="../../css/style.css">
    <link rel="stylesheet" href="../../css/dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
```

---

## 🗂️ قائمة الصفحات التي تحتاج التحديث

### 📁 Student Pages (pages/student/)
- ✅ dashboard.html
- ✅ internships.html
- ✅ my-applications.html
- ✅ evaluate-company.html
- ✅ messages.html
- ✅ profile.html

### 📁 Company Pages (pages/company/)
- ✅ dashboard.html
- ✅ create-internship.html
- ✅ edit-internship.html
- ✅ my-internships.html
- ✅ applications.html
- ✅ evaluate-intern.html
- ✅ profile.html

### 📁 Supervisor Pages (pages/supervisor/)
- ✅ dashboard.html
- ✅ companies.html
- ✅ internships.html
- ✅ students.html
- ✅ approve-completion.html
- ✅ profile.html

### 📁 Admin Pages (pages/admin/)
- ✅ dashboard.html
- ✅ users.html
- ✅ companies.html
- ✅ internships.html
- ✅ reports.html
- ✅ settings.html

### 📁 Root Pages (/)
- ✅ login.html
- ✅ register.html

---

## 🔍 ملاحظات مهمة

### 1. المسار الصحيح حسب الموقع:

| موقع الصفحة | المسار الصحيح |
|-------------|---------------|
| `pages/student/*.html` | `../../css/fonts.css` |
| `pages/company/*.html` | `../../css/fonts.css` |
| `pages/supervisor/*.html` | `../../css/fonts.css` |
| `pages/admin/*.html` | `../../css/fonts.css` |
| `login.html` أو `register.html` | `css/fonts.css` |

### 2. الترتيب مهم!
يجب أن يكون fonts.css **قبل** style.css

```html
✅ صحيح:
<link rel="stylesheet" href="../../css/fonts.css">
<link rel="stylesheet" href="../../css/style.css">

❌ خطأ:
<link rel="stylesheet" href="../../css/style.css">
<link rel="stylesheet" href="../../css/fonts.css">
```

### 3. اختياري (لكن مُوصى به)
إضافة fonts.css **اختيارية** - التصميم الجديد يعمل بدونها، لكن الخط سيكون أجمل معها!

---

## 🚀 بديل: استخدام Find & Replace

### في VS Code أو أي Editor:

#### 1. اضغط `Ctrl + Shift + H` (Find & Replace في جميع الملفات)

#### 2. ابحث عن:
```
<link rel="stylesheet" href="../../css/style.css">
```

#### 3. استبدل بـ:
```
<link rel="stylesheet" href="../../css/fonts.css">
    <link rel="stylesheet" href="../../css/style.css">
```

#### 4. اضغط "Replace All" في ملفات `pages/**/*.html`

---

## ✅ كيف تتأكد أنه يعمل؟

### 1. افتح الصفحة في المتصفح
### 2. افتح Developer Tools (F12)
### 3. اذهب لـ Network > Fonts
### 4. يجب أن ترى "Inter" يتم تحميله

أو ببساطة:
### 5. افتح Developer Tools (F12)
### 6. اذهب لـ Elements
### 7. انقر على `<body>`
### 8. في Computed Styles، ابحث عن `font-family`
### 9. يجب أن ترى: `Inter, -apple-system, ...`

---

## 💡 نصيحة احترافية

إذا كنت تستخدم Git، يمكنك عمل Commit بعد التحديث:

```bash
git add css/fonts.css pages/**/*.html
git commit -m "Add Inter font to all pages"
```

---

## 🎉 النتيجة النهائية

بعد إضافة fonts.css لجميع الصفحات:
- ✨ خط Inter الاحترافي في جميع النصوص
- ✨ قراءة أوضح وأفضل
- ✨ مظهر عصري ومتناسق
- ✨ تجربة مستخدم محسّنة

---

**ملاحظة**: إذا لم ترغب في تحديث جميع الصفحات دفعة واحدة، يمكنك البدء بالصفحات الأساسية:
1. login.html
2. register.html
3. pages/student/dashboard.html
4. pages/company/dashboard.html
5. pages/admin/dashboard.html

ثم أكمل باقي الصفحات لاحقاً! 🚀
