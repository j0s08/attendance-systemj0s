// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyBVAYfTy3wWhVkBObXu86zqwGKXUVh8194",
  authDomain: "attendancesystem2025-fa319.firebaseapp.com",
  projectId: "attendancesystem2025-fa319",
  storageBucket: "attendancesystem2025-fa319.firebasestorage.app",
  messagingSenderId: "458232564864",
  appId: "1:458232564864:web:dbab693f9d93e6469a2a65"
};

// Initialize Firebase
var app = firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var analytics = firebase.analytics();

// الإعدادات الافتراضية
let settings = {
    startHour: 9,
    endHour: 17,
    workshopLat: 26.09809958663478,
    workshopLng: 44.00278934722962,
    radius: 500,
    locationRestriction: true
};

// تحميل الإعدادات
function loadSettings() {
    db.collection("settings").doc("main").get().then((doc) => {
        if (doc.exists) {
            settings = doc.data();
        }
        updateUI();
    }).catch((error) => {
        console.log("Error getting document:", error);
    });
}

function updateUI() {
    document.getElementById('startHour').value = settings.startHour;
    document.getElementById('endHour').value = settings.endHour;
    document.getElementById('workshopLat').value = settings.workshopLat;
    document.getElementById('workshopLng').value = settings.workshopLng;
    document.getElementById('radius').value = settings.radius;
    updateLocationMessage();
}

// حفظ الإعدادات
function saveSettings() {
    settings.startHour = parseInt(document.getElementById('startHour').value) || 9;
    settings.endHour = parseInt(document.getElementById('endHour').value) || 17;
    settings.workshopLat = parseFloat(document.getElementById('workshopLat').value) || 26.09809958663478;
    settings.workshopLng = parseFloat(document.getElementById('workshopLng').value) || 44.00278934722962;
    settings.radius = parseInt(document.getElementById('radius').value) || 500;
    db.collection("settings").doc("main").set(settings).then(() => {
        alert('تم حفظ الإعدادات!');
    }).catch((error) => {
        alert('خطأ في الحفظ: ' + error.message);
    });
}

// نموذج التسجيل
document.getElementById('attendanceForm').addEventListener('submit', function(e) {
    e.preventDefault(); // منع الـreload
    
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const now = new Date();
    const hour = now.getHours();
    
    if (!name || !phone) {
        document.getElementById('message').textContent = 'يرجى إدخال الاسم ورقم الجوال.';
        return;
    }
    
    if (hour < settings.startHour || hour >= settings.endHour) {
        document.getElementById('message').textContent = `الحضور متاح فقط من ${settings.startHour} إلى ${settings.endHour}.`;
        return;
    }
    
    // تحقق من تكرار الحضور
    db.collection("records").get().then((querySnapshot) => {
        if (querySnapshot.docs.some(doc => doc.data().phone === phone && doc.data().date === now.toLocaleDateString('en-US'))) {
            document.getElementById('message').textContent = 'لقد سجلت حضورك بالفعل اليوم.';
            document.getElementById('message').style.color = 'red';
            return;
        }
        
        if (navigator.geolocation && settings.locationRestriction) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                const distance = getDistance(userLat, userLng, settings.workshopLat, settings.workshopLng);
                if (distance > settings.radius) {
                    document.getElementById('message').textContent = 'أنت خارج موقع الورشة. الحضور غير متاح.';
                    return;
                }
                
                const record = { name, phone, email, date: now.toLocaleDateString('en-US'), time: now.toLocaleTimeString('en-US') };
                saveRecord(record);
                document.getElementById('message').textContent = 'تم تسجيل حضورك بنجاح!';
                document.getElementById('message').style.color = 'green';
                document.getElementById('attendanceForm').reset(); // مسح الحقول
                
            }, function() {
                document.getElementById('message').textContent = 'يرجى السماح بالوصول إلى الموقع.';
            });
        } else {
            const record = { name, phone, email, date: now.toLocaleDateString('en-US'), time: now.toLocaleTimeString('en-US') };
            saveRecord(record);
            document.getElementById('message').textContent = 'تم تسجيل حضورك بنجاح!';
            document.getElementById('message').style.color = 'green';
            document.getElementById('attendanceForm').reset(); // مسح الحقول
        }
    }).catch((error) => {
        console.error("Error checking records:", error);
        document.getElementById('message').textContent = 'خطأ في التحقق، حاول مرة أخرى.';
    });
});

// دالة المسافة
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // نصف قطر الأرض بالمتر
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// حفظ السجل
function saveRecord(record) {
    db.collection("records").add(record).then(() => {
        console.log("Record saved successfully");
        loadRecords(); // تحديث السجلات تلقائياً
    }).catch((error) => {
        console.error("Error saving record: ", error);
        document.getElementById('message').textContent = 'خطأ في التسجيل، حاول مرة أخرى.';
    });
}

// لوحة الإدارة
document.getElementById('adminBtn').addEventListener('click', function(e) {
    e.preventDefault(); // منع أي سلوك غير مرغوب
    document.getElementById('loginForm').style.display = 'block';
});

document.getElementById('loginSubmit').addEventListener('click', function(e) {
    e.preventDefault(); // منع الـreload
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (username === 'yousef' && password === '1500') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadSettings();
        loadRecords();
    } else {
        document.getElementById('loginMessage').textContent = 'اسم أو كلمة مرور خاطئة!';
    }
});

document.getElementById('closeAdmin').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('adminPanel').style.display = 'none';
});

// حفظ الأوقات
document.getElementById('saveHours').addEventListener('click', function(e) {
    e.preventDefault();
    saveSettings();
});

// حفظ الموقع
document.getElementById('saveLocation').addEventListener('click', function(e) {
    e.preventDefault();
    saveSettings();
});

// تفعيل/تعطيل التقييد بالموقع
document.getElementById('toggleLocationRestriction').addEventListener('click', function(e) {
    e.preventDefault();
    settings.locationRestriction = !settings.locationRestriction;
    saveSettings();
    updateLocationMessage();
    if (!settings.locationRestriction) {
        document.getElementById('message').textContent = 'التقييد بالموقع معطل. يمكنك تسجيل الحضور من أي مكان.';
        document.getElementById('message').style.color = 'orange';
    }
});

// تحديث رسالة حالة التقييد بالموقع
function updateLocationMessage() {
    const locationMessage = document.getElementById('locationMessage');
    locationMessage.textContent = settings.locationRestriction ? 'التقييد بالموقع مفعل حالياً.' : 'التقييد بالموقع معطل حالياً.';
    locationMessage.style.color = settings.locationRestriction ? 'green' : 'red';
}

// عرض السجلات
function loadRecords() {
    const recordsList = document.getElementById('recordsList');
    recordsList.innerHTML = '';
    db.collection("records").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const rec = doc.data();
            const li = document.createElement('li');
            li.textContent = `${rec.name} - ${rec.phone} - ${rec.date} ${rec.time}`;
            recordsList.appendChild(li);
        });
    }).catch((error) => {
        console.error("Error loading records:", error);
    });
}

// تصدير Excel
document.getElementById('exportBtn').addEventListener('click', function(e) {
    e.preventDefault();
    db.collection("records").get().then((querySnapshot) => {
        const records = querySnapshot.docs.map(doc => doc.data());
        if (records.length === 0) {
            alert('لا توجد سجلات للتصدير.');
            return;
        }
        
        const ws_data = records.map(rec => ({
            'الاسم': rec.name,
            'رقم الجوال': rec.phone,
            'البريد': rec.email,
            'التاريخ': rec.date,
            'الوقت': rec.time
        }));
        
        const ws = XLSX.utils.json_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        XLSX.writeFile(wb, 'attendance.xlsx');
    }).catch((error) => {
        console.error("Error exporting records:", error);
    });
});

// حذف السجلات
document.getElementById('clearRecords').addEventListener('click', function(e) {
    e.preventDefault();
    if (confirm('هل أنت متأكد من حذف جميع السجلات؟')) {
        db.collection("records").get().then((querySnapshot) => {
            const batch = db.batch();
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            batch.commit().then(() => {
                loadRecords();
                alert('تم الحذف!');
            });
        }).catch((error) => {
            console.error("Error clearing records:", error);
        });
    }
});

window.onload = function() {
    loadSettings();
};
